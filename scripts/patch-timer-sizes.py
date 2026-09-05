#!/usr/bin/env python3
"""Patch timer components to use larger display sizes for tablet screens.

Adds lg: and xl: breakpoints to:
- Display area containers (h-80 sm:h-96 → h-80 sm:h-96 lg:h-[36rem] xl:h-[44rem])
- Time text sizes (text-6xl sm:text-8xl → text-6xl sm:text-8xl lg:text-9xl xl:text-[12rem])
- Circle timer size (already done for classic, scale up for circle-timer)
"""
import re
from pathlib import Path

TIMERS_DIR = Path("/home/z/my-project/src/components/timers")

def patch_file(filename, replacements):
    path = TIMERS_DIR / filename
    content = path.read_text()
    original = content
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
            print(f"  ✓ {filename}: replaced display size")
        else:
            print(f"  ⚠ {filename}: pattern not found: {old[:60]}...")
    if content != original:
        path.write_text(content)

# Common replacements for display area height
DISPLAY_HEIGHT_OLD = "h-80 sm:h-96"
DISPLAY_HEIGHT_NEW = "h-80 sm:h-96 lg:h-[36rem] xl:h-[44rem]"

# Common replacements for time text
TIME_TEXT_OLD = "text-6xl sm:text-8xl"
TIME_TEXT_NEW = "text-6xl sm:text-8xl lg:text-9xl xl:text-[12rem]"

# For timers that use text-3xl sm:text-4xl for status text
STATUS_TEXT_OLD = "text-3xl sm:text-4xl"
STATUS_TEXT_NEW = "text-3xl sm:text-4xl lg:text-5xl xl:text-6xl"

timers = [
    "rocket-timer.tsx",
    "bomb-timer.tsx",
    "candle-timer.tsx",
    "hourglass-timer.tsx",
    "circle-timer.tsx",
    "snail-race-timer.tsx",
    "traffic-light-timer.tsx",
    "bar-timer.tsx",
]

for t in timers:
    print(f"\n--- {t} ---")
    patch_file(t, [
        (DISPLAY_HEIGHT_OLD, DISPLAY_HEIGHT_NEW),
        (TIME_TEXT_OLD, TIME_TEXT_NEW),
        (STATUS_TEXT_OLD, STATUS_TEXT_NEW),
    ])

# Special: circle-timer has a radial SVG that needs scaling
print("\n--- circle-timer.tsx (special) ---")
patch_file("circle-timer.tsx", [
    # Scale up the circle container
    ("w-72 h-72 sm:w-96 sm:h-96", "w-80 h-80 sm:w-96 sm:h-96 lg:w-[32rem] lg:h-[32rem] xl:w-[40rem] xl:h-[40rem]"),
])

print("\nDone.")
