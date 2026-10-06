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
    except Exception:
        return "no network"


def draw(source: Source) -> None:

    try:
        epd = epd2in7_V2.EPD()
        epd.init()

        font = ImageFont.load_default(size=15)
        image = Image.new("1", (epd.height, epd.width), 255)
        draw = ImageDraw.Draw(image)

        draw.text((5, 5), "*On Air*", font=font, fill=0)
        draw.text((5, 20), source["metadata"]["title"], font=font, fill=0)

        draw.text((5, 50), "vocable-gestures.xyz", font=font, fill=0)
        draw.text((5, 65), get_ip_address(), font=font, fill=0)

        image = image.rotate(-90, expand=True)
        epd.display(epd.getbuffer(image))
        epd.sleep()

    except Exception:
        logger.exception("Failed to draw to display")


def clear() -> None:

    try:
        epd = epd2in7_V2.EPD()
        epd.init()
        epd.Clear()

        font = ImageFont.load_default(size=15)
        image = Image.new("1", (epd.height, epd.width), 255)
        draw = ImageDraw.Draw(image)

        draw.text((5, 5), "vocable-gestures.xyz", font=font, fill=0)
        draw.text((5, 20), get_ip_address(), font=font, fill=0)

        image = image.rotate(-90, expand=True)
        epd.display(epd.getbuffer(image))
        epd.sleep()

    except Exception:
        logger.exception("Failed to clear display")
