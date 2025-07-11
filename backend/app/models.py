from datetime import datetime

from geoalchemy2 import Geometry, functions
from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
)
from sqlalchemy.orm import (
    Mapped,
    column_property,
    mapped_column,
    relationship,
    validates,
)

from app.database import Base

SRID = 4326

user_department = Table(
    "user_department",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("department_id", Integer, ForeignKey("departments.id"), primary_key=True),
)


class ClearCutEcologicalZoning(Base):
    __tablename__ = "clear_cut_ecological_zoning"
    clear_cut_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("clear_cuts.id"), primary_key=True
    )
    ecological_zoning_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("ecological_zonings.id"), primary_key=True
    )
    clear_cut: Mapped["ClearCut"] = relationship(back_populates="ecological_zonings")
    ecological_zoning: Mapped["EcologicalZoning"] = relationship(
        back_populates="clear_cuts"
    )


rules_ecological_zoning = Table(
    "rules_ecological_zonings",
    Base.metadata,
    Column("rule_id", Integer, ForeignKey("rules.id"), primary_key=True),
    Column(
        "ecological_zoning_id",
        Integer,
        ForeignKey("ecological_zonings.id"),
        primary_key=True,
    ),
)
rules_clear_cut_reports = Table(
    "rules_clear_cuts_reports",
    Base.metadata,
    Column("rule_id", Integer, ForeignKey("rules.id"), primary_key=True),
    Column(
        "report_id",
        Integer,
        ForeignKey("clear_cuts_reports.id"),
        primary_key=True,
    ),
)


class Rules(Base):
    __tablename__ = "rules"
    RULES = ["slope", "area", "ecological_zoning"]
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    type: Mapped[str] = mapped_column(String, nullable=False)
    ecological_zonings = relationship(
        "EcologicalZoning", secondary=rules_ecological_zoning, back_populates="rules"
    )
    clear_cuts_reports = relationship(
        "ClearCutReport", secondary=rules_clear_cut_reports, back_populates="rules"
    )
    threshold: Mapped[float | None] = mapped_column(Float, nullable=True)


class User(Base):
    __tablename__ = "users"

    ROLES = ["admin", "volunteer"]

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    firstname: Mapped[str] = mapped_column(String, nullable=False)
    lastname: Mapped[str] = mapped_column(String, nullable=False)
    login: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, nullable=False
    )
    # TODO: updated_at is not set when departments are updated
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now, nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    departments = relationship(
        "Department", secondary=user_department, back_populates="users"
    )
    reports = relationship("ClearCutReport", back_populates="user")

    @validates("role")
    def validate_role(self, key, value):
        if value not in User.ROLES:
            raise ValueError(f"Role must be one of: {', '.join(User.ROLES)}")
        return value


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    users = relationship(
        "User", secondary=user_department, back_populates="departments"
    )
    cities: Mapped[list["City"]] = relationship(back_populates="department")

    @validates("name")
    def validate_name(self, key, value):
        if key == "name" and value is None:
            raise ValueError("Name cannot be None")
        return value


class City(Base):
    __tablename__ = "cities"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    zip_code: Mapped[str] = mapped_column(String, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id"), nullable=False
    )
    department: Mapped["Department"] = relationship(back_populates="cities")
    clear_cuts_reports: Mapped[list["ClearCutReport"]] = relationship(
        back_populates="city"
    )


NATURA_2000 = "Natura2000"


