from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import ClearCutForm, ClearCutReport
from test.common.user import create_user, get_admin_user_token, get_volunteer_user_token

MINIMAL_FORM = {"inspectionDate": "2025-07-31T20:16:13.358000"}


def test_create_version_success(client: TestClient, db: Session) -> None:
    token = get_admin_user_token(client, db)[1]

    report_data = {
        "relevantForPefcComplaint": True,
        "relevantForRediiiComplaint": True,
        "relevantForOfbComplaint": True,
        "relevantForAlertCnpfDdtSrgs": True,
        "relevantForAlertCnpfDdtPsgThresholds": True,
        "relevantForPsgRequest": True,
        "requestEngaged": "string",
        "other": "string",
        "isPefcFscCertified": True,
        "isOver20Ha": True,
        "isPsgRequiredPlot": True,
        "company": "string",
        "subcontractor": "string",
        "landlord": "string",
        "hasOtherEcologicalZone": True,
        "otherEcologicalZoneType": "string",
        "hasNearbyEcologicalZone": True,
        "nearbyEcologicalZoneType": "string",
        "protectedSpecies": "string",
        "protectedHabitats": "string",
        "hasDdtRequest": True,
        "ddtRequestOwner": "string",
        "inspectionDate": "2025-07-31T20:16:13.358000",
        "weather": "string",
        "forest": "string",
        "hasRemainingTrees": True,
        "treesSpecies": "string",
        "hasConstructionPanel": True,
        "constructionPanelImages": ["string"],
        "wetland": "string",
        "destructionClues": "string",
        "soilState": "string",
        "clearCutImages": ["string"],
        "treeTrunksImages": ["string"],
        "soilStateImages": ["string"],
        "accessRoadImages": ["string"],
    }
    # Report 1 has no form yet in the seed, so the first version is created
    # without an Etag (the optimistic-lock check is skipped when no form exists).

    response = client.post(
        "/api/v1/clear-cuts-reports/1/forms",
        json=report_data,
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == status.HTTP_201_CREATED

    location = response.headers["location"]
    data = client.get(location, headers={"Authorization": f"Bearer {token}"}).json()

    assert data["id"] == location.split("/")[-1]
    assert data["company"] == report_data["company"]
    assert data["ddtRequestOwner"] == report_data["ddtRequestOwner"]
    assert data["hasOtherEcologicalZone"] == report_data["hasOtherEcologicalZone"]
    assert data["otherEcologicalZoneType"] == report_data["otherEcologicalZoneType"]
    assert data["forest"] == report_data["forest"]
    assert data["inspectionDate"] == report_data["inspectionDate"]
    assert data["landlord"] == report_data["landlord"]
    assert data["hasNearbyEcologicalZone"] == report_data["hasNearbyEcologicalZone"]
    assert data["nearbyEcologicalZoneType"] == report_data["nearbyEcologicalZoneType"]
    assert data["other"] == report_data["other"]
    assert data["isOver20Ha"] == report_data["isOver20Ha"]
    assert data["isPefcFscCertified"] == report_data["isPefcFscCertified"]
    assert data["protectedHabitats"] == report_data["protectedHabitats"]
    assert data["protectedSpecies"] == report_data["protectedSpecies"]
    # If your API returns a protectedZoneDescription field, add it here
    assert data["isPsgRequiredPlot"] == report_data["isPsgRequiredPlot"]
    assert (
        data["relevantForAlertCnpfDdtPsgThresholds"]
        == report_data["relevantForAlertCnpfDdtPsgThresholds"]
    )
    assert (
        data["relevantForAlertCnpfDdtSrgs"]
        == report_data["relevantForAlertCnpfDdtSrgs"]
    )
    assert data["relevantForOfbComplaint"] == report_data["relevantForOfbComplaint"]
    assert data["relevantForPsgRequest"] == report_data["relevantForPsgRequest"]
    assert (
        data["relevantForRediiiComplaint"] == report_data["relevantForRediiiComplaint"]
    )
    assert data["hasRemainingTrees"] == report_data["hasRemainingTrees"]
    assert data["requestEngaged"] == report_data["requestEngaged"]
    assert data["soilState"] == report_data["soilState"]
    assert data["treesSpecies"] == report_data["treesSpecies"]
    assert data["subcontractor"] == report_data["subcontractor"]
    # If your API returns waterzoneDescription, add it here
    assert data["weather"] == report_data["weather"]
    # If your API returns workSignVisible, add it here


def test_form_submission_does_not_auto_update_report_status(
    client: TestClient, db: Session
) -> None:
    """La soumission du formulaire ne change plus le statut : il faut passer par volunteer-validate puis approve-validation."""
    token = get_admin_user_token(client, db)[1]

    # Verify initial report status is "to_validate"
    report_response = client.get("/api/v1/clear-cuts-reports/1")
    assert report_response.status_code == status.HTTP_200_OK
    initial_report_data = report_response.json()
    assert initial_report_data["status"] == "to_validate"

    # Submit a form
    form_data = {
        "company": "Test Company",
        "ddtRequestOwner": "Test Owner",
        "ecologicalZone": False,
        "ecologicalZoneType": "Test Zone",
        "forestDescription": "Test Forest",
        "inspectionDate": "2025-04-23T14:00:00",
        "landlord": "Test Landlord",
        "nearbyZone": False,
        "nearbyZoneType": "Test Nearby Zone Type",
        "other": "Test Other",
        "over20Ha": False,
        "pefcFscCertified": False,
        "protectedHabitats": "Test Habitats",
        "protectedSpecies": "Test Species",
        "protectedZoneDescription": "Test Description",
        "psgRequiredPlot": True,
        "relevantForAlertCnpfDdtPsgThresholds": False,
        "relevantForAlertCnpfDdtSrgs": False,
        "relevantForOfbComplaint": False,
        "relevantForPsgRequest": False,
        "relevantForRediiiComplaint": False,
        "remainingTrees": True,
        "requestEngaged": "Test Request",
        "soilState": "Test Soil",
        "species": "Test Species",
        "subcontractor": "Test Subcontractor",
        "waterzoneDescription": "Test Water Zone",
        "weather": "Test Weather",
        "workSignVisible": False,
    }
    # Report 1 has no form yet in the seed, so the first version is created
    # without an Etag (the optimistic-lock check is skipped when no form exists).
    response = client.post(
        "/api/v1/clear-cuts-reports/1/forms",
        json=form_data,
        headers={
            "Authorization": f"Bearer {token}",
        },
    )
    assert response.status_code == status.HTTP_201_CREATED

    # Verify report status is now "validated"
    updated_report_response = client.get("/api/v1/clear-cuts-reports/1")
    assert updated_report_response.status_code == status.HTTP_200_OK
    updated_report_data = updated_report_response.json()
    assert updated_report_data["status"] == "to_validate"


def test_forms_require_a_token(client: TestClient, db: Session) -> None:
    forms_url = "/api/v1/clear-cuts-reports/1/forms"
    assert client.get(forms_url).status_code == status.HTTP_401_UNAUTHORIZED
    assert client.get(f"{forms_url}/1").status_code == status.HTTP_401_UNAUTHORIZED

    token = get_volunteer_user_token(client, db)[1]
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get(forms_url, headers=headers).status_code == status.HTTP_200_OK


def test_form_is_only_served_under_its_report(client: TestClient, db: Session) -> None:
    volunteer, token = get_volunteer_user_token(client, db)
    headers = {"Authorization": f"Bearer {token}"}
    form = ClearCutForm(report_id=1, editor_id=volunteer.id)
    db.add(form)
    db.commit()
    form_id = form.id
    other_report = db.query(ClearCutReport).filter(ClearCutReport.id != 1).first()
    assert other_report is not None

    response = client.get(
        f"/api/v1/clear-cuts-reports/1/forms/{form_id}", headers=headers
    )
    assert response.status_code == status.HTTP_200_OK

    response = client.get(
        f"/api/v1/clear-cuts-reports/{other_report.id}/forms/{form_id}",
        headers=headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_volunteer_cannot_submit_form_on_report_not_assigned_to_them(
    client: TestClient, db: Session
) -> None:
    token = get_volunteer_user_token(client, db, "not-owner@volunteer.com")[1]
    other = create_user(db, email="owner@volunteer.com", login="owner-login")
    report = db.get(ClearCutReport, 1)
    assert report is not None
    report.user_id = other.id
    db.commit()

    response = client.post(
        "/api/v1/clear-cuts-reports/1/forms",
        json=MINIMAL_FORM,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["detail"]["type"] == "NOT_ASSIGNED"


def test_assigned_volunteer_can_submit_form(client: TestClient, db: Session) -> None:
    [me, token] = get_volunteer_user_token(client, db, "owner@volunteer.com")
    # An unlocked report without any form yet, so that no ETag is expected
    report = (
        db.query(ClearCutReport)
        .filter(
            ~ClearCutReport.clear_cut_forms.any(),
            ClearCutReport.status == "to_validate",
        )
        .first()
    )
    assert report is not None
    report.user_id = me.id
    db.commit()
    report_id = report.id

    response = client.post(
        f"/api/v1/clear-cuts-reports/{report_id}/forms",
        json=MINIMAL_FORM,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_201_CREATED


def test_assignment_requester_can_draft_form(client: TestClient, db: Session) -> None:
    [me, token] = get_volunteer_user_token(client, db, "requester@volunteer.com")
    report = (
        db.query(ClearCutReport)
        .filter(
            ~ClearCutReport.clear_cut_forms.any(),
            ClearCutReport.status == "to_validate",
        )
        .first()
    )
    assert report is not None
    report.user_id = None
    report.assignment_requested_by_id = me.id
    db.commit()
    report_id = report.id

    response = client.post(
        f"/api/v1/clear-cuts-reports/{report_id}/forms",
        json=MINIMAL_FORM,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_201_CREATED


def test_form_on_unknown_report_returns_not_found(
    client: TestClient, db: Session
) -> None:
    token = get_admin_user_token(client, db)[1]
    response = client.post(
        "/api/v1/clear-cuts-reports/999999/forms",
        json=MINIMAL_FORM,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"]["type"] == "REPORT_NOT_FOUND"
