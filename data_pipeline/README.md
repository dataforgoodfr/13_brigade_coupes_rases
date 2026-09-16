# ETL Cron

## Project Structure

```bash
data_pipeline/
├── config/
│   ├── config.yaml
├── data_temp/
├── logs/
│   ├── main.log
├── scripts/
│   ├── utils/
│   ├── extract.py
│   ├── main.py
│   ├── transform.py
├── tests/
├── .env
├── Makefile
├── .gitignore
├── Dockerfile
└── README.md
```

## Setup

### 1. Create Directories

Create the necessary directories `data_temp` and `logs`.

```bash
mkdir data_temp logs
```

### 2. Environment Variables (.env file)

Create a .env file in the root directory (data_pipeline/.env) to store environment variables.

Copy the template and fill in the values:

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

The Scaleway Object Storage credentials (`SCW_ACCESS_KEY` / `SCW_SECRET_KEY`) are in the project's Vaultwarden. Never commit `.env` (it is git-ignored).

### 3. Install Dependencies
Ensure you have Python 3.11 installed.

```bash
# Install Poetry
# Follow the instructions in the main README.md to install Poetry.

# Navigate to the project directory
cd data_pipeline

# Install dependencies using Poetry
make install-dev-deps
```

### 4. Set Up Docker (Optional)
If you prefer using Docker for running the pipeline, follow these steps:

```bash
# Build Docker Image
docker build -t data_pipeline .
``` 

# Running the ETL Pipeline
## Using Poetry

### Run the full ETL pipeline.

```bash
make run-pipeline
```

### Run Individual Tasks

To run specific tasks, use the run-task-poetry target and specify the task name.

Example:

```bash
make run-task-poetry task=verify_file_in_s3
```

## Using Docker
In order to use the Makefile commands, you need to have Docker installed on your machine. You also need to export USER_PROJECT_PATH before running, for the script to identify your path correctly. You can do this by running:
```bash
export USER_PROJECT_PATH=~/path/to/the/project/13_brigade_coupes_rases/data_pipeline
``` 
### Run the full ETL pipeline inside a Docker container.



Then, you can run the following command:

```bash
make run-pipeline-docker
```

### Run Individual Tasks Inside a Docker Container
To run specific tasks, use the run-task-docker target and specify the task name.

Example:

```bash
make run-task-docker task=verify_file_in_s3
```

### 5. Running Tests

```bash
poetry run pytest    # tests/, no database or S3 needed, coverage of pipeline/
```

The tests target the pure functions of the pipeline (clustering, overlay,
matching of new clusters against the reference); `tests/conftest.py` stubs
`osgeo` (GDAL), which is only available in the conda Docker image.

### 6. Pre-commit

```bash
pre-commit run --all-files    # from the repository root
```

### 7. Type check

```bash
poetry run mypy    # strict, scope defined in pyproject.toml ([tool.mypy])
```

### 8. Recommendations

Before any pull request, make sure you run pre-commit and the tests.