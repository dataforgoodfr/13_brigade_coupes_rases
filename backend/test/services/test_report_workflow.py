"""The workflow table itself, without HTTP or database: guards and effects
are plain functions over a report and a user."""

import pytest

from app.models import ClearCutReport, User
from app.services.report_workflow import TRANSITIONS, Guard, WorkflowAction

# Transient instances: never added to a session
ADMIN = User(id=1, role="admin")
ALICE = User(id=2, role="volunteer")
BOB = User(id=3, role="volunteer")


def report(
    status: str = "to_validate",
    user_id: int | None = None,
    assignment_requested_by_id: int | None = None,
) -> ClearCutReport:
    return ClearCutReport(
        id=10,
        status=status,
        user_id=user_id,
        assignment_requested_by_id=assignment_requested_by_id,
    )


def failing_guard(
    action: WorkflowAction, rep: ClearCutReport, user: User
) -> Guard | None:
    return next((g for g in TRANSITIONS[action].guards if not g.holds(rep, user)), None)


def test_every_action_has_a_transition() -> None:
    assert set(TRANSITIONS) == set(WorkflowAction)


@pytest.mark.parametrize(
    ("action", "rep", "user", "expected_type"),
    [
        (
            WorkflowAction.REQUEST_ASSIGNMENT,
            report(user_id=BOB.id),
            ALICE,
            "ALREADY_ASSIGNED",
        ),
        (
            WorkflowAction.REQUEST_ASSIGNMENT,
            report(assignment_requested_by_id=BOB.id),
            ALICE,
            "REQUEST_PENDING",
        ),
        (
            WorkflowAction.CANCEL_REQUEST,
            report(assignment_requested_by_id=BOB.id),
            ALICE,
            "FORBIDDEN",
        ),
        (WorkflowAction.APPROVE_ASSIGNMENT, report(), ADMIN, "NO_REQUEST"),
        (WorkflowAction.UNASSIGN, report(user_id=BOB.id), ALICE, "FORBIDDEN"),
        (
            WorkflowAction.VOLUNTEER_VALIDATE,
            report(user_id=ALICE.id, status="to_validate"),
            ALICE,
            "INVALID_STATUS",
        ),
        (
            WorkflowAction.APPROVE_VALIDATION,
            report(status="in_progress"),
            ADMIN,
            "INVALID_STATUS",
        ),
    ],
)
def test_guards_reject_invalid_situations(
    action: WorkflowAction, rep: ClearCutReport, user: User, expected_type: str
) -> None:
    guard = failing_guard(action, rep, user)
    assert guard is not None and guard.type == expected_type


@pytest.mark.parametrize(
    ("action", "rep", "user"),
    [
        (WorkflowAction.REQUEST_ASSIGNMENT, report(), ALICE),
        (WorkflowAction.UNASSIGN, report(user_id=BOB.id), ADMIN),
        (
            WorkflowAction.VOLUNTEER_VALIDATE,
            report(user_id=BOB.id, status="in_progress"),
            ADMIN,
        ),
        (
            WorkflowAction.REJECT_VALIDATION,
            report(status="waiting_for_validation"),
            ADMIN,
        ),
    ],
)
def test_guards_accept_valid_situations(
    action: WorkflowAction, rep: ClearCutReport, user: User
) -> None:
    assert failing_guard(action, rep, user) is None


def test_admin_only_actions() -> None:
    admin_only = {a for a, t in TRANSITIONS.items() if t.admin_only}
    assert admin_only == {
        WorkflowAction.APPROVE_ASSIGNMENT,
        WorkflowAction.REJECT_ASSIGNMENT,
        WorkflowAction.APPROVE_VALIDATION,
        WorkflowAction.REJECT_VALIDATION,
    }


def test_full_journey_through_apply() -> None:
    rep = report()
    TRANSITIONS[WorkflowAction.REQUEST_ASSIGNMENT].apply(rep, ALICE)
    assert rep.assignment_requested_by_id == ALICE.id

    TRANSITIONS[WorkflowAction.APPROVE_ASSIGNMENT].apply(rep, ADMIN)
    assert rep.user_id == ALICE.id
    assert rep.status == "in_progress"
    assert rep.assignment_requested_by_id is None

    TRANSITIONS[WorkflowAction.VOLUNTEER_VALIDATE].apply(rep, ALICE)
    assert rep.status == "waiting_for_validation"

    TRANSITIONS[WorkflowAction.REJECT_VALIDATION].apply(rep, ADMIN)
    assert rep.status == "in_progress"

    TRANSITIONS[WorkflowAction.UNASSIGN].apply(rep, ALICE)
    assert (rep.user_id, rep.status) == (None, "to_validate")


def test_unassign_from_waiting_for_validation_returns_to_the_pool() -> None:
    rep = report(user_id=ALICE.id, status="waiting_for_validation")
    TRANSITIONS[WorkflowAction.UNASSIGN].apply(rep, ADMIN)
    assert (rep.user_id, rep.status) == (None, "to_validate")
