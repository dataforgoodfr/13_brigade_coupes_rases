from datetime import datetime

from fastapi import status
from fastapi.testclient import TestClient
from geoalchemy2.elements import WKTElement
from sqlalchemy.orm import Session

from app.models import SRID, City, ClearCutForm, ClearCutReport
from app.services.clear_cut_report import find_report_by_fingerprint
from app.services.idempotency import commit_once
from test.common.user import get_admin_user_token, get_volunteer_user_token

MINIMAL_FORM = {"inspectionDate": "2025-07-31T20:16:13.358000"}


def square(lng: float) -> dict[str, object]:
    return {
        "type": "Polygon",
        "coordinates": [
            [[lng, 45.0], [lng + 0.01, 45.0], [lng + 0.01, 45.01], [lng, 45.0]]
        ],
    }


def volunteer_create(
    client: TestClient, token: str, city: City, lng: float
) -> dict[str, str]:
    response = client.post(
        "/api/v1/clear-cuts-reports/volunteer-create",
        json={"polygon": square(lng), "cityZipCode": city.zip_code},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_201_CREATED
    return response.json()


def test_resent_report_is_created_once(client: TestClient, db: Session) -> None:
    token = get_volunteer_user_token(client, db)[1]
    city = db.query(City).first()
    assert city is not None
    count = db.query(ClearCutReport).count()

    first = volunteer_create(client, token, city, 1.0)
    second = volunteer_create(client, token, city, 1.0)

    assert second["id"] == first["id"]
    assert db.query(ClearCutReport).count() == count + 1


def test_different_reports_are_all_created(client: TestClient, db: Session) -> None:
    token = get_volunteer_user_token(client, db)[1]
    city = db.query(City).first()
    assert city is not None

    first = volunteer_create(client, token, city, 1.0)
    second = volunteer_create(client, token, city, 2.0)

    assert second["id"] != first["id"]


def test_concurrent_copy_returns_the_committed_report(db: Session) -> None:
    """Two copies checked the fingerprint before either was saved: the second
    insert hits the unique constraint and gets the first report back."""
    city = db.query(City).first()
    assert city is not None

    def new_report() -> ClearCutReport:
        return ClearCutReport(
            city=city,
            status="to_validate",
            average_location=WKTElement("POINT(1 45)", srid=SRID),
            last_cut_date=datetime.now(),
            first_cut_date=datetime.now(),
            request_fingerprint="f" * 64,
        )

    first = commit_once(db, new_report(), lambda: None)
    second = commit_once(
        db, new_report(), lambda: find_report_by_fingerprint(db, "f" * 64)
    )

    assert second.id == first.id


def report_without_form(db: Session) -> int:
    report = (
        db.query(ClearCutReport)
        .filter(
            ~ClearCutReport.clear_cut_forms.any(),
            ClearCutReport.status == "to_validate",
        )
        .first()
    )
    assert report is not None
    return report.id


def test_resent_form_is_saved_once(client: TestClient, db: Session) -> None:
    token = get_admin_user_token(client, db)[1]
    report_id = report_without_form(db)
    url = f"/api/v1/clear-cuts-reports/{report_id}/forms"
    headers = {"Authorization": f"Bearer {token}"}

    first = client.post(url, json=MINIMAL_FORM, headers=headers)
    # A copy of the first request: same content, same (absent) ETag, which no
    # longer matches the version it created
    second = client.post(url, json=MINIMAL_FORM, headers=headers)

    assert second.status_code == status.HTTP_201_CREATED
    assert second.headers["location"] == first.headers["location"]
    assert (
        db.query(ClearCutForm).filter(ClearCutForm.report_id == report_id).count() == 1
    )


def test_outdated_form_is_still_refused(client: TestClient, db: Session) -> None:
    token = get_admin_user_token(client, db)[1]
    report_id = report_without_form(db)
    url = f"/api/v1/clear-cuts-reports/{report_id}/forms"
    headers = {"Authorization": f"Bearer {token}"}

    assert client.post(url, json=MINIMAL_FORM, headers=headers).status_code == 201
    other = {**MINIMAL_FORM, "weather": "pluie"}
    response = client.post(url, json=other, headers=headers)

    assert response.status_code == status.HTTP_409_CONFLICT
