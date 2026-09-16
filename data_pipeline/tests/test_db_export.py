import geopandas as gpd
import numpy as np
from shapely.geometry import Point

from pipeline.scripts.db_export import array_to_string, convert_arrays_to_strings


def test_array_to_string_renders_lists_and_drops_missing_values() -> None:
    assert array_to_string(["FR1", "FR2"]) == "['FR1', 'FR2']"
    assert array_to_string(np.array(["40001"])) == "['40001']"
    assert array_to_string([None]) is None
    assert array_to_string([]) is None
    assert array_to_string(None) is None
    assert array_to_string(float("nan")) is None


def test_convert_arrays_to_strings_handles_reports_without_city() -> None:
    gdf = gpd.GeoDataFrame(
        {
            "cities": [["40001"], [None], float("nan")],
            "natura2000_codes": [["FR1", "FR2"], [], None],
        },
        geometry=[Point(0, 0)] * 3,
        crs="EPSG:4326",
    )

    converted = convert_arrays_to_strings(gdf)

    assert converted["cities"].iloc[0] == "['40001']"
    assert converted["cities"].isna().tolist() == [False, True, True]
    assert converted["natura2000_codes"].iloc[0] == "['FR1', 'FR2']"
    assert converted["natura2000_codes"].isna().tolist() == [False, True, True]
