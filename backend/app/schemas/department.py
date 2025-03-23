from logging import getLogger
from .shared import DepartmentBase, UserBase

logger = getLogger(__name__)


class DepartmentResponse(DepartmentBase):
    users: list[UserBase]
