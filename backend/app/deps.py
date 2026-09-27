from typing import Annotated

from fastapi import Depends, Query

from app.database import get_db

db_session = Depends(get_db)

# Upper bound on a page of a paginated list: the admin screens ask for at most
# 100 items, and an unbounded size would load a whole table in one request.
MAX_PAGE_SIZE = 100

PageParam = Annotated[int, Query(ge=0)]
PageSizeParam = Annotated[int, Query(ge=1, le=MAX_PAGE_SIZE)]
