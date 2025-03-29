from typing import Optional
from app.models import NATURA_2000, EcologicalZoning
from app.schemas.ecological_zoning import EcologicalZoningSchema
from sqlalchemy.orm import Session

from app.services.city import get_city_by_zip_code


def find_ecological_zonings_by_codes(
    db: Session, codes: list[str]
) -> list[EcologicalZoning]:
    return db.query(EcologicalZoning).filter(EcologicalZoning.code.in_(codes)).all()


def find_or_add_ecological_zonings(
    db: Session, ecological_zonings: list[EcologicalZoningSchema]
) -> EcologicalZoning:

    found_ecological_zonings = find_ecological_zonings_by_codes(
        db, codes=[ecological_zoning.code for ecological_zoning in ecological_zonings]
    )
    ecological_zonings_to_create = [
        EcologicalZoning(
            type=ecological_zoning.type,
            sub_type=ecological_zoning.sub_type,
            name=ecological_zoning.name,
            code=ecological_zoning.code,
        )
        for ecological_zoning in ecological_zonings
        if all(
            [
                found_ecological_zoning.code != ecological_zoning.code
                for found_ecological_zoning in found_ecological_zonings
            ]
        )
    ]
    db.add_all(ecological_zonings_to_create)
    db.flush()
    return found_ecological_zonings + ecological_zonings_to_create
