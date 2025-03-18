# Define variables
POETRY := poetry
PYTHON := $(POETRY) run python
PYTEST := $(POETRY) run pytest -v

# Default target
all: help

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@echo "  install-dev-deps    Install development dependencies"
	@echo "  test                Run all tests"
	@echo "  run-pipeline        Run the full ETL pipeline using poetry"
	@echo "  run-task-poetry     Run a specific task using poetry (e.g., make run-task-poetry task=verify_file_in_s3)"
	@echo "  run-docker          Run the full ETL pipeline using Docker"
	@echo "  run-task-docker     Run a specific task using Docker (e.g., make run-task-docker task=verify_file_in_s3)"

install-dev-deps:
	$(POETRY) install

test:
	$(PYTEST)

run-pipeline:
	$(PYTHON) scripts/main.py

run-task-poetry: task
	@echo "Running task: $(task)"
	$(PYTHON) scripts/main.py $(task)

build-docker:
	build docker -t data_pipeline .

run-task-docker: task
	@echo "Running task: $(task)"
	docker run -it -d \
		-v $(USER_PROJECT_PATH):/app \
		--memory=16g --cpus="4" --memory-swap="16g" --rm data_pipeline /bin/bash -c "$(PYTHON) scripts/main.py $(task)"

run-pipeline-docker:
	docker run -it -d \
		-v $(USER_PROJECT_PATH):/app \
		--memory=16g --cpus="4" --memory-swap="16g" --rm data_pipeline /bin/bash -c "$(PYTHON) scripts/main.py"