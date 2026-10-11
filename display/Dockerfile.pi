FROM ghcr.io/astral-sh/uv:python3.13-trixie-slim

RUN apt-get update && \
	apt-get install -y --no-install-recommends gcc libc6-dev swig make unzip curl ca-certificates && \
	curl -L -o /tmp/lg.zip https://github.com/joan2937/lg/archive/master.zip && \
	cd /tmp && unzip lg.zip && cd lg-master && \
	make && make install && ldconfig && \
	cd / && rm -rf /tmp/lg* && \
	rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN uv sync --no-dev --locked

COPY . .

ENV PYTHONUNBUFFERED=1
ENV GPIOZERO_PIN_FACTORY=lgpio

CMD ["uv", "run", "main.py"]
