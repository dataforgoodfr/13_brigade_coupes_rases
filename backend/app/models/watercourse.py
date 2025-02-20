from sqlalchemy import Column, Integer, String
from app.database import Base


# FIXME: Model to be defined
class Watercourse(Base):
    __tablename__ = "watercourses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
