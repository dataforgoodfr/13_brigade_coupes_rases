# ETL Cron

## Project Structure

```bash
# Structure du projet

data_pipeline/
├── config/
│   ├── config.yaml
├── data_temp/
├── logs/
│   ├── extract.log
│   ├── transform.log
├── scripts/
│   ├── utils/
│   │   ├── .env # Copy the env.example file
│   │   ├── date_parser.py
│   │   ├── disjoin_set.py
│   │   ├── logging.py
│   │   ├── s3.py
│   ├── extract.py
│   ├── main.py
│   ├── transform.py
├── tests/
│   ├── test_s3.py
│   ├── test_utils.py
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

Template for .env:

```python
# General Configuration
S3_REGION = "s3-region"
S3_ENDPOINT = "s3-endpoint"
AWS_ACCESS_KEY_ID = "aws-access-key-id" 
AWS_SECRET_ACCESS_KEY = "aws-secret-access-key" 
S3_BUCKET_NAME = "s3-bucket-name"
```
KeePass Configuration:
You can find the password in the Vaultwarden of the project, and you will find the S3 credentials to work with the project locally.

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

Use the Makefile to run tests.

```bash
make test
```

### 6. Running Tests

Use the Makefile to run pre-commit hooks.

```bash
make pre-commit
```

### 6. Recommendations

Before any pull request, make sure you run pre-commit and the tests.