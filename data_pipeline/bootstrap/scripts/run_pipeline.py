import os
import sys
from pathlib import Path

# Aller dans le dossier bootstrap
BOOTSTRAP_DIR = Path(__file__).resolve().parent.parent
os.chdir(BOOTSTRAP_DIR)

# Ajouter bootstrap à sys.path pour permettre `import scripts`
sys.path.insert(0, str(BOOTSTRAP_DIR))

print("cwd:", os.getcwd())
print("sys.path[0]:", sys.path[0])

from scripts.preprocess import (
    preprocess_cadastre_departments,
    preprocess_natura2000,
    preprocess_slope,
    preprocess_sufosat,
)


def run_pipeline() -> None:
    preprocess_sufosat()
    preprocess_slope()
    preprocess_natura2000()
    preprocess_cadastre_departments()


if __name__ == "__main__":
    run_pipeline()
