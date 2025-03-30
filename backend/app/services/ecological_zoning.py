from app.models import EcologicalZoning
from app.schemas.ecological_zoning import (
    EcologicalZoningSchema,
    IdentifiedEcologicalZoningSchema,
    ecological_zoning_to_identified_ecological_zoning_schema,
)
from sqlalchemy.orm import Session

from app.schemas.hateoas import PaginationMetadataSchema, PaginationResponseSchema


def find_ecological_zonings_by_codes(db: Session, codes: list[str]) -> list[EcologicalZoning]:
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


def find_paginated_ecological_zonings(
    db: Session, url: str, page: int = 0, size: int = 10
) -> PaginationResponseSchema[IdentifiedEcologicalZoningSchema]:
    ecological_zonings = db.query(EcologicalZoning).offset(page * size).limit(size).all()
    ecolgocial_zonings_count = db.query(EcologicalZoning.id).count()
    return PaginationResponseSchema(
        metadata=PaginationMetadataSchema(
            page=page, size=size, total_count=ecolgocial_zonings_count, url=url
        ),
        content=[
            ecological_zoning_to_identified_ecological_zoning_schema(ecological_zoning)
            for ecological_zoning in ecological_zonings
        ],
    )
