from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import ClearCutReport
from test.common.user import get_admin_user_token, get_volunteer_user_token

URL = "/api/v1/clear-cuts-reports/1/priority"


def get_report(db: Session) -> ClearCutReport:
    db.expire_all()
    report = db.get(ClearCutReport, 1)
    assert report is not None
    return report


def test_admin_marks_and_unmarks_a_report(db: Session, client: TestClient) -> None:
    [admin, token] = get_admin_user_token(client, db)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(URL, json={"prioritized": True}, headers=headers)
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"prioritized": True}
    report = get_report(db)
    assert report.prioritized_at is not None
    assert report.prioritized_by_id == admin.id

    response = client.post(URL, json={"prioritized": False}, headers=headers)
    assert response.json() == {"prioritized": False}
    report = get_report(db)
    assert report.prioritized_at is None
    assert report.prioritized_by_id is None


def test_marking_twice_keeps_the_first_date(db: Session, client: TestClient) -> None:
    [_, token] = get_admin_user_token(client, db)
    headers = {"Authorization": f"Bearer {token}"}

    client.post(URL, json={"prioritized": True}, headers=headers)
    first = get_report(db).prioritized_at
    client.post(URL, json={"prioritized": True}, headers=headers)
    assert get_report(db).prioritized_at == first


def test_volunteer_cannot_mark_a_report(db: Session, client: TestClient) -> None:
    [_, token] = get_volunteer_user_token(client, db)
    response = client.post(
        URL, json={"prioritized": True}, headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert get_report(db).prioritized_at is None


def test_anonymous_cannot_mark_a_report(db: Session, client: TestClient) -> None:
    response = client.post(URL, json={"prioritized": True})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_unknown_report(db: Session, client: TestClient) -> None:
    [_, token] = get_admin_user_token(client, db)
    response = client.post(
        "/api/v1/clear-cuts-reports/999999/priority",
        json={"prioritized": True},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_only_admins_see_the_mark(db: Session, client: TestClient) -> None:
    [_, admin_token] = get_admin_user_token(client, db)
    client.post(
        URL,
        json={"prioritized": True},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    as_admin = client.get(
        "/api/v1/clear-cuts-reports/1",
        headers={"Authorization": f"Bearer {admin_token}"},
    ).json()
    assert as_admin["prioritized"] is True

    [_, volunteer_token] = get_volunteer_user_token(
        client, db, "volunteer@priority.test"
    )
    as_volunteer = client.get(
        "/api/v1/clear-cuts-reports/1",
        headers={"Authorization": f"Bearer {volunteer_token}"},
    ).json()
    assert "prioritized" not in as_volunteer
    assert "prioritized" not in client.get("/api/v1/clear-cuts-reports/1").json()
