"""State machine of a clear-cut report's assignment and validation workflow.

Each transition is declared once — who may trigger it, what must be true of the
report, what it changes, what happens afterwards — and `transition()` runs them
all the same way. The route layer only maps an URL to a `WorkflowAction`.

    to_validate ──(request → approve)──▶ in_progress ──(volunteer-validate)──▶
    waiting_for_validation ──(approve-validation)──▶ validated
                            └─(reject-validation)──▶ in_progress
"""

from collections.abc import Callable
from dataclasses import dataclass, field
from enum import StrEnum

from sqlalchemy.orm import Session

from app.common.errors import AppHTTPException
from app.models import ClearCutReport, User
from app.services.clear_cut_report import assign_report, unassign_report
from app.services.email import send_assignment_email, send_validation_rejected_email


class WorkflowAction(StrEnum):
    REQUEST_ASSIGNMENT = "request-assignment"
    CANCEL_REQUEST = "cancel-request"
    APPROVE_ASSIGNMENT = "approve-assignment"
    REJECT_ASSIGNMENT = "reject-assignment"
    UNASSIGN = "unassign"
    VOLUNTEER_VALIDATE = "volunteer-validate"
    APPROVE_VALIDATION = "approve-validation"
    REJECT_VALIDATION = "reject-validation"


Predicate = Callable[[ClearCutReport, User], bool]


@dataclass(frozen=True)
class Guard:
    """A condition on the report/user; raises `error` when it does not hold."""

    holds: Predicate
    status_code: int
    type: str
    detail: str


@dataclass(frozen=True)
class Transition:
    apply: Callable[[ClearCutReport, User], None]
    message: str
    # Role check, evaluated before the report is even loaded
    admin_only: str | None = None
    # Checks on the loaded report, in order
    guards: tuple[Guard, ...] = field(default_factory=tuple)
    # Side effect once the change is committed (emails)
    after_commit: Callable[[ClearCutReport], None] | None = None


def is_admin(_: ClearCutReport, user: User) -> bool:
    return user.role == "admin"


def is_owner(report: ClearCutReport, user: User) -> bool:
    return report.user_id == user.id


def has_status(*statuses: str) -> Predicate:
    return lambda report, _: report.status in statuses


def forbidden(holds: Predicate, detail: str) -> Guard:
    return Guard(holds, 403, "FORBIDDEN", detail)


def invalid_status(expected: str, verb: str) -> Guard:
    return Guard(
        has_status(expected),
        400,
        "INVALID_STATUS",
        f"Report must be {expected} to be {verb}",
    )


def _approve_assignment(report: ClearCutReport, _: User) -> None:
    assert report.assignment_requested_by_id is not None  # NO_REQUEST guard
    assign_report(report, report.assignment_requested_by_id)


def _unassign(report: ClearCutReport, _: User) -> None:
    unassign_report(report)


def _request_for_self(report: ClearCutReport, user: User) -> None:
    report.assignment_requested_by_id = user.id


def _clear_request(report: ClearCutReport, _: User) -> None:
    report.assignment_requested_by_id = None


def _set_status(status: str) -> Callable[[ClearCutReport, User], None]:
    def apply(report: ClearCutReport, _: User) -> None:
        report.status = status

    return apply


def _notify_assignment(report: ClearCutReport) -> None:
    if report.user is not None:
        send_assignment_email(report.user.email, report.id)


def _notify_rejection(report: ClearCutReport) -> None:
    if report.user is not None and report.user.email:
        send_validation_rejected_email(report.user.email, report.id)


TRANSITIONS: dict[WorkflowAction, Transition] = {
    WorkflowAction.REQUEST_ASSIGNMENT: Transition(
        guards=(
            Guard(
                lambda r, _: r.user_id is None,
                400,
                "ALREADY_ASSIGNED",
                "Report is already assigned",
            ),
            Guard(
                lambda r, _: r.assignment_requested_by_id is None,
                400,
                "REQUEST_PENDING",
                "An assignment request is already pending",
            ),
        ),
        apply=_request_for_self,
        message="Assignment request submitted, waiting for admin validation",
    ),
    WorkflowAction.CANCEL_REQUEST: Transition(
        guards=(
            forbidden(
                lambda r, u: r.assignment_requested_by_id == u.id,
                "You have no pending request for this report",
            ),
        ),
        apply=_clear_request,
        message="Assignment request cancelled",
    ),
    WorkflowAction.APPROVE_ASSIGNMENT: Transition(
        admin_only="Only admins can approve assignments",
        guards=(
            Guard(
                lambda r, _: r.assignment_requested_by_id is not None,
                400,
                "NO_REQUEST",
                "No pending assignment request",
            ),
        ),
        apply=_approve_assignment,
        after_commit=_notify_assignment,
        message="Assignment approved",
    ),
    WorkflowAction.REJECT_ASSIGNMENT: Transition(
        admin_only="Only admins can reject assignments",
        guards=(
            Guard(
                lambda r, _: r.assignment_requested_by_id is not None,
                400,
                "NO_REQUEST",
                "No pending assignment request",
            ),
        ),
        apply=_clear_request,
        message="Assignment request rejected",
    ),
    WorkflowAction.UNASSIGN: Transition(
        guards=(
            forbidden(
                lambda r, u: is_admin(r, u) or is_owner(r, u),
                "You are not assigned to this report",
            ),
        ),
        apply=_unassign,
        message="Unassigned successfully",
    ),
    WorkflowAction.VOLUNTEER_VALIDATE: Transition(
        guards=(
            forbidden(
                lambda r, u: is_admin(r, u) or is_owner(r, u),
                "You are not assigned to this report",
            ),
            invalid_status("in_progress", "submitted for validation"),
        ),
        apply=_set_status("waiting_for_validation"),
        message="Validation request submitted",
    ),
    WorkflowAction.APPROVE_VALIDATION: Transition(
        admin_only="Only admins can approve validations",
        guards=(invalid_status("waiting_for_validation", "approved"),),
        apply=_set_status("validated"),
        message="Validation approved",
    ),
    WorkflowAction.REJECT_VALIDATION: Transition(
        admin_only="Only admins can reject validations",
        guards=(invalid_status("waiting_for_validation", "rejected"),),
        apply=_set_status("in_progress"),
        after_commit=_notify_rejection,
        message="Validation rejected",
    ),
}


def transition(
    db: Session, report_id: int, action: WorkflowAction, user: User
) -> dict[str, str]:
    spec = TRANSITIONS[action]
    if spec.admin_only and user.role != "admin":
        raise AppHTTPException(
            status_code=403, type="FORBIDDEN", detail=spec.admin_only
        )

    report = db.get(ClearCutReport, report_id)
    if report is None:
        raise AppHTTPException(
            status_code=404, type="NOT_FOUND", detail="Report not found"
        )
    for guard in spec.guards:
        if not guard.holds(report, user):
            raise AppHTTPException(
                status_code=guard.status_code, type=guard.type, detail=guard.detail
            )

    spec.apply(report, user)
    db.commit()
    if spec.after_commit is not None:
        spec.after_commit(report)
    return {"message": spec.message}
