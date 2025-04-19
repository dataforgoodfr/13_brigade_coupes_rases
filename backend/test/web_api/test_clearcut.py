from fastapi.testclient import TestClient
from fastapi import status


def ensure_authentication(client: TestClient, verb: str, path: str):
    response = client.request(verb, path, headers={})
    assert response.status_code == 401

    response = client.request(verb, path, headers={"x-imports-token": "test-token"})
    assert response.status_code != 401 and response.status_code != 500


def test_endpoint_authentication(client: TestClient):
    ensure_authentication(client, "post", "/api/v1/clear-cuts-reports")


def test_post_report_success(client: TestClient):
    report_data = {
        "slope_area_ratio_percentage": 15,
        "city_zip_code": "75056",
        "clear_cuts": [
            {
                "observation_start_date": "2023-01-01T00:00:00Z",
                "observation_end_date": "2023-12-31T00:00:00Z",
                "area_hectare": 10,
                "bdf_resinous_area_hectare": 0.5,
                "bdf_decidous_area_hectare": 0.6,
                "bdf_mixed_area_hectare": 0.7,
                "bdf_poplar_area_hectare": 0.8,
                "ecological_zoning_area_hectare": 0.9,
                "location": {"type": "Point", "coordinates": [2.3522, 48.8566]},
                "boundary": {
                    "type": "MultiPolygon",
                    "coordinates": [
                        [
                            [
                                [2.3522, 48.8566],
                                [2.3622, 48.8566],
                                [2.3622, 48.8666],
                                [2.3522, 48.8566],
                            ]
                        ]
                    ],
                },
                "ecological_zonings": [
                    {"type": "Natura2000", "code": "ABC", "name": "DEF"},
                ],
            }
        ],
    }

    response = client.post(
        "/api/v1/clear-cuts-reports",
        json=report_data,
        headers={"x-imports-token": "test-token"},
    )
    print(response)
    assert response.status_code == status.HTTP_201_CREATED

    location = response.headers["location"]
    data = client.get(location).json()

    print(data)

    assert data["id"] == location.split("/")[-1]
    assert data["slope_area_ratio_percentage"] == 15

    response = client.get(f"/api/v1/clear-cuts/{data['clear_cuts_ids'][0]}")
    assert response.status_code == status.HTTP_200_OK
    clear_cut_data = response.json()

    assert clear_cut_data["location"]["coordinates"] == [2.3522, 48.8566]
    assert clear_cut_data["bdf_resinous_area_hectare"] == 0.5
    assert clear_cut_data["bdf_decidous_area_hectare"] == 0.6
    assert clear_cut_data["bdf_mixed_area_hectare"] == 0.7
    assert clear_cut_data["bdf_poplar_area_hectare"] == 0.8
    assert clear_cut_data["ecological_zoning_area_hectare"] == 0.9

    assert clear_cut_data["boundary"]["coordinates"] == [
        [
            [
                [2.3522, 48.8566],
                [2.3622, 48.8566],
                [2.3622, 48.8666],
                [2.3522, 48.8566],
            ]
        ]
    ]


def test_post_report_invalid_data(client: TestClient):
    invalid_data = {}

    response = client.post(
        "/api/v1/clear-cuts-reports",
        json=invalid_data,
        headers={"x-imports-token": "test-token"},
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_get_reports(client: TestClient):
    response = client.get(
        "/api/v1/clear-cuts-reports",
    )
    data = response.json()
    assert response.status_code == status.HTTP_200_OK
    assert len(data["content"]) == 7


def test_get_report(client: TestClient):
    response = client.get(
        "/api/v1/clear-cuts-reports/1",
    )
    data = response.json()
    assert response.status_code == status.HTTP_200_OK
    assert data["id"] == "1"
