
from app.schemas.tag import TAGS, Tag


def get_tags() -> dict[str, Tag]: 
    return TAGS