class EcologicalZoning(Base):
    __tablename__ = "ecological_zonings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    type: Mapped[str] = mapped_column(String, nullable=False)
    sub_type: Mapped[str | None] = mapped_column(String, nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    code: Mapped[str] = mapped_column(String, nullable=False)
    clear_cuts: Mapped[list["ClearCutEcologicalZoning"]] = relationship(
        back_populates="ecological_zoning"
    )
    rules = relationship(
        "Rules", secondary=rules_ecological_zoning, back_populates="ecological_zonings"
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
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    area_hectare: Mapped[float] = mapped_column(Float, nullable=False)
    location: Mapped[str] = mapped_column(
        Geometry(geometry_type="Point", srid=SRID), nullable=False
    )
    boundary: Mapped[str] = mapped_column(
        Geometry(geometry_type="MultiPolygon", srid=SRID), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now, nullable=False
    )
    observation_start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    observation_end_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    bdf_resinous_area_hectare: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    bdf_deciduous_area_hectare: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    bdf_mixed_area_hectare: Mapped[float | None] = mapped_column(Float, nullable=True)
    bdf_poplar_area_hectare: Mapped[float | None] = mapped_column(Float, nullable=True)
    ecological_zoning_area_hectare: Mapped[float | None] = mapped_column(
        Float,
        CheckConstraint(
            "ecological_zoning_area_hectare <= area_hectare + 0.000001",
            name="ecological_zoning_area_smaller_than_clear_cut_area",
        ),
        nullable=True,
    )
    report_id: Mapped[int] = mapped_column(
        ForeignKey("clear_cuts_reports.id"), nullable=False
    )
    report: Mapped["ClearCutReport"] = relationship(back_populates="clear_cuts")

    ecological_zonings: Mapped[list["ClearCutEcologicalZoning"]] = relationship(
        back_populates="clear_cut", lazy="joined"
    )
    location_json = column_property(functions.ST_AsGeoJSON(location))
    boundary_json = column_property(functions.ST_AsGeoJSON(boundary))

    __table_args__ = (
        CheckConstraint(
            """
            COALESCE(bdf_resinous_area_hectare, 0)
            + COALESCE(bdf_deciduous_area_hectare, 0)
            + COALESCE(bdf_mixed_area_hectare, 0)
            + COALESCE(bdf_poplar_area_hectare, 0)
            <= area_hectare + 0.000001
            """,
            name="bdf_area_smaller_than_clear_cut_area",
        ),
    )


class ClearCutReport(Base):
    __tablename__ = "clear_cuts_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    slope_area_hectare: Mapped[float | None] = mapped_column(
        Float, index=True, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now, nullable=False
    )
    clear_cuts: Mapped[list["ClearCut"]] = relationship(back_populates="report")
    clear_cut_forms: Mapped[list["ClearCutForm"]] = relationship(
        back_populates="report"
    )
    status: Mapped[str] = mapped_column(String, nullable=False)
    city_id: Mapped[int] = mapped_column(ForeignKey("cities.id"), nullable=False)
    city: Mapped["City"] = relationship(
        back_populates="clear_cuts_reports", lazy="joined"
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)
    user: Mapped["User"] = relationship(back_populates="reports")

    total_area_hectare: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_ecological_zoning_area_hectare: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    total_bdf_resinous_area_hectare: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    total_bdf_deciduous_area_hectare: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    total_bdf_mixed_area_hectare: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    total_bdf_poplar_area_hectare: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    average_location: Mapped[Geometry | None] = mapped_column(
        Geometry(geometry_type="Point", srid=SRID), nullable=True
    )
    last_cut_date: Mapped[datetime | None] = mapped_column(
        DateTime, default=datetime.now, nullable=True
    )
    first_cut_date: Mapped[datetime | None] = mapped_column(
        DateTime, default=datetime.now, nullable=True
    )
    average_location_json = column_property(functions.ST_AsGeoJSON(average_location))

    rules = relationship(
        "Rules", secondary=rules_clear_cut_reports, back_populates="clear_cuts_reports"
    )

    @validates("status")
    def validate_status(self, key, value):
        if value not in CLEARCUT_STATUSES:
            raise ValueError(f"Status must be one of: {', '.join(CLEARCUT_STATUSES)}")
        return value


class ClearCutForm(Base):
    __tablename__ = "clear_cut_report_forms"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    report_id: Mapped[int] = mapped_column(
        ForeignKey("clear_cuts_reports.id"), nullable=False
    )
    report: Mapped["ClearCutReport"] = relationship(back_populates="clear_cut_forms")
    editor_id: Mapped[int | None] = mapped_column(Integer, index=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now
    )

    # Ground datas
    inspection_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    weather: Mapped[str | None] = mapped_column(String, index=True)
    forest_description: Mapped[str | None] = mapped_column(String, index=True)
    remainingTrees: Mapped[bool | None] = mapped_column(Boolean)
    species: Mapped[str | None] = mapped_column(String, index=True)
    workSignVisible: Mapped[bool | None] = mapped_column(Boolean)
    waterzone_description: Mapped[str | None] = mapped_column(String)
    protected_zone_description: Mapped[str | None] = mapped_column(String)
    soil_state: Mapped[str | None] = mapped_column(String)

    # Ecological informations
    ecological_zone: Mapped[bool | None] = mapped_column(Boolean)
    ecological_zone_type: Mapped[str | None] = mapped_column(String)
    nearby_zone: Mapped[str | None] = mapped_column(String)
    nearby_zone_type: Mapped[str | None] = mapped_column(String)
    protected_species: Mapped[str | None] = mapped_column(String)
    protected_habitats: Mapped[str | None] = mapped_column(String)
    ddt_request: Mapped[bool | None] = mapped_column(Boolean)
    ddt_request_owner: Mapped[str | None] = mapped_column(String)

    # Stakeholders
    compagny: Mapped[str | None] = mapped_column(String)
    subcontractor: Mapped[str | None] = mapped_column(String)
    landlord: Mapped[str | None] = mapped_column(String)

    # Reglementation
    pefc_fsc_certified: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    over_20_ha: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    psg_required_plot: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # Legal strategy
    relevant_for_pefc_complaint: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True
    )
    relevant_for_rediii_complaint: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True
    )
    relevant_for_ofb_complaint: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True
    )
    relevant_for_alert_cnpf_ddt_srgs: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True
    )
    relevant_for_alert_cnpf_ddt_psg_thresholds: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True
    )
    relevant_for_psg_request: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True
    )
    request_engaged: Mapped[str | None] = mapped_column(String, nullable=True)

    # Miscellaneous
    other: Mapped[str | None] = mapped_column(String)

    # Image fields (S3 keys stored as JSON arrays or strings)
    images_clear_cut: Mapped[list | None] = mapped_column(JSON, nullable=True)
    images_plantation: Mapped[list | None] = mapped_column(JSON, nullable=True)
    image_worksite_sign: Mapped[list | None] = mapped_column(JSON, nullable=True)
    images_tree_trunks: Mapped[list | None] = mapped_column(JSON, nullable=True)
    images_soil_state: Mapped[list | None] = mapped_column(JSON, nullable=True)
    images_access_road: Mapped[list | None] = mapped_column(JSON, nullable=True)
