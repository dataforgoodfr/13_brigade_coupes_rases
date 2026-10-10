from datetime import datetime
from pathlib import Path

import geopandas as gpd
import pytest
from shapely.geometry import Polygon, box

from pipeline.scripts import get_new_and_update
from pipeline.scripts.get_new_and_update import (
    split_new_and_updated_clusters,
    update_geometries,
)


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


def test_no_new_cluster_gives_empty_outputs(data_dir: Path) -> None:
    ref_path, new_path = data_dir / "ref.fgb", data_dir / "new.fgb"
    cluster_frame([box(0, 0, 100, 100)]).to_file(ref_path, driver="FlatGeobuf")
    cluster_frame([box(0, 0, 100, 100)]).iloc[0:0].to_file(
        new_path, driver="FlatGeobuf"
    )

    updated, truly_new = split_new_and_updated_clusters(str(new_path), str(ref_path))

    assert updated.empty
    assert truly_new.empty


def test_locked_clusters_are_never_matched(data_dir: Path) -> None:
    ref = cluster_frame([box(0, 0, 100, 100), box(500, 500, 600, 600)])
    # La première coupe a été corrigée à la main sans réautoriser le pipeline,
    # la seconde a été corrigée puis réouverte par un administrateur.
    ref["is_manually_edited"] = [True, True]
    ref["allow_pipeline_override"] = [False, True]
    new = cluster_frame([box(20, 20, 120, 120), box(520, 520, 620, 620)])
    ref_path, new_path = data_dir / "ref.fgb", data_dir / "new.fgb"
    ref.to_file(ref_path, driver="FlatGeobuf")
    new.to_file(new_path, driver="FlatGeobuf")

    updated, truly_new = split_new_and_updated_clusters(str(new_path), str(ref_path))

    assert truly_new["clear_cut_group"].tolist() == [1]
    assert updated["clear_cut_group"].tolist() == [2]


def test_reference_without_edition_flags_is_fully_matchable() -> None:
    ref = cluster_frame([box(0, 0, 100, 100)])
    assert not get_new_and_update.locked_clusters_mask(ref).any()


def test_matching_is_in_meters_when_the_reference_comes_from_the_database(
    data_dir: Path,
) -> None:
    # La base exporte en WGS84 : le rayon de 50 m ne doit pas devenir 50°.
    ref = cluster_frame([box(370_000, 6_340_000, 370_100, 6_340_100)])
    new = cluster_frame(
        [
            box(370_000, 6_340_140, 370_100, 6_340_240),  # à 40 m → mis à jour
            box(370_000, 6_340_200, 370_100, 6_340_300),  # à 100 m → nouveau
            box(400_000, 6_400_000, 400_100, 6_400_100),  # à 60 km → nouveau
        ]
    )
    ref_path, new_path = data_dir / "ref.fgb", data_dir / "new.fgb"
    ref.to_crs("EPSG:4326").to_file(ref_path, driver="FlatGeobuf")
    new.to_file(new_path, driver="FlatGeobuf")

    updated, truly_new = split_new_and_updated_clusters(str(new_path), str(ref_path))

    assert updated["clear_cut_group"].tolist() == [1]
    assert sorted(truly_new["clear_cut_group"]) == [2, 3]


def test_update_merges_in_meters_despite_missing_database_values(
    data_dir: Path,
) -> None:
    (data_dir / "sufosat_reference").mkdir()
    ref = cluster_frame([box(370_000, 6_340_000, 370_100, 6_340_100)]).assign(
        clear_cut_group_size=[3],
        days_delta=[31],
        area_ha=[1.0],
        concave_hull_score=[None],  # jamais exporté par la base
    )
    updated = cluster_frame([box(370_100, 6_340_000, 370_200, 6_340_100)]).assign(
        date_max=[datetime(2026, 9, 1)],
        clear_cut_group_size=[2],
        concave_hull_score=[0.8],
    )
    new = cluster_frame([box(400_000, 6_400_000, 400_100, 6_400_100)]).assign(
        clear_cut_group_size=[1], concave_hull_score=[0.5]
    )
    ref.to_crs("EPSG:4326").to_file(
        data_dir / "sufosat_reference" / "sufosat_clusters_enriched.fgb"
    )
    updated.to_file(data_dir / "sufosat" / "clusters_updated.fgb")
    new.to_file(data_dir / "sufosat" / "clusters_new.fgb")

    merged, final = update_geometries()

    row = merged.iloc[0]
    assert row["area_ha"] == pytest.approx(2.0, rel=1e-3)
    assert row["clear_cut_group_size"] == 5
    assert row["concave_hull_score"] == pytest.approx(0.8)
    assert row["date_max"] == datetime(2026, 9, 1)
    assert row["days_delta"] == 243
    # Le résultat reste dans la projection de la référence
    assert final.crs.to_epsg() == 4326
    assert len(final) == 2


def test_only_matched_reference_cuts_are_kept_for_loading(data_dir: Path) -> None:
    (data_dir / "sufosat_reference").mkdir()
    ref = cluster_frame(
        [
            box(370_000, 6_340_000, 370_100, 6_340_100),
            box(380_000, 6_340_000, 380_100, 6_340_100),  # sans nouvelle détection
        ]
    ).assign(
        clear_cut_group=[41, 42],
        clear_cut_group_size=[1, 1],
        area_ha=[1.0, 1.0],
        concave_hull_score=[None, None],
    )
    updated = cluster_frame([box(370_100, 6_340_000, 370_200, 6_340_100)]).assign(
        clear_cut_group_size=[1], concave_hull_score=[0.8]
    )
    ref.to_crs("EPSG:4326").to_file(
        data_dir / "sufosat_reference" / "sufosat_clusters_enriched.fgb"
    )
    updated.to_file(data_dir / "sufosat" / "clusters_updated.fgb")
    cluster_frame([box(400_000, 6_400_000, 400_100, 6_400_100)]).to_file(
        data_dir / "sufosat" / "clusters_new.fgb"
    )

    update_geometries()

    to_load = gpd.read_file(data_dir / "sufosat" / "clusters_reference_updated.fgb")
    assert to_load["clear_cut_group"].tolist() == [41]


def test_no_reference_update_leaves_no_file_to_load(data_dir: Path) -> None:
    (data_dir / "sufosat_reference").mkdir()
    stale = data_dir / "sufosat" / "clusters_reference_updated.fgb"
    stale.write_text("ancienne exécution")
    cluster_frame([box(370_000, 6_340_000, 370_100, 6_340_100)]).assign(
        clear_cut_group_size=[1]
    ).to_crs("EPSG:4326").to_file(
        data_dir / "sufosat_reference" / "sufosat_clusters_enriched.fgb"
    )
    empty = (
        cluster_frame([box(370_000, 6_340_000, 370_100, 6_340_100)])
        .assign(clear_cut_group_size=[1])
        .iloc[:0]
    )
    empty.to_file(data_dir / "sufosat" / "clusters_updated.fgb")
    cluster_frame([box(400_000, 6_400_000, 400_100, 6_400_100)]).to_file(
        data_dir / "sufosat" / "clusters_new.fgb"
    )

    update_geometries()

    assert not stale.exists()
