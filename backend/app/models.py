from sqlalchemy import Column, Integer, String, DateTime, Table, ForeignKey, Float
from geoalchemy2 import Geometry, functions
from app.database import Base
from datetime import datetime
from sqlalchemy.orm import (
    relationship,
    validates,
    mapped_column,
    Mapped,
    column_property,
)

SRID = 4326

user_department = Table(
    "user_department",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("department_id", Integer, ForeignKey("departments.id"), primary_key=True),
)


class ClearCutEcologicalZoning(Base):
    __tablename__ = "clear_cut_ecological_zoning"
    clear_cut_id = Column(Integer, ForeignKey("clear_cuts.id"), primary_key=True)
    ecological_zoning_id = Column(
        Integer, ForeignKey("ecological_zonings.id"), primary_key=True
    )
    clear_cut: Mapped["ClearCut"] = relationship(back_populates="ecological_zonings")
    ecological_zoning: Mapped["EcologicalZoning"] = relationship(back_populates="clear_cuts")
    area_hectare = Column(Float, nullable=False)


class User(Base):
    __tablename__ = "users"

    ROLES = ["admin", "volunteer"]

    id = Column(Integer, primary_key=True, index=True)
    firstname = Column(String, nullable=False)
    lastname = Column(String, nullable=False)
    login = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=True)
    role = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    # TODO: updated_at is not set when departments are updated
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    departments = relationship("Department", secondary=user_department, back_populates="users")
    reports = relationship("ClearCutReport", back_populates="user")

    @validates("role")
    def validate_role(self, key, value):
        if value not in User.ROLES:
            raise ValueError(f"Role must be one of: {', '.join(User.ROLES)}")
        return value


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    users = relationship("User", secondary=user_department, back_populates="departments")
    cities: Mapped[list["City"]] = relationship(back_populates="department")

    @validates("name")
    def validate_name(self, key, value):
        if key == "name" and value is None:
            raise ValueError("Name cannot be None")
        return value


class City(Base):
    __tablename__ = "cities"
    id = Column(Integer, primary_key=True, index=True)
    zip_code = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), nullable=False)
    department: Mapped["Department"] = relationship(back_populates="cities")
    clear_cuts_reports: Mapped[list["ClearCutReport"]] = relationship(back_populates="city")


NATURA_2000 = "Natura2000"


class EcologicalZoning(Base):
    __tablename__ = "ecological_zonings"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    sub_type = Column(String, nullable=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)
    clear_cuts: Mapped[list["ClearCutEcologicalZoning"]] = relationship(
        back_populates="ecological_zoning"
    )


CLEARCUT_STATUSES = [
    "to_validate",
    "waiting_for_validation",
    "legal_validated",
    "validated",
    "final_validated",
]


class ClearCut(Base):
    __tablename__ = "clear_cuts"
    id = Column(Integer, primary_key=True, index=True)
    area_hectare = Column(Float, nullable=False)
    location = Column(Geometry(geometry_type="Point", srid=SRID), nullable=False)
    boundary = Column(Geometry(geometry_type="MultiPolygon", srid=SRID), nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)
    observation_start_date = Column(DateTime, nullable=False)
    observation_end_date = Column(DateTime, nullable=False)

    report_id: Mapped[int] = mapped_column(ForeignKey("clear_cuts_reports.id"), nullable=False)
    report: Mapped["ClearCutReport"] = relationship(back_populates="clear_cuts")

    ecological_zonings: Mapped[list["ClearCutEcologicalZoning"]] = relationship(
        back_populates="clear_cut", lazy="joined"
    )
    location_json = column_property(functions.ST_AsGeoJSON(location))
    boundary_json = column_property(functions.ST_AsGeoJSON(boundary))


class ClearCutReport(Base):
    __tablename__ = "clear_cuts_reports"

    id = Column(Integer, primary_key=True, index=True)
    slope_area_ratio_percentage = Column(Float, index=True)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)
    clear_cuts: Mapped[list["ClearCut"]] = relationship(back_populates="report")
    status = Column(String, nullable=False)
    city_id: Mapped[int] = mapped_column(ForeignKey("cities.id"), nullable=False)
    city: Mapped["City"] = relationship(back_populates="clear_cuts_reports", lazy="joined")
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)
    user: Mapped["User"] = relationship(back_populates="reports")

    @validates("status")
    def validate_status(self, key, value):
        if value not in CLEARCUT_STATUSES:
            raise ValueError(f"Status must be one of: {', '.join(CLEARCUT_STATUSES)}")
        return value
