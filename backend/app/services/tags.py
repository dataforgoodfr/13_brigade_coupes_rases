from app.schemas.tag import TAGS, TagSchema


def get_tags() -> dict[str, TagSchema]:
    return TAGS
