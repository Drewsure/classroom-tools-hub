#!/usr/bin/env python3
"""Generate PWA icons (192, 512, maskable) for Classroom Tools Hub.

Uses Pillow to render a violet/cyan brand background + a stylized graduate cap
(mortarboard) in the center.

Output: public/icons/icon-192.png, icon-512.png, maskable-192.png, maskable-512.png, icon-32.png
"""

from pathlib import Path
from PIL import Image, ImageDraw
import math

OUT_DIR = Path("/home/z/my-project/public/icons")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Brand palette (matches globals.css --brand-* tokens)
BRAND_BG = (5, 3, 15)          # #05030f near-black violet
BRAND_PRIMARY = (124, 58, 237) # #7c3aed deep violet
BRAND_ACCENT = (34, 211, 238)  # #22d3ee cyan
BRAND_TEXT = (248, 250, 252)   # #f8fafc near-white


def draw_radial_bg(img: Image.Image, size: int) -> None:
    """Draw the dark brand background with two radial blooms."""
    px = img.load()
    cx1, cy1 = size * 0.5, 0
    cx2, cy2 = size * 0.8, size * 0.2
    max_r1 = size * 0.8
    max_r2 = size * 0.6

    for y in range(size):
        for x in range(size):
            r, g, b = BRAND_BG

            d1 = math.hypot(x - cx1, y - cy1)
            if d1 < max_r1:
                t = (1 - d1 / max_r1) ** 2 * 0.35
                r = int(r + (BRAND_PRIMARY[0] - r) * t)
                g = int(g + (BRAND_PRIMARY[1] - g) * t)
                b = int(b + (BRAND_PRIMARY[2] - b) * t)

            d2 = math.hypot(x - cx2, y - cy2)
            if d2 < max_r2:
                t = (1 - d2 / max_r2) ** 2 * 0.28
                r = int(r + (BRAND_ACCENT[0] - r) * t)
                g = int(g + (BRAND_ACCENT[1] - g) * t)
                b = int(b + (BRAND_ACCENT[2] - b) * t)

            px[x, y] = (r, g, b, 255)


def draw_graduate_cap(draw: ImageDraw.ImageDraw, size: int, scale: float = 1.0) -> None:
    """Draw a stylized graduate cap (mortarboard) centered in the icon."""
    cx, cy = size / 2, size / 2
    s = size * 0.32 * scale

    # Mortarboard — diamond, cyan
    diamond = [
        (cx, cy - s * 0.9),
        (cx + s * 1.4, cy - s * 0.1),
        (cx, cy + s * 0.7),
        (cx - s * 1.4, cy - s * 0.1),
    ]
    # Soft outer glow
    for i, alpha in enumerate([60, 40, 20]):
        offset = (i + 1) * 2
        glow = [(p[0], p[1] + offset) for p in diamond]
        draw.polygon(glow, fill=(*BRAND_ACCENT, alpha))
    # Main board
    draw.polygon(diamond, fill=BRAND_ACCENT, outline=BRAND_TEXT)
    # Inner highlight
    inner = [
        (cx, cy - s * 0.65),
        (cx + s * 1.0, cy - s * 0.05),
        (cx, cy + s * 0.45),
        (cx - s * 1.0, cy - s * 0.05),
    ]
    draw.polygon(inner, fill=(255, 255, 255, 40))

    # Cap base (trapezoid) — violet
    base_top_w = s * 0.9
    base_bot_w = s * 0.6
    base_h = s * 0.7
    base_top_y = cy + s * 0.4
    base_bot_y = base_top_y + base_h
    base = [
        (cx - base_top_w, base_top_y),
        (cx + base_top_w, base_top_y),
        (cx + base_bot_w, base_bot_y),
        (cx - base_bot_w, base_bot_y),
    ]
    draw.polygon(base, fill=BRAND_PRIMARY, outline=BRAND_TEXT)

    # Button on top
    button_r = s * 0.12
    draw.ellipse(
        [cx - button_r, cy - s * 0.85 - button_r, cx + button_r, cy - s * 0.85 + button_r],
        fill=BRAND_TEXT, outline=BRAND_PRIMARY,
    )

    # Tassel
    tassel_start = (cx, cy - s * 0.85)
    tassel_mid = (cx + s * 1.0, cy - s * 0.2)
    tassel_end = (cx + s * 1.05, cy + s * 0.5)
    draw.line([tassel_start, tassel_mid, tassel_end], fill=BRAND_TEXT, width=max(2, int(size * 0.012)))
    tip_r = s * 0.1
    draw.ellipse(
        [tassel_end[0] - tip_r, tassel_end[1] - tip_r,
         tassel_end[0] + tip_r, tassel_end[1] + tip_r],
        fill=BRAND_ACCENT, outline=BRAND_TEXT,
    )


def make_icon(size: int, maskable: bool = False, out_path: Path | None = None) -> Path:
    img = Image.new("RGBA", (size, size), BRAND_BG)
    draw_radial_bg(img, size)
    draw = ImageDraw.Draw(img, "RGBA")
    # Maskable icons need ~10% padding for the safe zone
    scale = 0.7 if maskable else 1.0
    draw_graduate_cap(draw, size, scale=scale)

    if out_path is None:
        name = f"maskable-{size}.png" if maskable else f"icon-{size}.png"
        out_path = OUT_DIR / name
    img.save(out_path, "PNG", optimize=True)
    return out_path


def main() -> None:
    paths = []
    for s in [192, 512]:
        paths.append(make_icon(s, maskable=False))
    paths.append(make_icon(192, maskable=True))
    paths.append(make_icon(512, maskable=True))
    paths.append(make_icon(32, maskable=False, out_path=OUT_DIR / "icon-32.png"))

    print("Generated PWA icons:")
    for p in paths:
        print(f"  {p} ({p.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
