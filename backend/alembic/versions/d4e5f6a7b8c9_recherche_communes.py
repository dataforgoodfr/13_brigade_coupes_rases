"""Search the cities without accents and with light typos

city_search_key gives the form of a name the search compares: without
accents, in lower case, hyphens and apostrophes as spaces, "st" and "ste"
spelled out. A trigram index on it serves both the substring and the
similarity searches. The extensions are left in place on downgrade: other
objects may use them.

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-10-22 16:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d4e5f6a7b8c9"
down_revision: str | None = "c3d4e5f6a7b8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS unaccent")
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    # unaccent is only STABLE: an index needs an IMMUTABLE function, which
    # holds as long as the dictionary is named explicitly
    op.execute(
        r"""
        CREATE FUNCTION city_search_key(name text) RETURNS text
        LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS $$
            SELECT regexp_replace(
                regexp_replace(
                    lower(translate(
                        public.unaccent('public.unaccent'::regdictionary, name),
                        '-''’', '   '
                    )),
                    '\mste\M', 'sainte', 'g'
                ),
                '\mst\M', 'saint', 'g'
            )
        $$
        """
    )
    op.execute(
        "CREATE INDEX ix_cities_search_key ON cities "
        "USING gin (city_search_key(name) gin_trgm_ops)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_cities_search_key")
    op.execute("DROP FUNCTION IF EXISTS city_search_key(text)")
