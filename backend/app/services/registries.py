from typing import Optional
from app.models import Registry
from app.schemas.registry import CreateRegistrySchema
from sqlalchemy.orm import Session

from app.services.city import get_city_by_zip_code

""" 
def get_registries_filtered(
    db: Session,registries: list[CreateRegistry]
) -> Optional[Registry]:
    stmts = [
        sa.select([
            sa.cast(sa.literal(registry.section), String).label("section"),
            sa.cast(sa.literal(registry.sheet), Integer).label("sheet"),
            sa.cast(sa.literal(registry.number), String).label("number"),
            sa.cast(sa.literal(registry.zip_code), sa.Integer).label("zip_code"),
        ]) if idx == 0 else
        sa.select([sa.literal(registry.section), sa.literal(registry.sheet), sa.literal(registry.number), sa.literal(registry.zip_code)])

        for idx,registry in enumerate(registries)
    ]
    subquery = sa.union_all(*stmts)
    subquery = subquery.cte(name="temp_table")
    return db.query(Registry).join(
        subquery, Registry.section == subquery.c.section and  
    )

"""


def get_registry_by_section_sheet_number_zip_code(
    db: Session,
    section: str,
    sheet: int,
    number: str,
    zip_code: str,
    district_code: str,
) -> Optional[Registry]:
    return (
        db.query(Registry)
        .filter(
            Registry.section == section
            and Registry.sheet == sheet
            and Registry.number == number
            and Registry.city.zip_code == zip_code
            and Registry.city.district_code == district_code
        )
        .first()
    )


def find_or_add_registries(
    db: Session, registries: list[CreateRegistrySchema]
) -> list[Registry]:
    found_registries = [
        found_registry
        for found_registry in [
            get_registry_by_section_sheet_number_zip_code(
                db,
                section=registry.section,
                sheet=registry.sheet,
                number=registry.number,
                zip_code=registry.zip_code,
                district_code=registry.district_code,
            )
            for registry in registries
        ]
        if found_registry is not None
    ]
    registries_to_create = [
        Registry(
            number=registry.number,
            sheet=registry.sheet,
            section=registry.section,
            city=get_city_by_zip_code(db, zip_code=registry.zip_code),
            district_code=registry.district_code,
        )
        for registry in registries
        if all(
            [
                found_registry.section != registry.section
                and found_registry.sheet != registry.sheet
                and found_registry.number != registry.number
                and found_registry.district_code != registry.district_code
                and found_registry.city.zip_code != registry.zip_code
                for found_registry in found_registries
            ]
        )
    ]
    db.add_all(registries_to_create)
    db.flush()
    return found_registries + registries_to_create
