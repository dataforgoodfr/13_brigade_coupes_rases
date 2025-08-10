from datetime import datetime
from logging import getLogger

from app.models import ClearCutForm, User
from app.schemas.base import BaseSchema

logger = getLogger(__name__)


class GroundSection(BaseSchema):
    inspection_date: datetime | None = None
    weather: None | str = None
    forest: None | str = None
    has_remaining_trees: None | bool = None
    trees_species: None | str = None
    planting_images: list[str] | None = None
    has_construction_panel: None | bool = None
    construction_panel_images: list[str] | None = None
    wetland: None | str = None
    destruction_clues: None | str = None
    soil_state: None | str = None
    clear_cut_images: list[str] | None = None
    tree_trunks_images: list[str] | None = None
    soil_state_images: list[str] | None = None
    access_road_images: list[str] | None = None


class EcologicalZoningSection(BaseSchema):
    has_other_ecological_zone: None | bool = None
    other_ecological_zone_type: None | str = None
    has_nearby_ecological_zone: None | bool = None
    nearby_ecological_zone_type: None | str = None
    protected_species: None | str = None
    protected_habitats: None | str = None
    has_ddt_request: None | bool = None
    ddt_request_owner: None | str = None


class EngagedActorSection(BaseSchema):
    company: None | str = None
    subcontractor: None | str = None
    landlord: None | str = None


class RegulationSection(BaseSchema):
    is_pefc_fsc_certified: None | bool = None
    is_over_20_ha: None | bool = None
    is_psg_required_plot: None | bool = None


class OtherSection(BaseSchema):
    other: None | str = None


class StrategySection(BaseSchema):
    relevant_for_pefc_complaint: None | bool = None
    relevant_for_rediii_complaint: None | bool = None
    relevant_for_ofb_complaint: None | bool = None
    relevant_for_alert_cnpf_ddt_srgs: None | bool = None
    relevant_for_alert_cnpf_ddt_psg_thresholds: None | bool = None
    relevant_for_psg_request: None | bool = None
    request_engaged: None | str = None


class ClearCutFormResponse(
    GroundSection,
    EcologicalZoningSection,
    EngagedActorSection,
    RegulationSection,
    OtherSection,
    StrategySection,
):
    id: str
    created_at: datetime
    report_id: str


class ClearCutFormCreate(
    GroundSection,
    EcologicalZoningSection,
    EngagedActorSection,
    RegulationSection,
    OtherSection,
    StrategySection,
):
    pass


def clear_cut_form_create_to_clear_cut_form(
    clear_cut_form_create: ClearCutFormCreate, editor: User, report_id: int
) -> ClearCutForm:
    return ClearCutForm(
        report_id=int(report_id),
        editor_id=int(editor.id),
        inspection_date=clear_cut_form_create.inspection_date,
        weather=clear_cut_form_create.weather,
        forest=clear_cut_form_create.forest,
        has_remaining_trees=clear_cut_form_create.has_remaining_trees,
        trees_species=clear_cut_form_create.trees_species,
        planting_images=clear_cut_form_create.planting_images,
        has_construction_panel=clear_cut_form_create.has_construction_panel,
        construction_panel_images=clear_cut_form_create.construction_panel_images,
        wetland=clear_cut_form_create.wetland,
        destruction_clues=clear_cut_form_create.destruction_clues,
        soil_state=clear_cut_form_create.soil_state,
        clear_cut_images=clear_cut_form_create.clear_cut_images,
        tree_trunks_images=clear_cut_form_create.tree_trunks_images,
        soil_state_images=clear_cut_form_create.soil_state_images,
        access_road_images=clear_cut_form_create.access_road_images,
        has_other_ecological_zone=clear_cut_form_create.has_other_ecological_zone,
        other_ecological_zone_type=clear_cut_form_create.other_ecological_zone_type,
        has_nearby_ecological_zone=clear_cut_form_create.has_nearby_ecological_zone,
        nearby_ecological_zone_type=clear_cut_form_create.nearby_ecological_zone_type,
        protected_species=clear_cut_form_create.protected_species,
        protected_habitats=clear_cut_form_create.protected_habitats,
        has_ddt_request=clear_cut_form_create.has_ddt_request,
        ddt_request_owner=clear_cut_form_create.ddt_request_owner,
        company=clear_cut_form_create.company,
        subcontractor=clear_cut_form_create.subcontractor,
        landlord=clear_cut_form_create.landlord,
        is_pefc_fsc_certified=clear_cut_form_create.is_pefc_fsc_certified,
        is_over_20_ha=clear_cut_form_create.is_over_20_ha,
        is_psg_required_plot=clear_cut_form_create.is_psg_required_plot,
        relevant_for_pefc_complaint=clear_cut_form_create.relevant_for_pefc_complaint,
        relevant_for_rediii_complaint=clear_cut_form_create.relevant_for_rediii_complaint,
        relevant_for_ofb_complaint=clear_cut_form_create.relevant_for_ofb_complaint,
        relevant_for_alert_cnpf_ddt_srgs=clear_cut_form_create.relevant_for_alert_cnpf_ddt_srgs,
        relevant_for_alert_cnpf_ddt_psg_thresholds=clear_cut_form_create.relevant_for_alert_cnpf_ddt_psg_thresholds,
        relevant_for_psg_request=clear_cut_form_create.relevant_for_psg_request,
        request_engaged=clear_cut_form_create.request_engaged,
        other=clear_cut_form_create.other,
    )


