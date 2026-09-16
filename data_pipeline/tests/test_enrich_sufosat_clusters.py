import dask_geopandas
import geopandas as gpd
from shapely.geometry import Polygon, box

from pipeline.scripts.enrich_sufosat_clusters import overlay


def clusters(*geoms: Polygon) -> dask_geopandas.GeoDataFrame:
    gdf = gpd.GeoDataFrame(
        {"clear_cut_group": list(range(len(geoms)))},
        geometry=list(geoms),
        crs="EPSG:2154",
    )
    return dask_geopandas.from_geopandas(gdf, npartitions=1)


def test_overlay_clips_to_the_intersection_and_keeps_right_attributes() -> None:
    cities = gpd.GeoDataFrame(
        {"code_insee": ["40001", "40002"]},
        geometry=[box(0, 0, 100, 100), box(100, 0, 200, 100)],
        crs="EPSG:2154",
    )

    result = overlay(clusters(box(50, 0, 150, 100)), cities).compute()

    assert sorted(result["code_insee"].tolist()) == ["40001", "40002"]
    assert result["clear_cut_group"].tolist() == [0, 0]
    assert result.geometry.area.tolist() == [50 * 100, 50 * 100]
    assert "right_geometry" not in result.columns


def test_overlay_drops_clusters_outside_the_reference() -> None:
    cities = gpd.GeoDataFrame(
        {"code_insee": ["40001"]}, geometry=[box(0, 0, 100, 100)], crs="EPSG:2154"
    )

    result = overlay(clusters(box(1000, 1000, 1100, 1100)), cities).compute()

    assert len(result) == 0
