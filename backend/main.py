from contextlib import asynccontextmanager

from conf.app_vars import FRONTEND_URL
from conf.database import register_orm
from conf.excpetion_handlers import exception_handlers
from conf.middlewares import AuthenticationMiddleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware import Middleware
from utils.log import Log


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with register_orm(app):
        Log.info("Database Connected")
        yield
        Log.info("Closing Database Connection")


middlewares = [
    Middleware(
        CORSMiddleware,
        allow_origins=[FRONTEND_URL],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    ),
    Middleware(AuthenticationMiddleware),
]


app = FastAPI(
    title="Ninety EOS (Altri) API",
    lifespan=lifespan,
    exception_handlers=exception_handlers,
    middleware=middlewares,
)
