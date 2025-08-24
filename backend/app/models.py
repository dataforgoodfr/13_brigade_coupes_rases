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
    Index,
    Integer,
    String,
    Table,
    text,
)
from sqlalchemy.event import listens_for
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
user_clear_cut_report = Table(
    "user_clear_cut_report",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("report_id", Integer, ForeignKey("clear_cuts_reports.id"), primary_key=True),
)

class ClearCutEcologicalZoning(Base):
    __tablename__ = "clear_cut_ecological_zoning"
    clear_cut_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("clear_cuts.id"), primary_key=True
    )
    ecological_zoning_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("ecological_zonings.id"), primary_key=True
    )
    clear_cut: Mapped["ClearCut"] = relationship(
        back_populates="ecological_zonings", cascade="all, delete"
    )
    ecological_zoning: Mapped["EcologicalZoning"] = relationship(
        back_populates="clear_cuts", cascade="all, delete"
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
        "EcologicalZoning",
        secondary=rules_ecological_zoning,
        back_populates="rules",
        cascade="all, delete",
    )
    clear_cuts_reports = relationship(
        "ClearCutReport",
        secondary=rules_clear_cut_reports,
        back_populates="rules",
        cascade="all, delete",
    )
    threshold: Mapped[float | None] = mapped_column(Float, nullable=True)


class User(Base):
    __tablename__ = "users"

    ROLES = ["admin", "volunteer"]

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    login: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now, nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Full-text search column
    search_vector: Mapped[str] = mapped_column(String, nullable=True)

    __table_args__ = (
        Index("ix_users_search_vector", "search_vector", postgresql_using="gin"),
    )

    departments = relationship(
        "Department",
        secondary=user_department,
        back_populates="users",
        cascade="all, delete",
    )

    reports = relationship(
        "ClearCutReport", back_populates="user", cascade="all, delete"
    )
    favorites = relationship(
        "ClearCutReport",
        secondary=user_clear_cut_report,
        back_populates="favorited_by",
        cascade="all, delete",
    )
    forms = relationship("ClearCutForm", back_populates="editor", cascade="all, delete")

    @validates("role")
    def validate_role(self, key, value):
        if value not in User.ROLES:
            raise ValueError(f"Role must be one of: {', '.join(User.ROLES)}")
        return value


@listens_for(User, "before_insert")
@listens_for(User, "before_update")
def update_search_vector(mapper, connection, target):
    connection.execute(
        text("""
            UPDATE users
            SET search_vector = concat(first_name,last_name,login,email)
            WHERE id = :id
        """),
        {"id": target.id},
    )


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    users = relationship(
        "User",
        secondary=user_department,
        back_populates="departments",
        cascade="all, delete",
    )
    cities: Mapped[list["City"]] = relationship(
        back_populates="department", cascade="all, delete"
    )

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
    department: Mapped["Department"] = relationship(
        back_populates="cities", cascade="all, delete"
    )
    clear_cuts_reports: Mapped[list["ClearCutReport"]] = relationship(
        back_populates="city", cascade="all, delete"
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
        back_populates="ecological_zoning", cascade="all, delete"
    )
    rules = relationship(
        "Rules",
        secondary=rules_ecological_zoning,
        back_populates="ecological_zonings",
        cascade="all, delete",
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
    report: Mapped["ClearCutReport"] = relationship(
        back_populates="clear_cuts", cascade="all, delete"
    )

    ecological_zonings: Mapped[list["ClearCutEcologicalZoning"]] = relationship(
        back_populates="clear_cut", lazy="joined", cascade="all, delete"
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
    clear_cuts: Mapped[list["ClearCut"]] = relationship(
        back_populates="report", cascade="all, delete"
    )
    clear_cut_forms: Mapped[list["ClearCutForm"]] = relationship(
        back_populates="report", cascade="all, delete"
    )
    status: Mapped[str] = mapped_column(String, nullable=False)
    city_id: Mapped[int] = mapped_column(ForeignKey("cities.id"), nullable=False)
    city: Mapped["City"] = relationship(
        back_populates="clear_cuts_reports", lazy="joined", cascade="all, delete"
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)
    user: Mapped["User"] = relationship(back_populates="reports", cascade="all, delete")

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

    statellite_images: Mapped[list | None] = mapped_column(JSON, nullable=True)
    rules = relationship(
        "Rules",
        secondary=rules_clear_cut_reports,
        back_populates="clear_cuts_reports",
        cascade="all, delete",
    )

    favorited_by = relationship(
        "User",
        secondary=user_clear_cut_report,
        back_populates="favorites",
        cascade="all, delete",
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
    editor_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    editor: Mapped["User"] = relationship(back_populates="forms", cascade="all, delete")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now
    )

    # Ground datas
    inspection_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    weather: Mapped[str | None] = mapped_column(String, index=True)
    forest: Mapped[str | None] = mapped_column(String, index=True)
    has_remaining_trees: Mapped[bool | None] = mapped_column(Boolean)
    trees_species: Mapped[str | None] = mapped_column(String, index=True)
    planting_images: Mapped[list | None] = mapped_column(JSON, nullable=True)
    has_construction_panel: Mapped[bool | None] = mapped_column(Boolean)
    construction_panel_images: Mapped[list | None] = mapped_column(JSON, nullable=True)
    wetland: Mapped[str | None] = mapped_column(String)
    destruction_clues: Mapped[str | None] = mapped_column(String)
    soil_state: Mapped[str | None] = mapped_column(String)
    clear_cut_images: Mapped[list | None] = mapped_column(JSON, nullable=True)
    tree_trunks_images: Mapped[list | None] = mapped_column(JSON, nullable=True)
    soil_state_images: Mapped[list | None] = mapped_column(JSON, nullable=True)
    access_road_images: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Ecological informations
    has_other_ecological_zone: Mapped[bool | None] = mapped_column(Boolean)
    other_ecological_zone_type: Mapped[str | None] = mapped_column(String)
    has_nearby_ecological_zone: Mapped[bool | None] = mapped_column(Boolean)
    nearby_ecological_zone_type: Mapped[str | None] = mapped_column(String)
    protected_species: Mapped[str | None] = mapped_column(String)
    protected_habitats: Mapped[str | None] = mapped_column(String)
    has_ddt_request: Mapped[bool | None] = mapped_column(Boolean)
    ddt_request_owner: Mapped[str | None] = mapped_column(String)

    # Stakeholders
    company: Mapped[str | None] = mapped_column(String)
    subcontractor: Mapped[str | None] = mapped_column(String)
    landlord: Mapped[str | None] = mapped_column(String)

    # Reglementation
    is_pefc_fsc_certified: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    is_over_20_ha: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    is_psg_required_plot: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

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
