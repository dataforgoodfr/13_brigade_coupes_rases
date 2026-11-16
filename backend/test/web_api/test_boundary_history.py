from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import ClearCutBoundaryHistory, ClearCutReport
from test.common.user import get_admin_user_token, get_volunteer_user_token
from test.web_api.test_clear_cut_edition import QUARTER, SQUARE, first_clear_cut


def history_url(clear_cut_id: int) -> str:
    return f"/api/v1/clear-cuts/{clear_cut_id}/boundary-history"


def test_each_perimeter_correction_keeps_the_previous_one(
    db: Session, client: TestClient
) -> None:
    [admin, token] = get_admin_user_token(client, db)
    headers = {"Authorization": f"Bearer {token}"}
    clear_cut = first_clear_cut(db)
    clear_cut_id = clear_cut.id
    original_area = clear_cut.area_hectare

    client.patch(
        f"/api/v1/clear-cuts/{clear_cut_id}", json={"boundary": SQUARE}, headers=headers
    )
    client.patch(
        f"/api/v1/clear-cuts/{clear_cut_id}",
        json={"boundary": QUARTER},
        headers=headers,
    )

    response = client.get(history_url(clear_cut_id), headers=headers)
    assert response.status_code == status.HTTP_200_OK
    history = response.json()
    assert len(history) == 2
    # Most recent first: the square, replaced by the quarter
    assert history[0]["editedBy"] == admin.login
    assert 95 < history[0]["previousAreaHectare"] < 105
    assert history[0]["previousBoundary"]["type"] == "MultiPolygon"
    # Then the perimeter detected by the pipeline
    assert history[1]["previousAreaHectare"] == original_area


def test_a_date_correction_adds_nothing(db: Session, client: TestClient) -> None:
    [_, token] = get_admin_user_token(client, db)
    clear_cut_id = first_clear_cut(db).id

    client.patch(
        f"/api/v1/clear-cuts/{clear_cut_id}",
        json={"observationEndDate": "2024-03-01T00:00:00"},
        headers={"Authorization": f"Bearer {token}"},
    )
    count = (
        db.query(ClearCutBoundaryHistory)
        .filter(ClearCutBoundaryHistory.clear_cut_id == clear_cut_id)
        .count()
    )
    assert count == 0


def test_the_assigned_volunteer_correction_is_recorded(
    db: Session, client: TestClient
) -> None:
    [volunteer, token] = get_volunteer_user_token(client, db, "field@history.test")
    report = db.get(ClearCutReport, 1)
    assert report is not None
    report.user_id = volunteer.id
    db.commit()
    clear_cut_id = first_clear_cut(db).id

    response = client.patch(
        f"/api/v1/clear-cuts/{clear_cut_id}",
        json={"boundary": SQUARE},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_200_OK

    entry = (
        db.query(ClearCutBoundaryHistory)
        .filter(ClearCutBoundaryHistory.clear_cut_id == clear_cut_id)
        .one()
    )
    assert entry.edited_by_id == volunteer.id


def test_only_admins_read_the_history(db: Session, client: TestClient) -> None:
    clear_cut_id = first_clear_cut(db).id
    [_, token] = get_volunteer_user_token(client, db, "reader@history.test")

    response = client.get(
        history_url(clear_cut_id), headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert (
        client.get(history_url(clear_cut_id)).status_code
        == status.HTTP_401_UNAUTHORIZED
    )


def test_unknown_clear_cut(db: Session, client: TestClient) -> None:
    [_, token] = get_admin_user_token(client, db)
    response = client.get(
        history_url(999999), headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
