from logging import getLogger
from pydantic import BaseModel

logger = getLogger(__name__)

# Schéma pour la création d'une nouvelle instance de ClearCut
class DepartmentBase(BaseModel):
    id: int
    code: int