from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from test.common.user import get_admin_user_token


def test_create_version_success(client: TestClient, db: Session):
    token = get_admin_user_token(client, db)

    report_data = {
        "compagny": "Company",
        "ddt_request_owner": "Request owner",
        "ecological_zone": False,
        "ecological_zone_type": "Ecological Zone Type",
        "forest_description": "Wild forest",
        "inspection_date": "2025-04-23T14:00:00",
        "landlord": "Land lord",
        "nearby_zone": "Nearby Zone",
        "nearby_zone_type": "Nearby Zone Type",
        "other": "Other",
        "over_20_ha": False,
        "pefc_fsc_certified": False,
        "protected_habitats": "Protected Habitats",
        "protected_species": "Protected Species",
        "protected_zone_description": "RAS",
        "psg_required_plot": True,
        "relevant_for_alert_cnpf_ddt_psg_thresholds": False,
        "relevant_for_alert_cnpf_ddt_srgs": False,
        "relevant_for_ofb_complaint": False,
        "relevant_for_psg_request": False,
        "relevant_for_rediii_complaint": False,
        "remainingTrees": True,
        "request_engaged": "Request",
        "soil_state": "Muddy",
        "species": "Chênes",
        "subcontractor": "Sub contractor",
        "waterzone_description": "small lake",
        "weather": "Rainy",
        "workSignVisible": False,
    }

    response = client.post(
        "/api/v1/clear-cuts-reports/1/forms",
        json=report_data,
        headers={"Authorization": f"Bearer {token}"},
    )
    print(response)
    assert response.status_code == status.HTTP_201_CREATED

    location = response.headers["location"]
    data = client.get(location).json()

    print(data)

    assert data["id"] == int(location.split("/")[-1])
    assert data["compagny"] == report_data["compagny"]
    assert data["ddt_request_owner"] == report_data["ddt_request_owner"]
    assert data["ecological_zone"] == report_data["ecological_zone"]
    assert data["ecological_zone_type"] == report_data["ecological_zone_type"]
    assert data["forest_description"] == report_data["forest_description"]
    assert data["inspection_date"] == report_data["inspection_date"]
    assert data["landlord"] == report_data["landlord"]
    assert data["nearby_zone"] == report_data["nearby_zone"]
    assert data["nearby_zone_type"] == report_data["nearby_zone_type"]
    assert data["other"] == report_data["other"]
    assert data["over_20_ha"] == report_data["over_20_ha"]
    assert data["pefc_fsc_certified"] == report_data["pefc_fsc_certified"]
    assert data["protected_habitats"] == report_data["protected_habitats"]
    assert data["protected_species"] == report_data["protected_species"]
    assert (
        data["protected_zone_description"] == report_data["protected_zone_description"]
    )
    assert data["psg_required_plot"] == report_data["psg_required_plot"]
    assert (
        data["relevant_for_alert_cnpf_ddt_psg_thresholds"]
        == report_data["relevant_for_alert_cnpf_ddt_psg_thresholds"]
    )
    assert (
        data["relevant_for_alert_cnpf_ddt_srgs"]
        == report_data["relevant_for_alert_cnpf_ddt_srgs"]
    )
    assert (
        data["relevant_for_ofb_complaint"] == report_data["relevant_for_ofb_complaint"]
    )
    assert data["relevant_for_psg_request"] == report_data["relevant_for_psg_request"]
    assert (
        data["relevant_for_rediii_complaint"]
        == report_data["relevant_for_rediii_complaint"]
    )
    assert data["remainingTrees"] == report_data["remainingTrees"]
    assert data["request_engaged"] == report_data["request_engaged"]
    assert data["soil_state"] == report_data["soil_state"]
    assert data["species"] == report_data["species"]
    assert data["subcontractor"] == report_data["subcontractor"]
    assert data["waterzone_description"] == report_data["waterzone_description"]
    assert data["weather"] == report_data["weather"]
    assert data["workSignVisible"] == report_data["workSignVisible"]
