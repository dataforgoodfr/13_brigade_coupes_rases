from alembic import command
from sqlalchemy import text
from sqlalchemy.orm import Session

from test.conftest import alembic_cfg

UNIQUE_CITIES_REVISION = "e5f6a7b8c9d0"


def cities_by_code(db: Session, code: str) -> list[tuple[int, str, str]]:
    return [
        (row.id, row.name, row.department)
        for row in db.execute(
            text(
                "SELECT c.id, c.name, d.code AS department FROM cities c "
                "JOIN departments d ON d.id = c.department_id "
                "WHERE c.zip_code = :code ORDER BY c.id"
            ),
            {"code": code},
        )
    ]


def test_migration_merges_duplicated_cities(db: Session) -> None:
    command.downgrade(alembic_cfg, f"{UNIQUE_CITIES_REVISION}-1")
    # Same state as production: Ain cities in the Aisne, no Ain department,
    # first city missing, delegated communes loaded as extra rows.
    db.execute(
        text(
            "UPDATE cities SET department_id = "
            "(SELECT id FROM departments WHERE code = '02') "
            "WHERE department_id = (SELECT id FROM departments WHERE code = '01')"
        )
    )
    db.execute(text("DELETE FROM departments WHERE code = '01'"))
    db.execute(text("DELETE FROM cities WHERE zip_code = '01001'"))
    delegated_id = db.execute(
        text(
            "INSERT INTO cities (zip_code, name, department_id) "
            "SELECT '01015', 'Arbignieu', id FROM departments WHERE code = '02' "
            "RETURNING id"
        )
    ).scalar_one()
    db.execute(
        text(
            "INSERT INTO cities (zip_code, name, department_id) "
            "SELECT '79005', 'Airvault', id FROM departments WHERE code = '02'"
        )
    )
    db.execute(
        text(
            "INSERT INTO cities (zip_code, name, department_id) "
            "SELECT '01039', 'Béon', id FROM departments WHERE code = '02'"
        )
    )
    report_id = db.execute(
        text("SELECT id FROM clear_cuts_reports ORDER BY id LIMIT 1")
    ).scalar_one()
    db.execute(
        text("UPDATE clear_cuts_reports SET city_id = :city WHERE id = :id"),
        {"city": delegated_id, "id": report_id},
    )
    db.commit()

    command.upgrade(alembic_cfg, "head")

    assert [city[1:] for city in cities_by_code(db, "01001")] == [
        ("L'Abergement-Clémenciat", "01")
    ]
    assert [city[1:] for city in cities_by_code(db, "01002")] == [
        ("L'Abergement-de-Varey", "01")
    ]
    assert [city[1:] for city in cities_by_code(db, "01039")] == [("Béon", "01")]
    assert [city[1:] for city in cities_by_code(db, "79005")] == [("Airvault", "79")]
    arboys = cities_by_code(db, "01015")
    assert [city[1:] for city in arboys] == [("Arboys en Bugey", "01")]
    assert (
        db.execute(
            text("SELECT city_id FROM clear_cuts_reports WHERE id = :id"),
            {"id": report_id},
        ).scalar_one()
        == arboys[0][0]
    )
    assert (
        db.execute(
            text(
                "SELECT count(*) FROM cities c JOIN departments d "
                "ON d.id = c.department_id WHERE d.code = '02' "
                "AND c.zip_code NOT LIKE '02%'"
            )
        ).scalar_one()
        == 0
    )


def test_migration_keeps_clean_cities(db: Session) -> None:
    snapshot = "SELECT md5(string_agg(id || zip_code || name || department_id, ',' ORDER BY id)) FROM cities"
    before = db.execute(text(snapshot)).scalar_one()
    db.commit()

    command.downgrade(alembic_cfg, f"{UNIQUE_CITIES_REVISION}-1")
    command.upgrade(alembic_cfg, "head")

    assert db.execute(text(snapshot)).scalar_one() == before
