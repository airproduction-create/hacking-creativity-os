"""
SYNC-TIMELINE — Auto-import rendered Remotion clips into DaVinci Resolve
=========================================================================
Watches the output folder and imports any new .mp4 files into the
configured Resolve bin, then appends them to the active timeline.

Usage:
  python3 scripts/davinci/sync-timeline.py                    # one-shot sync
  python3 scripts/davinci/sync-timeline.py --watch            # continuous watch
  python3 scripts/davinci/sync-timeline.py --file output/x.mp4  # single file
"""

import sys
import os
import time
import argparse
from pathlib import Path

# Ensure project root is on path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from scripts.davinci.resolve_bridge import ResolveBridge  # type: ignore

OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", "./output"))
POLL_INTERVAL = 5  # seconds between watch checks

def sync_output_folder(bridge: ResolveBridge, timeline_name: str = "Pipeline_Auto") -> int:
    """Import all .mp4 files from output/ into Resolve bin."""
    if not OUTPUT_DIR.exists():
        print(f"  ⚠️  Output folder not found: {OUTPUT_DIR}")
        return 0

    count = bridge.import_folder(str(OUTPUT_DIR))

    if count > 0:
        tl = bridge.get_or_create_timeline(timeline_name, width=1920, height=1080, fps=30)
        print(f"  ✅ Synced {count} clips to timeline: {timeline_name}")

    return count


def watch_mode(bridge: ResolveBridge):
    """Poll output folder continuously and import new files as they appear."""
    seen = set()
    print(f"\n👁  Watching {OUTPUT_DIR} every {POLL_INTERVAL}s ... (Ctrl+C to stop)\n")

    try:
        while True:
            current = set(OUTPUT_DIR.glob("*.mp4")) if OUTPUT_DIR.exists() else set()
            new_files = current - seen

            for f in new_files:
                print(f"\n  🆕 New render detected: {f.name}")
                bridge.import_clip(str(f))
                seen.add(f)

            seen = current
            time.sleep(POLL_INTERVAL)

    except KeyboardInterrupt:
        print("\n  ✋ Watch mode stopped.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync Remotion output to DaVinci Resolve")
    parser.add_argument("--watch", action="store_true", help="Continuous watch mode")
    parser.add_argument("--file", help="Import a specific file")
    parser.add_argument("--timeline", default="Pipeline_Auto", help="Target timeline name")
    args = parser.parse_args()

    print("\n═══════════════════════════════════════════")
    print("  RESOLVE SYNC — Hacking Creativity Pipeline")
    print("═══════════════════════════════════════════\n")

    bridge = ResolveBridge()

    if not bridge.connected:
        print("❌ Could not connect to DaVinci Resolve. Make sure it's open.")
        sys.exit(1)

    if args.file:
        bridge.import_clip(args.file)
    elif args.watch:
        watch_mode(bridge)
    else:
        synced = sync_output_folder(bridge, args.timeline)
        print(f"\nDone. {synced} clips synced.")
