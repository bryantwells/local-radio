FROM ghcr.io/astral-sh/uv:python3.13-trixie-slim

WORKDIR /app

COPY pyproject.toml uv.lock ./

# Skip the Pi-only hardware packages (SPI/GPIO); dev renders to out/preview.png instead
RUN uv sync --no-dev --locked \
	--no-install-package spidev \
	--no-install-package gpiozero \
	--no-install-package lgpio

COPY . .

ENV PYTHONUNBUFFERED=1

CMD ["uv", "run", "--no-sync", "main.py"]
