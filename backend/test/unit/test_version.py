import json
import tomllib
from pathlib import Path

import pytest

from app.main import app
from app.version import VERSION, read_version

REPO_ROOT = Path(__file__).resolve().parents[3]


def test_api_announces_the_backend_version() -> None:
    assert app.version == VERSION == read_version()


def test_every_sub_project_carries_the_same_version() -> None:
    # Une release vX.Y.Z porte la même version dans les trois sous-projets
    package_json = REPO_ROOT / "frontend" / "package.json"
    pipeline_pyproject = REPO_ROOT / "data_pipeline" / "pyproject.toml"
    if not (package_json.exists() and pipeline_pyproject.exists()):
        pytest.skip("dépôt incomplet (conteneur qui ne monte que backend/)")
    frontend = json.loads(package_json.read_text())
    with pipeline_pyproject.open("rb") as pipeline:
        pipeline_version = tomllib.load(pipeline)["project"]["version"]

    assert VERSION == frontend["version"] == pipeline_version
