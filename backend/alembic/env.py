from logging.config import fileConfig

from geoalchemy2 import Geography, Geometry, Raster, alembic_helpers
from sqlalchemy import engine_from_config, pool

from alembic import context
from app.config import settings
from app.models import Base

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# for 'autogenerate' support
target_metadata = Base.metadata

configuration = config.get_section(config.config_ini_section)
configuration["sqlalchemy.url"] = settings.DATABASE_URL
IGNORE_TABLES = ["spatial_ref_sys"]


def render_item(obj_type, obj, autogen_context):
    """Apply custom rendering for selected items."""
    if obj_type == "type" and isinstance(obj, Geometry | Geography | Raster):
        import_name = obj.__class__.__name__
        autogen_context.imports.add(f"from geoalchemy2 import {import_name}")
        return f"{obj!r}"

    # default rendering for other objects
    return False


def include_object(object, name, type_, reflected, compare_to):
    """Do not include spatial indexes if they are automatically created by GeoAlchemy2."""
    if type_ == "index":
        if len(object.expressions) == 1:
            try:
                col = object.expressions[0]
                if (
                    alembic_helpers._check_spatial_type(
                        col.type, (Geometry, Geography, Raster)
                    )
                    and col.type.spatial_index
                ):
                    return False
            except AttributeError:
                pass

    if type_ == "table" and (
        name in IGNORE_TABLES or object.info.get("skip_autogenerate", False)
    ):
        return False

    elif type_ == "column" and object.info.get("skip_autogenerate", False):
        return False

    return True


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = configuration.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
