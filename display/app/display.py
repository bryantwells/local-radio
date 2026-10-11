from __future__ import annotations

import logging
import os
import socket
from typing import TYPE_CHECKING
import textwrap

from PIL import Image, ImageDraw, ImageFont

if TYPE_CHECKING:
    from sockets import Source

logger = logging.getLogger(__name__)
TEST_MODE = os.environ.get("DISPLAY_MODE", "").lower() == "test"
PREVIEW_SIZE = (176, 264)

PREVIEW_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.realpath(__file__))),
    "out",
    "preview.png",
)

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


def save_preview(image: Image.Image) -> None:
    os.makedirs(os.path.dirname(PREVIEW_PATH), exist_ok=True)
    image.save(PREVIEW_PATH)
    logger.info("Saved display preview to %s", PREVIEW_PATH)


def draw(source: Source) -> None:

    try:
        epd = None
        if not TEST_MODE:
            from lib.waveshare_epd import epd2in7_V2

            epd = epd2in7_V2.EPD()
            epd.init()

        font = ImageFont.load_default(size=15)
        image = Image.new("1", PREVIEW_SIZE if epd is None else (epd.width, epd.height), 255)
        draw = ImageDraw.Draw(image)
        title_wrapped = "\n".join(textwrap.wrap(source["metadata"]["title"], width=image.width/7))

        draw.text((image.width/2, 5), "*On Air*", font=font, fill=0, anchor="ma")
        draw.multiline_text((5, 20), title_wrapped, font=font, fill=0, anchor="la", spacing=0)

        draw.text((5, image.height-20), "vocable-gestures.xyz", font=font, fill=0, anchor="ld")
        draw.text((5, image.height-5), get_ip_address(), font=font, fill=0, anchor="ld")

        if epd is None:
            save_preview(image)
            return

        image = image.rotate(-180, expand=True)
        epd.display(epd.getbuffer(image))
        epd.sleep()

    except Exception:
        logger.exception("Failed to draw to display")


def clear() -> None:

    try:
        epd = None
        if not TEST_MODE:
            from lib.waveshare_epd import epd2in7_V2

            epd = epd2in7_V2.EPD()
            epd.init()
            epd.Clear()

        font = ImageFont.load_default(size=15)
        image = Image.new("1", PREVIEW_SIZE if epd is None else (epd.width, epd.height), 255)
        draw = ImageDraw.Draw(image)

        draw.text((5, image.height-20), "vocable-gestures.xyz", font=font, fill=0, anchor="ld")
        draw.text((5, image.height-5), get_ip_address(), font=font, fill=0, anchor="ld")

        if epd is None:
            save_preview(image)
            return

        image = image.rotate(-180, expand=True)
        epd.display(epd.getbuffer(image))
        epd.sleep()

    except Exception:
        logger.exception("Failed to clear display")
