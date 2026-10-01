from __future__ import annotations

import logging
import os
import socket
from typing import TYPE_CHECKING

from lib.waveshare_epd import epd2in7_V2
from PIL import Image, ImageDraw, ImageFont

if TYPE_CHECKING:
    from sockets import Source

logger = logging.getLogger(__name__)
font_dir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.realpath(__file__))),
    "fonts",
)


def get_ip_address() -> str:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as connection:
            connection.connect(("1.1.1.1", 80))
            return connection.getsockname()[0]
    except OSError:
        return "no network"


def draw(source: Source) -> None:

    try:
        epd = epd2in7_V2.EPD()
        epd.Init_4Gray()

        font = ImageFont.truetype(os.path.join(font_dir, "Arial.ttf"), 12)
        image = Image.new("L", (epd.height, epd.width), 0)
        draw = ImageDraw.Draw(image)
        draw.text((10, 10), source["metadata"]["title"], font=font, fill=epd.GRAY2)

        draw.text((10, epd.width - 22), get_ip_address(), font=font, fill=epd.GRAY2)

        image = image.rotate(90, expand=True)
        epd.display_4Gray(epd.getbuffer_4Gray(image))
        epd.sleep()

    except OSError:
        logger.exception("Failed to draw to display")


def clear() -> None:

    try:
        epd = epd2in7_V2.EPD()
        epd.Init_4Gray()
        epd.Clear()

        font = ImageFont.truetype(os.path.join(font_dir, "Arial.ttf"), 12)
        image = Image.new("L", (epd.height, epd.width), 0)
        draw = ImageDraw.Draw(image)
        draw.text((10, 10), "hello world", font=font, fill=epd.GRAY2)

        draw.text((10, epd.width - 22), get_ip_address(), font=font, fill=epd.GRAY2)

        image = image.rotate(90, expand=True)
        epd.display_4Gray(epd.getbuffer_4Gray(image))
        epd.sleep()

    except OSError:
        logger.exception("Failed to clear display")
