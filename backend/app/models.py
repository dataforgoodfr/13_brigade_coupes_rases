from sqlalchemy import Column, Integer, String, DateTime, Table, ForeignKey, Float
from geoalchemy2 import Geometry
from app.database import Base
from datetime import datetime
from sqlalchemy.orm import relationship, validates


# FIXME: This is just an example model. We should remove this and create our own models
class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)


user_department = Table(
    "user_department",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("department_id", Integer, ForeignKey("departments.id"), primary_key=True),
)

user_clear_cut = Table(
    "user_clear_cut",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("clear_cut_id", Integer, ForeignKey("clear_cuts.id"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    ROLES = ["admin", "viewer", "volunteer"]

    id = Column(Integer, primary_key=True, index=True)
    firstname = Column(String, index=True)
    lastname = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    role = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now)
    deleted_at = Column(DateTime, nullable=True)

    departments = relationship("Department", secondary=user_department, back_populates="users")
    clear_cuts = relationship("ClearCut", secondary=user_clear_cut, back_populates="users")

    @validates("role")
    def validate_role(self, key, value):
        if value not in User.ROLES:
            raise ValueError(f"Role must be one of: {', '.join(User.ROLES)}")
        return value


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(Integer, index=True)
    users = relationship("User", secondary=user_department, back_populates="departments")
    clear_cuts = relationship("ClearCut", back_populates="department")


class ClearCut(Base):
    __tablename__ = "clear_cuts"

    STATUSES = ["pending", "validated"]

    id = Column(Integer, primary_key=True, index=True)
    cut_date = Column(DateTime, index=True)
    slope_percentage = Column(Float, index=True)
    location = Column(Geometry("Point"), index=True)
    boundary = Column(Geometry("Polygon"), index=True)
    status = Column(String, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now)

    department = relationship("Department", back_populates="clear_cuts")
    user = relationship("User", back_populates="clear_cuts")
    users = relationship("User", secondary=user_clear_cut, back_populates="clear_cuts")

    @validates("status")
    def validate_status(self, key, value):
        if value not in ClearCut.STATUSES:
            raise ValueError(f"Status must be one of: {', '.join(ClearCut.STATUSES)}")
        return value
