import tomllib
from pathlib import Path

# pyproject.toml est la seule source du numéro de version du backend ; l'image
# Docker le copie à côté du dossier app/.
PYPROJECT_PATH = Path(__file__).resolve().parent.parent / "pyproject.toml"


def read_version(path: Path = PYPROJECT_PATH) -> str:
    with path.open("rb") as pyproject:
        return str(tomllib.load(pyproject)["project"]["version"])


VERSION = read_version()
