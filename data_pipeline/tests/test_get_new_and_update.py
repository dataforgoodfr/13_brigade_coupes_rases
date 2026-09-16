from datetime import datetime
from pathlib import Path

import geopandas as gpd
import pytest
from shapely.geometry import Polygon, box

from pipeline.scripts import get_new_and_update
from pipeline.scripts.get_new_and_update import split_new_and_updated_clusters


def cluster_frame(geoms: list[Polygon]) -> gpd.GeoDataFrame:
    n = len(geoms)
    return gpd.GeoDataFrame(
        {
            "clear_cut_group": list(range(1, n + 1)),
            "date_min": [datetime(2026, 1, 1)] * n,
            "date_max": [datetime(2026, 2, 1)] * n,
        },
        geometry=geoms,
        crs="EPSG:2154",
    )


@pytest.fixture
def data_dir(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    # Les fichiers de sortie sont écrits sous DATA_DIR/sufosat.
    monkeypatch.setattr(get_new_and_update, "DATA_DIR", tmp_path)
    (tmp_path / "sufosat").mkdir()
    return tmp_path


def test_clusters_near_the_reference_are_updated_others_are_new(
    data_dir: Path,
) -> None:
    ref = cluster_frame([box(0, 0, 100, 100)])
    new = cluster_frame(
        [
            box(20, 20, 120, 120),  # chevauche la référence → mis à jour
            box(0, 140, 100, 240),  # à 40 m, dans le rayon de 50 m → mis à jour
            box(0, 200, 100, 300),  # à 100 m → nouveau
        ]
    )
    ref_path, new_path = data_dir / "ref.fgb", data_dir / "new.fgb"
    ref.to_file(ref_path, driver="FlatGeobuf")
    new.to_file(new_path, driver="FlatGeobuf")

    updated, truly_new = split_new_and_updated_clusters(str(new_path), str(ref_path))

    assert updated["clear_cut_group"].tolist() == [1, 2]
    assert truly_new["clear_cut_group"].tolist() == [3]
    assert "_temp_idx" not in updated.columns
    assert (data_dir / "sufosat" / "clusters_updated.fgb").exists()
    assert (data_dir / "sufosat" / "clusters_new.fgb").exists()
