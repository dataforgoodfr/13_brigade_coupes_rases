from fastapi.testclient import TestClient
from fastapi import status


def ensure_authentication(client: TestClient, verb: str, path: str):
    response = client.request(verb, path, headers={})
    assert response.status_code == 401

    response = client.request(verb, path, headers={"x-imports-token": "test-token"})
    assert response.status_code != 401 and response.status_code != 500


def test_endpoint_authentication(client: TestClient):
    ensure_authentication(client, "post", "/api/v1/clearcuts")


def test_post_clearcut_success(client: TestClient):
    clearcut_data = {
        "cut_date": "2024-01-01",
        "slope_percentage": 15,
        "area_hectare": 15,
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
        "registries": [
            {"number": "0089", "sheet": 1, "section": "0H", "zip_code": "13055", "district_code":"123"}
        ],
        "ecological_zonings": [{"type": "Natura2000", "code": "ABC", "name": "DEF"}],
    }

    response = client.post(
        "/api/v1/clearcuts",
        json=clearcut_data,
        headers={"x-imports-token": "test-token"},
    )
    print(response)
    assert response.status_code == status.HTTP_201_CREATED

    location = response.headers["location"]
    data = client.get(location).json()

    print(data)

    assert "id" in data
    assert isinstance(data["cut_date"], str)
    assert isinstance(data["slope_percentage"], float)
    assert data["location"]["coordinates"] == [2.3522, 48.8566]
    assert data["boundary"]["coordinates"] == [
        [
            [
                [2.3522, 48.8566],
                [2.3622, 48.8566],
                [2.3622, 48.8666],
                [2.3522, 48.8566],
            ]
        ]
    ]


def test_post_clearcut_invalid_data(client: TestClient):
    invalid_data = {}

    response = client.post(
        "/api/v1/clearcuts",
        json=invalid_data,
        headers={"x-imports-token": "test-token"},
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
