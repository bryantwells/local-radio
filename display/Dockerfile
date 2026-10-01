FROM ghcr.io/astral-sh/uv:python3.13-trixie-slim

RUN apt-get update && \
	apt-get install -y --no-install-recommends gcc libc6-dev swig && \
	rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN uv sync --no-dev --locked

COPY . .

ENV PYTHONUNBUFFERED=1
ENV GPIOZERO_PIN_FACTORY=lgpio

CMD ["uv", "run", "main.py"]
