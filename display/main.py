import logging
import os

from app.sockets import start

logging.basicConfig(level=logging.DEBUG)

start(f"https://{os.environ['RADIO_MIDDLEWARE_HOST']}")
