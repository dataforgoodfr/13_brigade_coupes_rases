from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import ClearCut, ClearCutReport
from test.common.user import get_admin_user_token, get_volunteer_user_token

# Roughly a 1 km × 1 km square near Paris: about 100 ha
SQUARE = {
    "type": "MultiPolygon",
    "coordinates": [
        [
            [
                [2.35, 48.85],
                [2.3636, 48.85],
                [2.3636, 48.859],
                [2.35, 48.859],
                [2.35, 48.85],
            ]
        ]
    ],
}


def first_clear_cut(db: Session, report_id: int = 1) -> ClearCut:
    report = db.get(ClearCutReport, report_id)
    assert report is not None
    return report.clear_cuts[0]


def test_admin_can_edit_observation_dates(db: Session, client: TestClient) -> None:
    [_, token] = get_admin_user_token(client, db)
    clear_cut = first_clear_cut(db)

    response = client.patch(
        f"/api/v1/clear-cuts/{clear_cut.id}",
        json={"observationStartDate": "2024-02-01T00:00:00"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["observationStartDate"].startswith("2024-02-01")
    assert data["isManuallyEdited"] is True
    assert data["allowPipelineOverride"] is False

    db.expire_all()
    report = db.get(ClearCutReport, 1)
    assert report is not None
    assert report.first_cut_date is not None
    assert report.first_cut_date.date().isoformat() <= "2024-02-01"


def test_edit_boundary_recomputes_area_and_centroid(
    db: Session, client: TestClient
) -> None:
    [_, token] = get_admin_user_token(client, db)
    clear_cut = first_clear_cut(db)
    previous_area = clear_cut.area_hectare

    response = client.patch(
        f"/api/v1/clear-cuts/{clear_cut.id}",
        json={"boundary": SQUARE},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["areaHectare"] != previous_area
    assert 95 < data["areaHectare"] < 105
    longitude, latitude = data["location"]["coordinates"]
    assert abs(latitude - 48.8545) < 0.001
    assert abs(longitude - 2.3568) < 0.001
    assert data["boundary"]["coordinates"][0][0][1] == [2.3636, 48.85]


def test_volunteer_not_assigned_cannot_edit(db: Session, client: TestClient) -> None:
    [_, token] = get_volunteer_user_token(client, db, "stranger@volunteer.com")
    clear_cut = first_clear_cut(db)

    response = client.patch(
        f"/api/v1/clear-cuts/{clear_cut.id}",
        json={"observationEndDate": "2024-03-01T00:00:00"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["detail"]["type"] == "INVALID_REQUESTER_RIGHTS"


def test_assigned_volunteer_can_edit(db: Session, client: TestClient) -> None:
    [me, token] = get_volunteer_user_token(client, db, "assigned@volunteer.com")
    report = db.get(ClearCutReport, 1)
    assert report is not None
    report.user_id = me.id
    db.commit()

    response = client.patch(
        f"/api/v1/clear-cuts/{report.clear_cuts[0].id}",
        json={"observationEndDate": "2024-03-01T00:00:00"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["isManuallyEdited"] is True


def test_patch_unknown_clear_cut(db: Session, client: TestClient) -> None:
    [_, token] = get_admin_user_token(client, db)
    response = client.patch(
        "/api/v1/clear-cuts/999999",
        json={"observationEndDate": "2024-03-01T00:00:00"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_empty_patch_does_not_flag_manual_edition(
    db: Session, client: TestClient
) -> None:
    [_, token] = get_admin_user_token(client, db)
    clear_cut = first_clear_cut(db)
    response = client.patch(
        f"/api/v1/clear-cuts/{clear_cut.id}",
        json={},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["isManuallyEdited"] is False


def test_admin_can_edit_report_info(db: Session, client: TestClient) -> None:
    [_, token] = get_admin_user_token(client, db)
    response = client.put(
        "/api/v1/clear-cuts-reports/1",
        json={"reportedAt": "2024-05-01T00:00:00", "cityZipCode": "75056"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

    response = client.get(
        "/api/v1/clear-cuts-reports/1",
        headers={"Authorization": f"Bearer {token}"},
    )
    data = response.json()
    assert data["reportedAt"] == "2024-05-01"
    assert data["city"] == "Paris"


def test_volunteer_not_assigned_cannot_edit_report_info(
    db: Session, client: TestClient
) -> None:
    [_, token] = get_volunteer_user_token(client, db, "stranger@volunteer.com")
    response = client.put(
        "/api/v1/clear-cuts-reports/1",
        json={"reportedAt": "2024-05-01T00:00:00"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_pipeline_override_toggle(db: Session, client: TestClient) -> None:
    [_, token] = get_admin_user_token(client, db)
    clear_cut = first_clear_cut(db)

    client.patch(
        f"/api/v1/clear-cuts/{clear_cut.id}",
        json={"observationEndDate": "2024-03-01T00:00:00"},
        headers={"Authorization": f"Bearer {token}"},
    )

    response = client.post(
        "/api/v1/clear-cuts-reports/1/pipeline-override",
        json={"allow": True},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"allowPipelineOverride": True}
    db.expire_all()
    assert all(
        cut.allow_pipeline_override for cut in first_clear_cut(db).report.clear_cuts
    )

    # A new manual correction locks the cut again
    response = client.patch(
        f"/api/v1/clear-cuts/{clear_cut.id}",
        json={"observationEndDate": "2024-04-01T00:00:00"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.json()["allowPipelineOverride"] is False


def test_pipeline_override_requires_rights(db: Session, client: TestClient) -> None:
    [_, token] = get_volunteer_user_token(client, db, "stranger@volunteer.com")
    response = client.post(
        "/api/v1/clear-cuts-reports/1/pipeline-override",
        json={"allow": True},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
