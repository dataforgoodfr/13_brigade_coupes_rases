from logging import getLogger
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

logger = getLogger(__name__)


class ClearCutPicture(BaseModel):
    id: int
    link: str
    tag: Optional[str] = None


class ClearCutReportFormBase(BaseModel):
    inspection_date: Optional[datetime] = None
    weather: None | str = None
    forest_description: None | str = None
    remainingTrees: None | str = None
    species: None | str = None
    workSignVisible: None | str = None
    waterzone_description: None | str = None
    protected_zone_description: None | str = None
    soil_state: None | str = None
    other: None | str = None
    ecological_zone: None | str = None
    ecological_zone_type: None | str = None
    nearby_zone: None | str = None
    nearby_zone_type: None | str = None
    protected_species: None | str = None
    protected_habitats: None | str = None
    ddt_request: None | bool = None
    ddt_request_owner: None | str = None
    compagny: None | str = None
    subcontractor: None | str = None
    landlord: None | str = None
    pefc_fsc_certified: None | bool = None
    over_20_ha: None | bool = None
    psg_required_plot: None | bool = None

    class Config:
        schema_extra = {"example": {"weather": "Boueux"}}


class ClearcutReportStrategy(BaseModel):
    relevant_for_pefc_complaint: None | bool = None
    relevant_for_rediii_complaint: None | bool = None
    relevant_for_ofb_complaint: None | bool = None
    relevant_for_alert_cnpf_ddt_srgs: None | bool = None
    relevant_for_alert_cnpf_ddt_psg_thresholds: None | bool = None
    relevant_for_psg_request: None | bool = None
    request_engaged: None | str = None


class ClearCutReportFormResponse(ClearCutReportFormBase):
    id: int
    report_updated_at: datetime


class ClearCutReportFormWithStrategy(ClearcutReportStrategy, ClearCutReportFormBase):
    _ = None


class ClearCutReportFormWithStrategyResponse(
    ClearcutReportStrategy, ClearCutReportFormResponse
):
    _ = None


class ClearCutReporCreate(ClearCutReportFormBase):
    editor_id: Optional[int] = None
