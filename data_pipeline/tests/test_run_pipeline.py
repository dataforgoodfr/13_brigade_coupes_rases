import logging
from datetime import datetime
from pathlib import Path

import geopandas as gpd
import pytest
from shapely.geometry import box

from pipeline.scripts import run_pipeline


def test_main_logs_success_message(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    monkeypatch.setattr(run_pipeline, "run_pipeline", lambda: None)

    with caplog.at_level(logging.INFO):
        run_pipeline.main()

    assert caplog.messages[-1] == run_pipeline.SUCCESS_MESSAGE


def test_main_failure_does_not_log_success_message(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    def fail() -> None:
        raise RuntimeError("panne")

    monkeypatch.setattr(run_pipeline, "run_pipeline", fail)

    with caplog.at_level(logging.INFO), pytest.raises(RuntimeError):
        run_pipeline.main()

    assert run_pipeline.SUCCESS_MESSAGE not in caplog.messages


def test_pipeline_stops_when_enrichment_keeps_no_clear_cut(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    # Mois calme : quelques amas après le prétraitement, tous trop petits
    # pour être gardés par l'enrichissement.
    sufosat = tmp_path / "sufosat"
    sufosat.mkdir()
    clusters = gpd.GeoDataFrame(
        {"area_ha": [0.5]}, geometry=[box(0, 0, 50, 50)], crs="EPSG:2154"
    )

    def preprocess(**_: object) -> None:
        clusters.to_file(sufosat / "sufosat_clusters.fgb", driver="FlatGeobuf")

    def enrich() -> None:
        clusters.iloc[0:0].to_file(
            sufosat / "sufosat_clusters_enriched.fgb", driver="FlatGeobuf"
        )

    def must_not_run(*_: object, **__: object) -> None:
        raise AssertionError("étape lancée sans coupe à traiter")

    monkeypatch.setattr(run_pipeline, "DATA_DIR", tmp_path)
    monkeypatch.setattr(run_pipeline, "get_last_version", lambda: datetime(2026, 9, 28))
    monkeypatch.setattr(run_pipeline, "get_sufosat_tiff", lambda: tmp_path / "radd.tif")
    monkeypatch.setattr(run_pipeline, "get_enrichment_data", lambda: None)
    monkeypatch.setattr(run_pipeline, "preprocess_sufosat", preprocess)
    monkeypatch.setattr(run_pipeline, "enrich_sufosat_clusters", enrich)
    for step in (
        "export_database",
        "split_new_and_updated_clusters",
        "upload_gold_to_s3",
        "load_database",
    ):
        monkeypatch.setattr(run_pipeline, step, must_not_run)

    with caplog.at_level(logging.INFO):
        run_pipeline.main()

    assert caplog.messages[-1] == run_pipeline.SUCCESS_MESSAGE
