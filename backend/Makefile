devserver:
	poetry run python -m app.main --host='0.0.0.0' --port=8000 --reload --proxy-headers --forwarded-allow-ips='*'

migrate:
	poetry run alembic revision --autogenerate -m "migration"

upgrade:
	poetry run alembic upgrade head
