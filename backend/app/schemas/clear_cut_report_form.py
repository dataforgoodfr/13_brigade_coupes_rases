from datetime import datetime
from logging import getLogger
from typing import Optional

from pydantic import BaseModel

logger = getLogger(__name__)


class ClearCutPicture(BaseModel):
    id: int
    link: str
    tag: Optional[str] = None


class ClearCutReportFormBase(BaseModel):
    inspection_date: Optional[datetime] = None
    weather: None | str = None
    forest_description: None | str = None
    remainingTrees: None | bool = None
    species: None | str = None
    workSignVisible: None | bool = None
    waterzone_description: None | str = None
    protected_zone_description: None | str = None
    soil_state: None | str = None
    other: None | str = None
    ecological_zone: None | bool = None
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
        json_schema_extra = {
            "example": {
                "inspection_date": datetime(2025, 4, 23, 14, 00),
                "weather": "Rainy",
                "forest_description": "Wild forest",
                "remainingTrees": True,
                "species": "Chênes",
                "workSignVisible": False,
                "waterzone_description": "small lake",
                "protected_zone_description": "RAS",
                "soil_state": "Muddy",
                "other": "",
                "ecological_zone": False,
                "ecological_zone_type": "",
                "nearby_zone": "",
                "nearby_zone_type": "",
                "protected_species": "",
                "protected_habitats": "",
                "ddt_request": None,
                "ddt_request_owner": "",
                "compagny": "",
                "subcontractor": "",
                "landlord": "",
                "pefc_fsc_certified": False,
                "over_20_ha": False,
                "psg_required_plot": True,
            }
        }


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

    class Config:
        json_schema_extra = {
            "example": {
                "inspection_date": datetime(2025, 4, 23, 14, 00),
                "weather": "Rainy",
                "forest_description": "Wild forest",
                "remainingTrees": True,
                "species": "Chênes",
                "workSignVisible": False,
                "waterzone_description": "small lake",
                "protected_zone_description": "RAS",
                "soil_state": "Muddy",
                "other": "",
                "ecological_zone": False,
                "ecological_zone_type": "",
                "nearby_zone": "",
                "nearby_zone_type": "",
                "protected_species": "",
                "protected_habitats": "",
                "ddt_request": None,
                "ddt_request_owner": "",
                "compagny": "",
                "subcontractor": "",
                "landlord": "",
                "pefc_fsc_certified": False,
                "over_20_ha": False,
                "psg_required_plot": True,
                "relevant_for_pefc_complaint": None,
                "relevant_for_rediii_complaint": False,
                "relevant_for_ofb_complaint": False,
                "relevant_for_alert_cnpf_ddt_srgs": False,
                "relevant_for_alert_cnpf_ddt_psg_thresholds": False,
                "relevant_for_psg_request": False,
                "request_engaged": "Request",
            }
        }


class ClearCutReportFormWithStrategyResponse(
    ClearcutReportStrategy, ClearCutReportFormResponse
):
    _ = None

    class Config:
        json_schema_extra = {
            "example": {
                "inspection_date": datetime(2025, 4, 23, 14, 00),
                "weather": "Rainy",
                "forest_description": "Wild forest",
                "remainingTrees": True,
                "species": "Chênes",
                "workSignVisible": False,
                "waterzone_description": "small lake",
                "protected_zone_description": "RAS",
                "soil_state": "Muddy",
                "other": "",
                "ecological_zone": False,
                "ecological_zone_type": "",
                "nearby_zone": "",
                "nearby_zone_type": "",
                "protected_species": "",
                "protected_habitats": "",
                "ddt_request": None,
                "ddt_request_owner": "",
                "compagny": "",
                "subcontractor": "",
                "landlord": "",
                "pefc_fsc_certified": False,
                "over_20_ha": False,
                "psg_required_plot": True,
                "relevant_for_pefc_complaint": None,
                "relevant_for_rediii_complaint": False,
                "relevant_for_ofb_complaint": False,
                "relevant_for_alert_cnpf_ddt_srgs": False,
                "relevant_for_alert_cnpf_ddt_psg_thresholds": False,
                "relevant_for_psg_request": False,
                "request_engaged": "Request",
            }
        }


class ClearCutReporCreate(ClearCutReportFormBase):
    editor_id: Optional[int] = None
