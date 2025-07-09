import math
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

M = TypeVar("M")
C = TypeVar("C")


class HateaosResponse(BaseModel, Generic[M, C]):
    metadata: M
    content: C
    model_config = ConfigDict(from_attributes=True)


class Metadata(BaseModel):
    links: dict[str, str]
    model_config = ConfigDict(from_attributes=True)


class PaginationMetadataSchema(Metadata):
    page: int
    size: int
    pages_count: int
    total_count: int

    @classmethod
    def create(cls, page: int, size: int, total_count: int, url: str):
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


class PaginationResponseSchema(
    HateaosResponse[PaginationMetadataSchema, list[C]], Generic[C]
):
    pass
