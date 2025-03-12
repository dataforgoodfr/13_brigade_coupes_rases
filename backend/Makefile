help: ## Show this help message
	@echo 'Usage:'
	@echo '  make <target>'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*?##/ { printf "  %-20s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

devserver: install-dev-dependencies upgrade-db ## Start the development server
	poetry run python -m app.main --host='0.0.0.0' --port=8080 --reload --proxy-headers --forwarded-allow-ips='*'

dev: 
	poetry run python -m app.main --host='0.0.0.0' --port=8080 --reload --proxy-headers --forwarded-allow-ips='*'

install-dev-dependencies: ## Install development dependencies
	poetry install --with backend

generate-migration: ## Generate a new migration
	poetry run alembic revision --autogenerate -m "migration"

upgrade-db: ## Upgrade the database
	poetry run alembic upgrade head

reset-db: ## Reset the database
	poetry run alembic downgrade base

seed-db: ## Seed the database
	poetry run python -m seed_dev

test: ## Run the tests
	poetry run pytest test/

.PHONY: test help
