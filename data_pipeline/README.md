# Data pipeline

Three independent sub-projects live in this folder:

| Folder | Purpose | Runs |
|---|---|---|
| [`pipeline/`](./pipeline/README.md) | Monthly update: detects the new SUFOSAT clusters since the last date in the database, enriches them and publishes a "gold" file to S3. | Docker image (`Dockerfile`, conda + GDAL) |
| [`bootstrap/`](./bootstrap/README.md) | One-off load of the 2018-2025 historical detections. **Erases the database.** | Poetry, locally |
| [`airtable/`](./airtable/README.md) | Export of users and reports from PostgreSQL to Airtable. | `uv`, twice a day via GitHub Actions |

`pipeline/` and `bootstrap/` share this `pyproject.toml`; `airtable/` has its
own `requirements.txt`.

## Project structure

```
data_pipeline/
├── pipeline/          # monthly pipeline (scripts/, data/ for local files)
├── bootstrap/         # historical load (scripts/, data/ for downloaded files)
├── airtable/          # Airtable export (scripts/, sql/)
├── tests/             # pytest, pure functions of pipeline/
├── .env.example       # variables for pipeline/ and bootstrap/
├── Dockerfile         # image used to run pipeline/ (build context: repository root)
├── pyproject.toml     # Poetry, pytest, coverage and mypy configuration
└── README.md
```

## Setup

### 1. Environment variables

```bash
cp .env.example .env
```

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
S3_ENDPOINT=https://s3.fr-par.scw.cloud
S3_BUCKET_NAME=brigade-coupe-rase-s3
SCW_ACCESS_KEY=...
SCW_SECRET_KEY=...
```

The Scaleway Object Storage credentials are in the project's KeePass database.
Never commit `.env` (it is git-ignored). Running the pipeline or downloading the
bootstrap files requires them; the tests do not.

### 2. Install the dependencies

Python 3.13 and [Poetry](https://python-poetry.org/docs/#installation):

```bash
cd data_pipeline
poetry install
```

GDAL (`osgeo`) is not installable with pip and both `pipeline/scripts` and
`bootstrap/scripts` import it: running them requires the Docker image, which
ships GDAL from conda-forge, or a conda environment with `gdal`. The tests and
the type check work in the Poetry environment.

### 3. Docker (to run the pipeline)

The Dockerfile expects the **repository root** as build context, as on Clever
Cloud:

```bash
docker build -f data_pipeline/Dockerfile -t data-pipeline:latest .
docker run --rm --env-file data_pipeline/.env -e PYTHONUNBUFFERED=1 data-pipeline:latest
```

See [pipeline/README.md](./pipeline/README.md) for the steps and the S3 layout.

## Checks

```bash
poetry run pytest             # tests/, no database or S3 needed, coverage of pipeline/
poetry run mypy               # strict, scope in pyproject.toml ([tool.mypy])
pre-commit run --all-files    # from the repository root (ruff)
```

The tests target the pure functions of the pipeline (clustering, overlay,
matching of new clusters against the reference); `tests/conftest.py` stubs
`osgeo`. The same checks run in CI (`.github/workflows/pipeline-ci.yml`).
