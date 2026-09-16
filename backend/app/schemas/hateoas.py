import math

from app.schemas.base import BaseSchema


class HateaosResponse[M, C](BaseSchema):
    metadata: M
    content: C


class Metadata(BaseSchema):
    links: dict[str, str]


class PaginationMetadataSchema(Metadata):
    page: int
    size: int
    pages_count: int
    total_count: int

    @classmethod
    def create(
        cls, page: int, size: int, total_count: int, url: str
    ) -> "PaginationMetadataSchema":
        links = {
            "self": f"{url}?page={page}&size={size}",
        }
        if page * size + size < total_count:
            links["next"] = f"{url}?page={page + 1}&size={size}"
        if page > 0:
            links["previous"] = f"{url}?page={page - 1}&size={size}"

        return cls(
            pages_count=math.ceil(total_count / size),
            total_count=total_count,
            size=size,
            page=page,
            links=links,
        )


class PaginationResponseSchema[C](HateaosResponse[PaginationMetadataSchema, list[C]]):
    pass
