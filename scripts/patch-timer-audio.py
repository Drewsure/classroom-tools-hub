#!/usr/bin/env python3
"""Patch the remaining 5 timer components to use useTimerAudio.

Applies the same transformation pattern as classic/rocket/bomb/candle:
1. Replace useEffect import with useState only
2. Replace useDramaticSound import with useTimerAudio
3. Remove `const sound = useDramaticSound()`
4. Remove the `onComplete` option from useTimer
5. Add useTimerAudio hook call with the appropriate timer type
6. Remove the per-tick useEffect
7. Remove sound.playClick() calls in handlers
"""
import re
from pathlib import Path

TIMERS_DIR = Path("/home/z/my-project/src/components/timers")

# Map filename → timer type for the alarm dispatcher
TIMER_TYPES = {
    "hourglass-timer.tsx": "hourglass",
    "circle-timer.tsx": "circle",
    "snail-race-timer.tsx": "snail-race",
    "traffic-light-timer.tsx": "traffic-light",
    "bar-timer.tsx": "bar",
}

def patch_timer(filename: str, timer_type: str) -> None:
    path = TIMERS_DIR / filename
    content = path.read_text()
    original = content

    # 1. Replace `import { useEffect, useState }` with `import { useState }`
    content = content.replace("import { useEffect, useState } from \"react\";", "import { useState } from \"react\";")

    # 2. Replace useDramaticSound import with useTimerAudio import
    content = content.replace(
        "import {\n  useDramaticSound,\n  useConfetti,\n  useFlash,\n  useScreenShake,\n} from \"@/hooks/use-effects\";",
        "import { useTimerAudio } from \"@/hooks/use-timer-audio\";\nimport {\n  useConfetti,\n  useFlash,\n  useScreenShake,\n} from \"@/hooks/use-effects\";",
    )

    # 3. Remove `const sound = useDramaticSound();` line
    content = re.sub(r"  const sound = useDramaticSound\(\);\n", "", content)

    # 4 & 5. Replace useTimer with onComplete + add useTimerAudio
    # Pattern: useTimer(totalInput, { onComplete: ... })
    # We need to extract the onComplete body and rewrap it

    # Handle simple inline onComplete: () => { ... }
    pattern = re.compile(
        r'const timer = useTimer\(totalInput, \{\s*onComplete: \(\) => \{([^}]+(?:\{[^}]*\}[^}]*)*)\},?\s*\}\);',
        re.DOTALL
    )
    match = pattern.search(content)
    if match:
        body = match.group(1).strip()
        # Remove sound.play* calls from the body
        body = re.sub(r'sound\.play\w+\([^)]*\);\n?', '', body)
        body = re.sub(r'\n\n+', '\n', body)

        replacement = f'''const timer = useTimer(totalInput);

  // Centralized audio: ticks, 20-sec build-up, spoken 10→1, {timer_type} themed alarm
  useTimerAudio(
    "{timer_type}",
    timer.remaining,
    timer.isRunning,
    timer.isCompleted,
    () => {{
{body}
    }},
  );'''
        content = pattern.sub(replacement, content)

    # 6. Remove the per-tick useEffect block
    # Pattern: useEffect(() => { ... sound.play... }, [timer.remaining, ...]);
    useEffect_pattern = re.compile(
        r'\n  useEffect\(\(\) => \{[^}]+(?:\{[^}]*\}[^}]*)*\}, \[timer\.remaining[^]]*\]\);\n',
        re.DOTALL
    )
    content = useEffect_pattern.sub('\n', content)

    # 7. Remove sound.playClick() calls in handlers
    content = re.sub(r'    sound\.playClick\(\);\n', '', content)
    # Also remove sound.playWhoosh() and other sound calls in handlers (but NOT inside the useTimerAudio body which we already handled)
    content = re.sub(r'    sound\.play\w+\([^)]*\);\n', '', content)
    content = re.sub(r'    sound\.playWhoosh\(\);\n', '', content)

    if content != original:
        path.write_text(content)
        print(f"  ✓ Patched {filename}")
    else:
        print(f"  ⚠ No changes to {filename} (may need manual review)")


def main():
    print("Patching remaining timer components...")
    for filename, timer_type in TIMER_TYPES.items():
        patch_timer(filename, timer_type)
    print("Done.")


if __name__ == "__main__":
    main()