def clear_cut_form_response_from_clear_cut_form(
    clear_cut_form: ClearCutForm,
) -> ClearCutFormResponse:
    return ClearCutFormResponse(
        id=str(clear_cut_form.id),
        created_at=clear_cut_form.created_at,
        report_id=str(clear_cut_form.report_id),
        inspection_date=clear_cut_form.inspection_date,
        weather=clear_cut_form.weather,
        forest=clear_cut_form.forest,
        has_remaining_trees=clear_cut_form.has_remaining_trees,
        trees_species=clear_cut_form.trees_species,
        planting_images=clear_cut_form.planting_images,
        has_construction_panel=clear_cut_form.has_construction_panel,
        construction_panel_images=clear_cut_form.construction_panel_images,
        wetland=clear_cut_form.wetland,
        destruction_clues=clear_cut_form.destruction_clues,
        soil_state=clear_cut_form.soil_state,
        clear_cut_images=clear_cut_form.clear_cut_images,
        tree_trunks_images=clear_cut_form.tree_trunks_images,
        soil_state_images=clear_cut_form.soil_state_images,
        access_road_images=clear_cut_form.access_road_images,
        has_other_ecological_zone=clear_cut_form.has_other_ecological_zone,
        other_ecological_zone_type=clear_cut_form.other_ecological_zone_type,
        has_nearby_ecological_zone=clear_cut_form.has_nearby_ecological_zone,
        nearby_ecological_zone_type=clear_cut_form.nearby_ecological_zone_type,
        protected_species=clear_cut_form.protected_species,
        protected_habitats=clear_cut_form.protected_habitats,
        has_ddt_request=clear_cut_form.has_ddt_request,
        ddt_request_owner=clear_cut_form.ddt_request_owner,
        company=clear_cut_form.company,
        subcontractor=clear_cut_form.subcontractor,
        landlord=clear_cut_form.landlord,
        is_pefc_fsc_certified=clear_cut_form.is_pefc_fsc_certified,
        is_over_20_ha=clear_cut_form.is_over_20_ha,
        is_psg_required_plot=clear_cut_form.is_psg_required_plot,
        relevant_for_pefc_complaint=None,
        relevant_for_rediii_complaint=clear_cut_form.relevant_for_rediii_complaint,
        relevant_for_ofb_complaint=clear_cut_form.relevant_for_ofb_complaint,
        relevant_for_alert_cnpf_ddt_srgs=clear_cut_form.relevant_for_alert_cnpf_ddt_srgs,
        relevant_for_alert_cnpf_ddt_psg_thresholds=clear_cut_form.relevant_for_alert_cnpf_ddt_psg_thresholds,
        relevant_for_psg_request=clear_cut_form.relevant_for_psg_request,
        request_engaged=clear_cut_form.request_engaged,
        other=clear_cut_form.other,
    )
