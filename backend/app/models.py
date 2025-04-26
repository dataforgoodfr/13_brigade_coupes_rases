from datetime import datetime
from geoalchemy2 import Geometry, functions
from sqlalchemy import (
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
    clear_cut_id = Column(Integer, ForeignKey("clear_cuts.id"), primary_key=True)
    ecological_zoning_id = Column(
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
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    ecological_zonings = relationship(
        "EcologicalZoning", secondary=rules_ecological_zoning, back_populates="rules"
    )
    clear_cuts_reports = relationship(
        "ClearCutReport", secondary=rules_clear_cut_reports, back_populates="rules"
    )
    threshold = Column(Float, nullable=True)


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
    updated_at = Column(
        DateTime, default=datetime.now, onupdate=datetime.now, nullable=False
    )
    deleted_at = Column(DateTime, nullable=True)

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

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
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
    id = Column(Integer, primary_key=True, index=True)
    zip_code = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
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
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    sub_type = Column(String, nullable=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)
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
    id = Column(Integer, primary_key=True, index=True)
    area_hectare = Column(Float, nullable=False)
    location = Column(Geometry(geometry_type="Point", srid=SRID), nullable=False)
    boundary = Column(Geometry(geometry_type="MultiPolygon", srid=SRID), nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.now, onupdate=datetime.now, nullable=False
    )
    observation_start_date = Column(DateTime, nullable=False)
    observation_end_date = Column(DateTime, nullable=False)
    bdf_resinous_area_hectare = Column(Float, nullable=True)
    bdf_deciduous_area_hectare = Column(Float, nullable=True)
    bdf_mixed_area_hectare = Column(Float, nullable=True)
    bdf_poplar_area_hectare = Column(Float, nullable=True)
    ecological_zoning_area_hectare = Column(
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

    id = Column(Integer, primary_key=True, index=True)
    slope_area_ratio_percentage = Column(Float, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.now, onupdate=datetime.now, nullable=False
    )
    clear_cuts: Mapped[list["ClearCut"]] = relationship(back_populates="report")
    clear_cut_forms: Mapped[list["ClearCutReportForm"]] = relationship(back_populates="report")
    status = Column(String, nullable=False)
    city_id: Mapped[int] = mapped_column(ForeignKey("cities.id"), nullable=False)
    city: Mapped["City"] = relationship(
        back_populates="clear_cuts_reports", lazy="joined"
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)
    user: Mapped["User"] = relationship(back_populates="reports")

    total_area_hectare = Column(Float, nullable=True)
    total_ecological_zoning_area_hectare = Column(Float, nullable=True)
    total_bdf_resinous_area_hectare = Column(Float, nullable=True)
    total_bdf_deciduous_area_hectare = Column(Float, nullable=True)
    total_bdf_mixed_area_hectare = Column(Float, nullable=True)
    total_bdf_poplar_area_hectare = Column(Float, nullable=True)
    average_location = Column(Geometry(geometry_type="Point", srid=SRID), nullable=True)
    last_cut_date = Column(DateTime, default=datetime.now, nullable=True)
    first_cut_date = Column(DateTime, default=datetime.now, nullable=True)
    average_location_json = column_property(functions.ST_AsGeoJSON(average_location))

    rules = relationship(
        "Rules", secondary=rules_clear_cut_reports, back_populates="clear_cuts_reports"
    )

    @validates("status")
    def validate_status(self, key, value):
        if value not in CLEARCUT_STATUSES:
            raise ValueError(f"Status must be one of: {', '.join(CLEARCUT_STATUSES)}")
        return value


class ClearCutReportForm(Base):
    __tablename__ = "clear_cut_report_forms"
    id = Column(Integer, primary_key=True, index=True)

    report_id: Mapped[int] = mapped_column(ForeignKey("clear_cuts_reports.id"), nullable=False)
    report: Mapped["ClearCutReport"] = relationship(back_populates="clear_cut_forms")
    editor_id = Column(Integer, index=True, nullable=True)
    report_updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # Ground datas
    inspection_date = Column(DateTime, nullable=True)
    weather = Column(String, index=True)
    forest_description = Column(String, index=True)
    remainingTrees = Column(Boolean)
    species = Column(String, index=True)
    workSignVisible = Column(Boolean)
    waterzone_description = Column(String)
    protected_zone_description = Column(String)
    soil_state = Column(String)

    # Ecological informations
    ecological_zone = Column(Boolean)
    ecological_zone_type = Column(String)
    nearby_zone = Column(String)
    nearby_zone_type = Column(String)
    protected_species = Column(String)
    protected_habitats = Column(String)
    ddt_request = Column(Boolean)
    ddt_request_owner = Column(String)

    # Stakeholders
    compagny = Column(String)
    subcontractor = Column(String)
    landlord = Column(String)

    # Reglementation
    pefc_fsc_certified = Column(Boolean, nullable=True)
    over_20_ha = Column(Boolean, nullable=True)
    psg_required_plot = Column(Boolean, nullable=True)

    # Legal strategy
    relevant_for_pefc_complaint = Column(Boolean, nullable=True)
    relevant_for_rediii_complaint = Column(Boolean, nullable=True)
    relevant_for_ofb_complaint = Column(Boolean, nullable=True)
    relevant_for_alert_cnpf_ddt_srgs = Column(Boolean, nullable=True)
    relevant_for_alert_cnpf_ddt_psg_thresholds = Column(Boolean, nullable=True)
    relevant_for_psg_request = Column(Boolean, nullable=True)
    relevant_for_psg_request = Column(Boolean, nullable=True)
    request_engaged = Column(String, nullable=True)

    # Miscellaneous
    other = Column(String)


# class ClearCutPicture(Base):
#     __tablename__ = "clear_cut_pictures"

#     TAGS = ["plantation", "workSign", "clearcut", "wooden_logs", "access_ways", None]

#     id = Column(Integer, primary_key=True, index=True)
#     clear_cut_id = Column(Integer, ForeignKey("clear_cuts.id"), unique=True, index=True)
#     link = Column(String)
#     tag = Column(String, index=True)

#     @validates("tag")
#     def validate_status(self, key, value):
#         if value not in ClearCutPicture.TAGS:
#             raise ValueError(f"tag must be one of: {', '.join(ClearCut.STATUSES)}")
#         return value

#     # Tags : plantation, workSign, clearcut, wooden_logs, access_ways
#     # clear_cut_report = relationship("ClearCutReport", back_populates="clear_cut_report_pictures")
