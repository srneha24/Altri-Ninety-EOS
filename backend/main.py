from contextlib import asynccontextmanager

import email_validator
from apps.auth.routers import router as auth_router
from apps.company.routers import router as company_router
from apps.traction.routers import router as traction_router
from conf.database import register_orm
from conf.excpetion_handlers import exception_handlers
from conf.middlewares import AuthenticationMiddleware
from conf.responses import CustomJSONResponse
from conf.settings import FRONTEND_URL
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware import Middleware
from utils.clock import get_app_now
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

app.include_router(auth_router)
app.include_router(company_router)
app.include_router(traction_router)


email_validator.TEST_ENVIRONMENT = True  # To allow the use of the seed user emails


@app.get("/server-now")
async def server_now(_request: Request):
    return CustomJSONResponse(content={"server_now": get_app_now().isoformat()})
