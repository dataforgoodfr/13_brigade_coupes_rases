help: ## Show this help message
	@echo 'Usage:'
	@echo '  make <target>'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*?##/ { printf "  %-20s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

devserver: install-dev-dependencies upgrade-db ## Start the development server
	poetry run python -m app.main --host='0.0.0.0' --port=8080 --reload --proxy-headers --forwarded-allow-ips='*'

install-dev-dependencies: ## Install development dependencies
	poetry install --with backend

generate-migration: ## Generate a new migration
	poetry run alembic revision --autogenerate -m "migration"

upgrade-db: ## Upgrade the database
	poetry run alembic upgrade head	

upgrade-test-db: ## Upgrade the database
	ENVIRONMENT=test poetry run alembic upgrade head	
	
reset-db: ## Reset the database
	poetry run alembic downgrade base

reset-test-db: ## Reset the database
	ENVIRONMENT=test poetry run alembic downgrade base

seed-prd-db: ## Seed the database
	poetry run python -m seed_prd

seed-dev-db: ## Seed the database
	poetry run python -m seed_dev

test: ## Run all the tests with coverage (needs the test database, see upgrade-test-db)
	poetry run pytest test/ --cov

test-unit: ## Run the unit tests only (no database needed)
	poetry run pytest test/unit/ -m unit

erd: ## Print the data model as a Mermaid erDiagram (see doc/architecture.md)
	poetry run python -m erd

typecheck: ## Run mypy (scope in pyproject.toml, [tool.mypy])
	poetry run mypy


.PHONY: test test-unit typecheck help
