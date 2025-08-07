from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from test.common.user import get_admin_user_token


def test_create_version_success(client: TestClient, db: Session):
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

    response = client.post(
        "/api/v1/clear-cuts-reports/1/forms",
        json=report_data,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == status.HTTP_201_CREATED

    location = response.headers["location"]
    data = client.get(location).json()

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


def test_form_submission_updates_report_status(client: TestClient, db: Session):
    """Test that submitting a form updates the report status from 'to_validate' to 'validated'"""
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

    response = client.post(
        "/api/v1/clear-cuts-reports/1/forms",
        json=form_data,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_201_CREATED

    # Verify report status is now "validated"
    updated_report_response = client.get("/api/v1/clear-cuts-reports/1")
    assert updated_report_response.status_code == status.HTTP_200_OK
    updated_report_data = updated_report_response.json()
    assert updated_report_data["status"] == "validated"
