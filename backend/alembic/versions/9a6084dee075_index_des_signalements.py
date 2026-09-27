"""Index the columns used to filter, sort and join clear cut reports

Map and list filters (status, city through the department, assignee, pending
request), the default sort (updated_at), the latest form of a report and the
rules triggered by a report no longer scan the whole table.

Revision ID: 9a6084dee075
Revises: a1b2c3d4e5f6
Create Date: 2026-09-27 12:07:31.468529

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "9a6084dee075"
down_revision: str | None = "a1b2c3d4e5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

REPORT_COLUMNS = (
    "status",
    "city_id",
    "user_id",
    "assignment_requested_by_id",
    "updated_at",
)


def upgrade() -> None:
    for column in REPORT_COLUMNS:
        op.create_index(
            op.f(f"ix_clear_cuts_reports_{column}"), "clear_cuts_reports", [column]
        )
    op.create_index(
        "ix_clear_cut_report_forms_report_id_created_at",
        "clear_cut_report_forms",
        ["report_id", "created_at"],
    )
    op.create_index(
        op.f("ix_rules_clear_cuts_reports_report_id"),
        "rules_clear_cuts_reports",
        ["report_id"],
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_rules_clear_cuts_reports_report_id"),
        table_name="rules_clear_cuts_reports",
    )
    op.drop_index(
        "ix_clear_cut_report_forms_report_id_created_at",
        table_name="clear_cut_report_forms",
    )
    for column in REPORT_COLUMNS:
        op.drop_index(
            op.f(f"ix_clear_cuts_reports_{column}"), table_name="clear_cuts_reports"
        )
