from logging import getLogger
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# from app.schemas.clear_cut import ClearCutResponse

logger = getLogger(__name__)


class ClearCutPicture(BaseModel):
    id: int
    link: str
    tag: Optional[str] = None


class ClearCutReportFormBase(BaseModel):
    id: int
    inspection_date: Optional[datetime] = None
    weather: Optional[str]
    forest_description: Optional[str] = None
    remainingTrees: Optional[bool] = None
    species: Optional[str] = None
    workSignVisible: Optional[bool] = None
    waterzone_description: Optional[str] = None
    protected_zone_description: Optional[str] = None
    soil_state: Optional[str] = None
    other: Optional[str] = None
    ecological_zone: Optional[bool] = None
    ecological_zone_type: Optional[str] = None
    nearby_zone: Optional[str] = None
    nearby_zone_type: Optional[str] = None
    protected_species: Optional[str] = None
    protected_habitats: Optional[str] = None
    ddt_request: Optional[bool] = None
    ddt_request_owner: Optional[str] = None
    compagny: Optional[str] = None
    subcontractor: Optional[str] = None
    landlord: Optional[str] = None
    pefc_fsc_certified: Optional[bool] = None
    over_20_ha: Optional[bool] = None
    psg_required_plot: Optional[bool] = None


class ClearcutReportStrategy(BaseModel):
    relevant_for_pefc_complaint: Optional[bool] = None
    relevant_for_rediii_complaint: Optional[bool] = None
    relevant_for_ofb_complaint: Optional[bool] = None
    relevant_for_alert_cnpf_ddt_srgs: Optional[bool] = None
    relevant_for_alert_cnpf_ddt_psg_thresholds: Optional[bool] = None
    relevant_for_psg_request: Optional[bool] = None
    request_engaged: Optional[str] = None


class ClearCutReportFormResponse(ClearCutReportFormBase):
    report_updated_at: datetime


class ClearCutReportFormWithStrategy(ClearcutReportStrategy, ClearCutReportFormBase):
    _ = None


class ClearCutReportFormWithStrategyResponse(
    ClearcutReportStrategy, ClearCutReportFormResponse
):
    _ = None


class ClearCutReporCreate(ClearCutReportFormBase):
    editor_id: Optional[int] = None
