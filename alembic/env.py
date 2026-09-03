from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app import models
from app.config import settings
from app.database import Base


config = context.config


# Alembic internally uses Python ConfigParser.
# ConfigParser treats "%" as interpolation syntax.
#
# SQLAlchemy URL-encodes special characters in passwords,
# for example:
#
# @  ->  %40
#
# Therefore "%" must be escaped as "%%" before putting
# the URL into Alembic's config.
alembic_database_url = (
    settings.sqlalchemy_database_url
    .replace("%", "%%")
)


config.set_main_option(
    "sqlalchemy.url",
    alembic_database_url
)


if config.config_file_name is not None:
    fileConfig(
        config.config_file_name
    )


target_metadata = Base.metadata


def run_migrations_offline():
    context.configure(
        url=settings.sqlalchemy_database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={
            "paramstyle": "named"
        },
        compare_type=True
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(
            config.config_ini_section,
            {}
        ),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool
    )

    with connectable.connect() as connection:

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()

else:
    run_migrations_online()