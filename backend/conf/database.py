from functools import partial

from tortoise.config import AppConfig, ConnectionConfig, TortoiseConfig
from tortoise.contrib.fastapi import RegisterTortoise

from conf.settings import DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER

TORTOISE_ORM = TortoiseConfig(
    connections={
        "default": ConnectionConfig(
            engine="tortoise.backends.asyncpg",
            credentials={
                "host": DB_HOST,
                "port": DB_PORT,
                "user": DB_USER,
                "password": DB_PASSWORD,
                "database": DB_NAME,
            },
        ),
    },
    apps={
        "models": AppConfig(
            models=["models"],
            default_connection="default",
            migrations="migrations",
        )
    },
)

register_orm = partial(
    RegisterTortoise,
    config=TORTOISE_ORM,
    add_exception_handlers=True,
)
