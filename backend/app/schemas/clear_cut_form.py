from datetime import datetime
from logging import getLogger

from pydantic import BaseModel, ConfigDict

logger = getLogger(__name__)


class ClearCutPicture(BaseModel):
    id: int
    link: str
    tag: str | None = None


class ClearCutFormBase(BaseModel):
    inspection_date: datetime | None = None
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

    # Image fields (S3 keys)
    images_clear_cut: list[str] | None = None
    images_plantation: list[str] | None = None
    image_worksite_sign: list[str] | None = None
    images_tree_trunks: list[str] | None = None
    images_soil_state: list[str] | None = None
    images_access_road: list[str] | None = None

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
                "images_clear_cut": ["development/reports/123/uuid_image1.jpg"],
                "images_plantation": ["development/reports/123/uuid_image2.jpg"],
                "image_worksite_sign": ["development/reports/123/uuid_image3.jpg"],
                "images_tree_trunks": ["development/reports/123/uuid_image4.jpg"],
                "images_soil_state": ["development/reports/123/uuid_image5.jpg"],
                "images_access_road": ["development/reports/123/uuid_image6.jpg"],
            }
        }


class ClearcutFormStrategy(BaseModel):
    relevant_for_pefc_complaint: None | bool = None
    relevant_for_rediii_complaint: None | bool = None
    relevant_for_ofb_complaint: None | bool = None
    relevant_for_alert_cnpf_ddt_srgs: None | bool = None
    relevant_for_alert_cnpf_ddt_psg_thresholds: None | bool = None
    relevant_for_psg_request: None | bool = None
    request_engaged: None | str = None


class ClearCutFormResponse(ClearCutFormBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClearCutReportFormWithStrategy(ClearcutFormStrategy, ClearCutFormBase):
    model_config = ConfigDict(
        json_schema_extra={
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
                "other": "Other",
                "ecological_zone": False,
                "ecological_zone_type": "Ecological Zone Type",
                "nearby_zone": "Nearby Zone",
                "nearby_zone_type": "Nearby Zone Type",
                "protected_species": "Protected Species",
                "protected_habitats": "Protected Habitats",
                "ddt_request": None,
                "ddt_request_owner": "Request owner",
                "compagny": "Company",
                "subcontractor": "Sub contractor",
                "landlord": "Land lord",
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
                "images_clear_cut": ["development/reports/123/uuid_image1.jpg"],
                "images_plantation": ["development/reports/123/uuid_image2.jpg"],
                "image_worksite_sign": ["development/reports/123/uuid_image3.jpg"],
                "images_tree_trunks": ["development/reports/123/uuid_image4.jpg"],
                "images_soil_state": ["development/reports/123/uuid_image5.jpg"],
                "images_access_road": ["development/reports/123/uuid_image6.jpg"],
            }
        }
    )


class ClearCutFormWithStrategyResponse(ClearcutFormStrategy, ClearCutFormResponse):
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
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
                "images_clear_cut": ["development/reports/123/uuid_image1.jpg"],
                "images_plantation": ["development/reports/123/uuid_image2.jpg"],
                "image_worksite_sign": ["development/reports/123/uuid_image3.jpg"],
                "images_tree_trunks": ["development/reports/123/uuid_image4.jpg"],
                "images_soil_state": ["development/reports/123/uuid_image5.jpg"],
                "images_access_road": ["development/reports/123/uuid_image6.jpg"],
            }
        },
    )


class ClearCutFormCreate(ClearCutFormBase):
    editor_id: int | None = None
