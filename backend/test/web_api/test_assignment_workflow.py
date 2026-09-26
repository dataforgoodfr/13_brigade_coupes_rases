import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import ClearCutReport
from test.common.user import get_admin_user_token, get_volunteer_user_token

REPORTS = "/api/v1/clear-cuts-reports"


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def free_report(db: Session, report_status: str = "to_validate") -> int:
    """Libère un signalement du jeu de données (aucun n'est libre) et renvoie
    son identifiant."""
    report = (
        db.query(ClearCutReport).filter(ClearCutReport.status == "to_validate").first()
    )
    assert report is not None
    report.user_id = None
    report.assignment_requested_by_id = None
    report.status = report_status
    db.commit()
    return report.id


def assign(db: Session, report_id: int, user_id: int) -> None:
    report = reload(db, report_id)
    report.user_id = user_id
    report.status = "in_progress"
    db.commit()


def reload(db: Session, report_id: int) -> ClearCutReport:
    # La fixture `client` ferme la session après chaque requête : on relit.
    report = db.get(ClearCutReport, report_id)
    assert report is not None
    return report


def error_type(response_json: dict[str, dict[str, str]]) -> str:
    return response_json["detail"]["type"]


def test_volunteer_requests_then_admin_approves(
    client: TestClient, db: Session
) -> None:
    volunteer, volunteer_token = get_volunteer_user_token(client, db)
    _, admin_token = get_admin_user_token(client, db, "admin@workflow.test")
    report_id = free_report(db)

    response = client.post(
        f"{REPORTS}/{report_id}/request-assignment", headers=auth(volunteer_token)
    )
    assert response.status_code == status.HTTP_200_OK
    report = reload(db, report_id)
    assert report.assignment_requested_by_id == volunteer.id
    assert report.user_id is None

    response = client.post(
        f"{REPORTS}/{report_id}/approve-assignment", headers=auth(admin_token)
    )
    assert response.status_code == status.HTTP_200_OK
    report = reload(db, report_id)
    assert report.user_id == volunteer.id
    assert report.assignment_requested_by_id is None
    assert report.status == "in_progress"

    data = client.get(f"{REPORTS}/{report_id}", headers=auth(volunteer_token)).json()
    assert data["affectedUser"]["email"] == volunteer.email
    assert data["status"] == "in_progress"


def test_request_is_refused_when_pending_or_assigned(
    client: TestClient, db: Session
) -> None:
    _, first_token = get_volunteer_user_token(client, db, "first@workflow.test")
    _, second_token = get_volunteer_user_token(client, db, "second@workflow.test")
    _, admin_token = get_admin_user_token(client, db, "admin@workflow.test")
    report_id = free_report(db)
    url = f"{REPORTS}/{report_id}/request-assignment"

    assert client.post(url, headers=auth(first_token)).status_code == 200

    response = client.post(url, headers=auth(second_token))
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_type(response.json()) == "REQUEST_PENDING"

    client.post(f"{REPORTS}/{report_id}/approve-assignment", headers=auth(admin_token))

    response = client.post(url, headers=auth(second_token))
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_type(response.json()) == "ALREADY_ASSIGNED"


