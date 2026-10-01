from typing import TypedDict

import socketio

from app.display import clear, draw


class SourceMetadata(TypedDict):
    title: str
    description: str


class Source(TypedDict):
    userId: str
    mountId: str
    metadata: SourceMetadata


sio = socketio.Client()


@sio.event
def connect():
    print("python socket io connection established")


@sio.event
def sourceList(sources: list[Source]):
    if len(sources) > 0:
        draw(sources[0])
    else:
        clear()


@sio.event
def disconnect():
    print("python socket io disconnected")


def start(url: str) -> None:
    sio.connect(url)
    sio.wait()
