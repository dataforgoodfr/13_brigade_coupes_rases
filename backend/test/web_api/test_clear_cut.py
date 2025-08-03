from fastapi import status
from fastapi.testclient import TestClient


def ensure_authentication(client: TestClient, verb: str, path: str):
    response = client.request(verb, path, headers={})
    assert response.status_code == 401

    response = client.request(verb, path, headers={"x-imports-token": "test-token"})
    assert response.status_code != 401 and response.status_code != 500


def test_endpoint_authentication(client: TestClient):
    ensure_authentication(client, "post", "/api/v1/clear-cuts-reports")


def test_post_report_success(client: TestClient):
    report_data = {
        "slopeAreaHectare": 6.5,
        "cityZipCode": "75056",
        "clearCuts": [
            {
                "observationStartDate": "2023-01-01T00:00:00Z",
                "observationEndDate": "2023-12-31T00:00:00Z",
                "areaHectare": 10,
                "bdfResinousAreaHectare": 0.5,
                "bdfDeciduousAreaHectare": 0.6,
                "bdfMixedAreaHectare": 0.7,
                "bdfPoplarAreaHectare": 0.8,
                "ecologicalZoningAreaHectare": 0.9,
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
                "ecologicalZonings": [
                    {"type": "Natura2000", "code": "ABC", "name": "DEF"},
                ],
                "satelliteImages": [
                    "https://example.com/image1.jpg",
                    "https://example.com/image2.jpg",
                ],
            }
        ],
    }

    response = client.post(
        "/api/v1/clear-cuts-reports",
        json=report_data,
        headers={"x-imports-token": "test-token"},
    )
    assert response.status_code == status.HTTP_201_CREATED

    location = response.headers["location"]
    data = client.get(location).json()

    assert data["id"] == location.split("/")[-1]
    assert data["slopeAreaHectare"] == 6.5

    response = client.get(f"/api/v1/clear-cuts/{data['clearCutsIds'][0]}")
    assert response.status_code == status.HTTP_200_OK
    clear_cut_data = response.json()

    assert clear_cut_data["location"]["coordinates"] == [2.3522, 48.8566]
    assert clear_cut_data["bdfResinousAreaHectare"] == 0.5
    assert clear_cut_data["bdfDeciduousAreaHectare"] == 0.6
    assert clear_cut_data["bdfMixedAreaHectare"] == 0.7
    assert clear_cut_data["bdfPoplarAreaHectare"] == 0.8
    assert clear_cut_data["ecologicalZoningAreaHectare"] == 0.9

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
    invalid_data: dict = {}

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