def test_only_the_requester_can_cancel(client: TestClient, db: Session) -> None:
    _, first_token = get_volunteer_user_token(client, db, "first@workflow.test")
    _, second_token = get_volunteer_user_token(client, db, "second@workflow.test")
    report_id = free_report(db)
    client.post(f"{REPORTS}/{report_id}/request-assignment", headers=auth(first_token))

    response = client.post(
        f"{REPORTS}/{report_id}/cancel-request", headers=auth(second_token)
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN

    response = client.post(
        f"{REPORTS}/{report_id}/cancel-request", headers=auth(first_token)
    )
    assert response.status_code == status.HTTP_200_OK
    report = reload(db, report_id)
    assert report.assignment_requested_by_id is None


def test_admin_rejects_request(client: TestClient, db: Session) -> None:
    _, volunteer_token = get_volunteer_user_token(client, db)
    _, admin_token = get_admin_user_token(client, db, "admin@workflow.test")
    report_id = free_report(db)
    client.post(
        f"{REPORTS}/{report_id}/request-assignment", headers=auth(volunteer_token)
    )

    response = client.post(
        f"{REPORTS}/{report_id}/reject-assignment", headers=auth(admin_token)
    )
    assert response.status_code == status.HTTP_200_OK
    report = reload(db, report_id)
    assert report.assignment_requested_by_id is None
    assert report.user_id is None

    # Plus rien à approuver ni à rejeter.
    for action in ("approve-assignment", "reject-assignment"):
        response = client.post(
            f"{REPORTS}/{report_id}/{action}", headers=auth(admin_token)
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert error_type(response.json()) == "NO_REQUEST"


@pytest.mark.parametrize(
    "action",
    [
        "approve-assignment",
        "reject-assignment",
        "approve-validation",
        "reject-validation",
    ],
)
def test_admin_actions_are_forbidden_to_volunteers(
    client: TestClient, db: Session, action: str
) -> None:
    _, volunteer_token = get_volunteer_user_token(client, db)
    report_id = free_report(db)

    response = client.post(
        f"{REPORTS}/{report_id}/{action}", headers=auth(volunteer_token)
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_unassign_resets_status_and_is_restricted(
    client: TestClient, db: Session
) -> None:
    assigned, assigned_token = get_volunteer_user_token(
        client, db, "first@workflow.test"
    )
    _, other_token = get_volunteer_user_token(client, db, "second@workflow.test")
    _, admin_token = get_admin_user_token(client, db, "admin@workflow.test")
    report_id = free_report(db)
    assign(db, report_id, assigned.id)

    response = client.post(f"{REPORTS}/{report_id}/unassign", headers=auth(other_token))
    assert response.status_code == status.HTTP_403_FORBIDDEN

    response = client.post(
        f"{REPORTS}/{report_id}/unassign", headers=auth(assigned_token)
    )
    assert response.status_code == status.HTTP_200_OK
    report = reload(db, report_id)
    assert report.user_id is None
    assert report.status == "to_validate"

    # Un administrateur peut désaffecter n'importe quel signalement.
    assign(db, report_id, assigned.id)
    response = client.post(f"{REPORTS}/{report_id}/unassign", headers=auth(admin_token))
    assert response.status_code == status.HTTP_200_OK
    report = reload(db, report_id)
    assert report.user_id is None


def test_validation_round_trip_with_rejection(client: TestClient, db: Session) -> None:
    assigned, assigned_token = get_volunteer_user_token(
        client, db, "first@workflow.test"
    )
    _, other_token = get_volunteer_user_token(client, db, "second@workflow.test")
    _, admin_token = get_admin_user_token(client, db, "admin@workflow.test")
    report_id = free_report(db)
    assign(db, report_id, assigned.id)
    validate = f"{REPORTS}/{report_id}/volunteer-validate"

    # Seul le bénévole affecté peut soumettre.
    assert client.post(validate, headers=auth(other_token)).status_code == 403

    assert client.post(validate, headers=auth(assigned_token)).status_code == 200
    report = reload(db, report_id)
    assert report.status == "waiting_for_validation"

    # Soumettre deux fois n'est pas possible.
    response = client.post(validate, headers=auth(assigned_token))
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_type(response.json()) == "INVALID_STATUS"

    # Refus : retour en cours de saisie.
    response = client.post(
        f"{REPORTS}/{report_id}/reject-validation", headers=auth(admin_token)
    )
    assert response.status_code == status.HTTP_200_OK
    report = reload(db, report_id)
    assert report.status == "in_progress"

    # Nouvelle soumission puis approbation.
    assert client.post(validate, headers=auth(assigned_token)).status_code == 200
    response = client.post(
        f"{REPORTS}/{report_id}/approve-validation", headers=auth(admin_token)
    )
    assert response.status_code == status.HTTP_200_OK
    report = reload(db, report_id)
    assert report.status == "validated"


def test_validation_decisions_require_waiting_status(
    client: TestClient, db: Session
) -> None:
    _, admin_token = get_admin_user_token(client, db, "admin@workflow.test")
    report_id = free_report(db)

    for action in ("approve-validation", "reject-validation"):
        response = client.post(
            f"{REPORTS}/{report_id}/{action}", headers=auth(admin_token)
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert error_type(response.json()) == "INVALID_STATUS"


def test_admin_can_submit_any_in_progress_report(
    client: TestClient, db: Session
) -> None:
    _, admin_token = get_admin_user_token(client, db, "admin@workflow.test")
    report_id = free_report(db, "in_progress")

    response = client.post(
        f"{REPORTS}/{report_id}/volunteer-validate", headers=auth(admin_token)
    )

    assert response.status_code == status.HTTP_200_OK
    report = reload(db, report_id)
    assert report.status == "waiting_for_validation"


@pytest.mark.parametrize(
    "action",
    [
        "request-assignment",
        "cancel-request",
        "approve-assignment",
        "reject-assignment",
        "unassign",
        "volunteer-validate",
        "approve-validation",
        "reject-validation",
    ],
)
def test_workflow_on_unknown_report_returns_not_found(
    client: TestClient, db: Session, action: str
) -> None:
    _, admin_token = get_admin_user_token(client, db, "admin@workflow.test")

    response = client.post(f"{REPORTS}/999999/{action}", headers=auth(admin_token))

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.parametrize("action", ["request-assignment", "approve-validation"])
def test_workflow_requires_authentication(client: TestClient, action: str) -> None:
    assert client.post(f"{REPORTS}/1/{action}").status_code == 401


# H1 — l'attribution directe (PUT) a les mêmes effets que l'approbation.


def test_direct_assignment_starts_the_report_and_allows_validation(
    client: TestClient, db: Session
) -> None:
    volunteer, volunteer_token = get_volunteer_user_token(client, db)
    report_id = free_report(db)

    response = client.put(
        f"{REPORTS}/{report_id}",
        json={"userId": str(volunteer.id)},
        headers=auth(volunteer_token),
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    report = reload(db, report_id)
    assert report.user_id == volunteer.id
    assert report.status == "in_progress"

    response = client.post(
        f"{REPORTS}/{report_id}/volunteer-validate", headers=auth(volunteer_token)
    )
    assert response.status_code == status.HTTP_200_OK
    assert reload(db, report_id).status == "waiting_for_validation"


def test_admin_direct_assignment_clears_pending_request(
    client: TestClient, db: Session
) -> None:
    requester, requester_token = get_volunteer_user_token(
        client, db, "first@workflow.test"
    )
    other, _ = get_volunteer_user_token(client, db, "second@workflow.test")
    _, admin_token = get_admin_user_token(client, db, "admin@workflow.test")
    report_id = free_report(db)
    client.post(
        f"{REPORTS}/{report_id}/request-assignment", headers=auth(requester_token)
    )

    response = client.put(
        f"{REPORTS}/{report_id}",
        json={"userId": str(other.id)},
        headers=auth(admin_token),
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    report = reload(db, report_id)
    assert report.user_id == other.id
    assert report.assignment_requested_by_id is None
    assert report.status == "in_progress"


# H4 — pas de signalement en cours ou en attente de validation sans titulaire.


@pytest.mark.parametrize("path", ["unassign", "put"])
def test_unassigning_a_report_awaiting_validation_returns_it_to_the_pool(
    client: TestClient, db: Session, path: str
) -> None:
    volunteer, _ = get_volunteer_user_token(client, db)
    _, admin_token = get_admin_user_token(client, db, "admin@workflow.test")
    report_id = free_report(db)
    assign(db, report_id, volunteer.id)
    report = reload(db, report_id)
    report.status = "waiting_for_validation"
    db.commit()

    if path == "unassign":
        response = client.post(
            f"{REPORTS}/{report_id}/unassign", headers=auth(admin_token)
        )
    else:
        response = client.put(
            f"{REPORTS}/{report_id}", json={"userId": None}, headers=auth(admin_token)
        )
    assert response.status_code in (status.HTTP_200_OK, status.HTTP_204_NO_CONTENT)
    report = reload(db, report_id)
    assert report.user_id is None
    assert report.status == "to_validate"


def test_unassigning_keeps_a_decided_status(client: TestClient, db: Session) -> None:
    volunteer, _ = get_volunteer_user_token(client, db)
    _, admin_token = get_admin_user_token(client, db, "admin@workflow.test")
    report_id = free_report(db)
    assign(db, report_id, volunteer.id)
    report = reload(db, report_id)
    report.status = "validated"
    db.commit()

    client.post(f"{REPORTS}/{report_id}/unassign", headers=auth(admin_token))

    report = reload(db, report_id)
    assert report.user_id is None
    assert report.status == "validated"


@pytest.mark.parametrize(
    "locked_status",
    [
        "waiting_for_validation",
        "validated",
        "legal_validated",
        "final_validated",
        "rejected",
    ],
)
def test_assigned_volunteer_cannot_edit_a_locked_form(
    client: TestClient, db: Session, locked_status: str
) -> None:
    volunteer, volunteer_token = get_volunteer_user_token(client, db)
    report_id = free_report(db)
    assign(db, report_id, volunteer.id)
    report = reload(db, report_id)
    report.status = locked_status
    db.commit()

    response = client.post(
        f"{REPORTS}/{report_id}/forms",
        json={"inspectionDate": "2026-10-17T10:00:00"},
        headers=auth(volunteer_token),
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert error_type(response.json()) == "FORM_LOCKED"
