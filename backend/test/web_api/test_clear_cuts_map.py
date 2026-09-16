from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from test.common.clear_cut import new_clear_cut_report

MAP = "/api/v1/clear-cuts-map"
# Toute la France métropolitaine (aire > 1 degré carré : points regroupés).
FRANCE = {"swLat": 41.0, "swLng": -5.5, "neLat": 51.5, "neLng": 10.0}


def get_map(client: TestClient, **params: Any) -> dict[str, Any]:
    response = client.get(MAP, params=params)
    assert response.status_code == 200
    data: dict[str, Any] = response.json()
    return data


def test_get_clearcuts_map(client: TestClient, db: Session) -> None:
    clear_cut = new_clear_cut_report()
    db.add(clear_cut)
    db.commit()

    data = get_map(client, **FRANCE, cutYears=2025)

    assert data["previews"] is not None
    assert data["points"] is not None


def test_points_are_omitted_unless_requested(client: TestClient, db: Session) -> None:
    without = get_map(client)
    with_points = get_map(client, withPoints=True)

    assert without["points"] == {"total": 0, "content": []}
    assert with_points["points"]["total"] == len(with_points["previews"])
    assert all(point["count"] == 1 for point in with_points["points"]["content"])


def test_wide_bounds_cluster_the_points(client: TestClient, db: Session) -> None:
    data = get_map(client, withPoints=True, **FRANCE)

    total = data["points"]["total"]
    assert total > 0
    assert sum(point["count"] for point in data["points"]["content"]) == total


def test_narrow_bounds_keep_individual_points(client: TestClient, db: Session) -> None:
    everything = get_map(client, withPoints=True)
    first = everything["previews"][0]["averageLocation"]["coordinates"]
    lng, lat = first
    data = get_map(
        client,
        withPoints=True,
        swLat=lat - 0.2,
        swLng=lng - 0.2,
        neLat=lat + 0.2,
        neLng=lng + 0.2,
    )

    assert 0 < data["points"]["total"] < everything["points"]["total"]
    assert all(point["count"] == 1 for point in data["points"]["content"])
    for preview in data["previews"]:
        preview_lng, preview_lat = preview["averageLocation"]["coordinates"]
        assert abs(preview_lat - lat) <= 0.2 and abs(preview_lng - lng) <= 0.2


def test_filter_by_status(client: TestClient, db: Session) -> None:
    data = get_map(client, statuses=["validated", "rejected"])

    assert data["previews"]
    assert {preview["status"] for preview in data["previews"]} <= {
        "validated",
        "rejected",
    }


def test_filter_by_area(client: TestClient, db: Session) -> None:
    everything = get_map(client)
    areas = sorted(preview["totalAreaHectare"] for preview in everything["previews"])
    threshold = areas[len(areas) // 2]

    small = get_map(client, maxAreaHectare=threshold)
    large = get_map(client, minAreaHectare=threshold)

    assert all(p["totalAreaHectare"] <= threshold for p in small["previews"])
    assert all(p["totalAreaHectare"] >= threshold for p in large["previews"])
    assert len(small["previews"]) < len(everything["previews"])
    assert len(large["previews"]) < len(everything["previews"])


def test_filter_by_department(client: TestClient, db: Session) -> None:
    everything = get_map(client)
    department_id = everything["previews"][0]["departmentId"]

    data = get_map(client, departmentsIds=[department_id])

    assert data["previews"]
    assert {p["departmentId"] for p in data["previews"]} == {department_id}


def test_include_and_exclude_reports(client: TestClient, db: Session) -> None:
    everything = get_map(client)
    first, second = (p["id"] for p in everything["previews"][:2])

    only = get_map(client, inReportsIds=[first, second])
    without = get_map(client, outReportsIds=[first])

    assert {p["id"] for p in only["previews"]} == {first, second}
    assert first not in {p["id"] for p in without["previews"]}
    assert len(without["previews"]) == len(everything["previews"]) - 1


def test_filter_by_ecological_zoning_and_slope(client: TestClient, db: Session) -> None:
    everything = get_map(client)
    with_zoning = get_map(client, hasEcologicalZonings=True)
    without_zoning = get_map(client, hasEcologicalZonings=False)
    steep = get_map(client, excessiveSlope=True)
    flat = get_map(client, excessiveSlope=False)

    assert len(with_zoning["previews"]) + len(without_zoning["previews"]) == len(
        everything["previews"]
    )
    assert len(steep["previews"]) + len(flat["previews"]) == len(everything["previews"])


def test_filter_by_cut_year(client: TestClient, db: Session) -> None:
    everything = get_map(client)
    year = int(everything["previews"][0]["lastCutDate"][:4])

    data = get_map(client, cutYears=[year])

    assert data["previews"]
    for preview in data["previews"]:
        assert (
            int(preview["firstCutDate"][:4]) <= year <= int(preview["lastCutDate"][:4])
        )


def test_get_report_preview_by_id(client: TestClient, db: Session) -> None:
    everything = get_map(client)
    preview = everything["previews"][0]

    response = client.get(f"{MAP}/{preview['id']}")

    assert response.status_code == 200
    assert response.json()["id"] == preview["id"]
    assert response.json()["city"] == preview["city"]


def test_unknown_report_preview_returns_not_found(client: TestClient) -> None:
    response = client.get(f"{MAP}/999999")

    assert response.status_code == 404
    assert response.json()["detail"]["type"] == "REPORT_NOT_FOUND"


def test_invalid_filters_return_a_validation_error(client: TestClient) -> None:
    response = client.get(MAP, params={"swLat": "north"})

    assert response.status_code == 422
