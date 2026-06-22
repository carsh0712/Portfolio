"""Helpers for storing optimized upload image variants."""

from io import BytesIO
from pathlib import Path
from typing import Optional

try:
    from PIL import Image, ImageOps, UnidentifiedImageError
except ImportError:  # pragma: no cover - production requirements include Pillow
    Image = None
    ImageOps = None

    class UnidentifiedImageError(Exception):
        pass


IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
DETAIL_MAX_SIDE = 2048
THUMBNAIL_MAX_SIDE = 480
WEBP_QUALITY = 82
THUMBNAIL_WEBP_QUALITY = 78


def get_thumbnail_path(file_path: Path) -> Path:
    """Return the derived thumbnail path for an uploaded file path."""
    return file_path.with_name(f"{file_path.stem}.thumb{file_path.suffix}")


def is_processable_image(ext: str) -> bool:
    """Return whether this upload extension should be resized."""
    return ext.lower() in IMAGE_EXTENSIONS and Image is not None


def _render_webp(image, max_side: int, quality: int) -> bytes:
    image = ImageOps.exif_transpose(image)
    image.thumbnail((max_side, max_side))

    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA" if "A" in image.getbands() else "RGB")

    output = BytesIO()
    image.save(output, format="WEBP", quality=quality, method=6)
    return output.getvalue()


def build_image_variants(content: bytes) -> Optional[tuple[bytes, bytes]]:
    """Build detail and thumbnail WebP images from upload content."""
    if Image is None:
        return None

    try:
        with Image.open(BytesIO(content)) as source:
            source.load()
            detail = _render_webp(source.copy(), DETAIL_MAX_SIDE, WEBP_QUALITY)
            thumbnail = _render_webp(source.copy(), THUMBNAIL_MAX_SIDE, THUMBNAIL_WEBP_QUALITY)
            return detail, thumbnail
    except (UnidentifiedImageError, OSError, ValueError):
        return None
