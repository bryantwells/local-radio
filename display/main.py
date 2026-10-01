from app.display import init
from app.sockets import start

start("http://radio-middleware:3000")
init()
