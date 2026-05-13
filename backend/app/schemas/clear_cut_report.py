from logging import getLogger

from pydantic import EmailStr, Field, field_validator

from app.models import CLEARCUT_STATUSES, ClearCutReport, User
from app.schemas.base import BaseSchema
from app.schemas.clear_cut import ClearCutCreateSchema
from app.schemas.clear_cut_map import (
    ClearCutReportPreviewSchema,
    report_to_report_preview_schema,
)

logger = getLogger(__name__)


class PublicUserResponseSchema(BaseSchema):
    id: str
    login: str = Field(default_factory=str, json_schema_extra={"example": "JognTree78"})
    email: EmailStr = Field(
        default_factory=EmailStr, json_schema_extra={"example": "john.tree@canope.com"}
    )


class CreateClearCutsReportCreateRequestSchema(BaseSchema):
    slope_area_hectare: float | None = Field(json_schema_extra={"example": "10.0"})
    clear_cuts: list[ClearCutCreateSchema]
    city_zip_code: str = Field(
        json_schema_extra={"example": "1"},
    )


class ClearCutReportPutRequestSchema(BaseSchema):
    status: str | None = None
    user_id: int | None = None

    @field_validator("status")
    def validate_status(cls, value):
        if value is not None and value not in CLEARCUT_STATUSES:
            raise ValueError(f"Status must be one of: {', '.join(CLEARCUT_STATUSES)}")
        return value


class ClearCutReportResponseSchema(ClearCutReportPreviewSchema):
    statellite_images: list[str] | None = Field(
        json_schema_extra={"example": '["image1.jpg", "image2.jpg"]'},
    )
    affected_user: PublicUserResponseSchema | None = None
    assignment_requested_by_id: str | None = None
    assignment_requested_by: PublicUserResponseSchema | None = None


def report_to_response_schema(
    report: ClearCutReport, current_user: "User | None" = None
) -> ClearCutReportResponseSchema:
    """Build a full ClearCutReportResponseSchema from a ORM report instance.

    Delegates common fields to report_to_report_preview_schema, then adds the
    user-visibility-gated fields (affected_user, assignment_requested_by_id,
    statellite_images).
    """
    show_user_info = False
    if current_user is not None:
        if current_user.role == "admin" or current_user.id == report.user_id:
            show_user_info = True

    # Build the base preview dict and reuse it to avoid duplication
    preview = report_to_report_preview_schema(report)

    return ClearCutReportResponseSchema(
        **preview.model_dump(),
        statellite_images=report.statellite_images,
        affected_user=(
            None
            if report.user_id is None or not show_user_info
            else PublicUserResponseSchema(
                id=str(report.user.id),
                email=report.user.email,
                login=report.user.login,
            )
        ),
        assignment_requested_by=(
            None
            if report.assignment_requested_by_id is None or not show_user_info
            else PublicUserResponseSchema(
                id=str(report.assignment_requested_by.id),
                email=report.assignment_requested_by.email,
                login=report.assignment_requested_by.login,
            )
        ),
    )
