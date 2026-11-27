FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1

WORKDIR /app/backend

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY backend/ ./
COPY seed.json /app/seed.json

EXPOSE 8000

CMD ["sh", "-c", "uv run --no-sync tortoise migrate && uv run --no-sync python seed.py && uv run --no-sync fastapi run main.py --host 0.0.0.0 --port 8000"]