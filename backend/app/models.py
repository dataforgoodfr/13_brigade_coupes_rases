from sqlalchemy import Boolean, Column, Integer, String, DateTime, Table, ForeignKey, Float
from geoalchemy2 import Geometry
from app.database import Base
from datetime import datetime
from sqlalchemy.orm import relationship, validates


user_department = Table(
    "user_department",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("department_id", Integer, ForeignKey("departments.id"), primary_key=True),
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
    # TODO: updated_at is not set when departments are updated
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    deleted_at = Column(DateTime, nullable=True)

    departments = relationship("Department", secondary=user_department, back_populates="users")
    clear_cuts = relationship("ClearCut", back_populates="user")

    @validates("role")
    def validate_role(self, key, value):
        if value not in User.ROLES:
            raise ValueError(f"Role must be one of: {', '.join(User.ROLES)}")
        return value


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, index=True)
    name = Column(String)
    users = relationship("User", secondary=user_department, back_populates="departments")
    clear_cuts = relationship("ClearCut", back_populates="department")

    @validates("name")
    def validate_name(self, key, value):
        if key == "name" and value is None:
            raise ValueError("Name cannot be None")
        return value


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
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    clear_cut_report = relationship("ClearCutReport", uselist=False)
    clear_cut_report_pictures = relationship("ClearCutPicture")

    department = relationship("Department", back_populates="clear_cuts")
    user = relationship("User", back_populates="clear_cuts")

    @validates("status")
    def validate_status(self, key, value):
        if value not in ClearCut.STATUSES:
            raise ValueError(f"Status must be one of: {', '.join(ClearCut.STATUSES)}")
        return value


CLEAR_CUT_PREVIEW_COLUMNS = [
    ClearCut.location,
    ClearCut.boundary,
    ClearCut.slope_percentage,
    ClearCut.department_id,
    ClearCut.created_at,
]


class ClearCutReport(Base):
    __tablename__ = "clear_cut_reports"
    id = Column(Integer, primary_key=True, index=True)
    clear_cut_id = Column(Integer, ForeignKey("clear_cuts.id"), unique=True, index=True)

    clear_cut_id = Column(Integer, ForeignKey("clear_cuts.id"), unique=True, index=True)
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


class ClearCutPicture(Base):
    __tablename__ = "clear_cut_pictures"

    TAGS = ["plantation", "workSign", "clearcut", "wooden_logs", "access_ways", None]

    id = Column(Integer, primary_key=True, index=True)
    clear_cut_id = Column(Integer, ForeignKey("clear_cuts.id"), unique=True, index=True)
    link = Column(String)
    tag = Column(String, index=True)

    @validates("tag")
    def validate_status(self, key, value):
        if value not in ClearCutPicture.TAGS:
            raise ValueError(f"tag must be one of: {', '.join(ClearCut.STATUSES)}")
        return value

    # Tags : plantation, workSign, clearcut, wooden_logs, access_ways
    # clear_cut_report = relationship("ClearCutReport", back_populates="clear_cut_report_pictures")
