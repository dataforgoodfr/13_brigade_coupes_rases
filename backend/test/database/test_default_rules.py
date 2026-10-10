from alembic import command
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.models import Rules
from test.conftest import alembic_cfg

DEFAULT_RULES_REVISION = "c3d4e5f6a7b8"


def rerun_default_rules_migration() -> None:
    command.downgrade(alembic_cfg, f"{DEFAULT_RULES_REVISION}-1")
    command.upgrade(alembic_cfg, "head")


def rules_by_type(db: Session) -> dict[str, float | None]:
    db.expire_all()
    return {rule.type: rule.threshold for rule in db.scalars(select(Rules))}


def test_migration_creates_missing_default_rules(db: Session) -> None:
    db.execute(text("TRUNCATE TABLE rules CASCADE"))
    db.commit()

    rerun_default_rules_migration()

    assert rules_by_type(db) == {"area": 10.0, "slope": 2.0, "ecological_zoning": 0.5}


def test_migration_keeps_existing_rules(db: Session) -> None:
    area_rule = db.scalars(select(Rules).where(Rules.type == "area")).one()
    area_rule.threshold = 20.0
    db.commit()

    rerun_default_rules_migration()

    rules = rules_by_type(db)
    assert len(db.scalars(select(Rules)).all()) == 3
    assert rules["area"] == 20.0
