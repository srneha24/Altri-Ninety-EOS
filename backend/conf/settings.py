import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


# CONFIG
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGO = "HS256"
ACCESS_TTL = timedelta(minutes=60)
REFRESH_TTL = timedelta(days=7)
PUBLIC_PATHS = {"/health", "/docs", "/redoc", "/openapi.json"}
APP_NOW = os.getenv("APP_NOW", "2026-11-11T15:00:00Z")
COMPANY_TIMEZONE = "America/Chicago"


# URLs
FRONTEND_URL = os.getenv("FRONTEND_URL")

# DATABASE
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
