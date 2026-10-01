import logging

from app.sockets import start

logging.basicConfig(level=logging.DEBUG)

start("http://radio-middleware:3000")
