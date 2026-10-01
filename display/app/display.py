from __future__ import annotations

import logging
import os
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


def draw(source: Source) -> None:

    try:
        epd = epd2in7_V2.EPD()
        epd.Init_4Gray()

        font = ImageFont.truetype(os.path.join(font_dir, "Arial.ttf"), 24)
        image = Image.new("L", (epd.width, epd.height), epd.GRAY1)
        draw = ImageDraw.Draw(image)
        draw.text((20, 40), source["metadata"]["title"], font=font, fill=epd.GRAY4)

        epd.display_4Gray(epd.getbuffer_4Gray(image))
        epd.sleep()

    except OSError:
        logger.exception("Failed to draw to display")


def clear() -> None:

    try:
        epd = epd2in7_V2.EPD()
        epd.Init_4Gray()
        epd.Clear()

        font = ImageFont.truetype(os.path.join(font_dir, "Arial.ttf"), 24)
        image = Image.new("L", (epd.width, epd.height), epd.GRAY1)
        draw = ImageDraw.Draw(image)
        draw.text((20, 20), "hello world", font=font, fill=epd.GRAY4)

        epd.display_4Gray(epd.getbuffer_4Gray(image))
        epd.sleep()

    except OSError:
        logger.exception("Failed to clear display")
