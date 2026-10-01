FROM ghcr.io/astral-sh/uv:python3.13-alpine

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN uv sync --no-dev --frozen

COPY . .

ENV PYTHONUNBUFFERED=1

CMD ["uv", "run", "main.py"]
