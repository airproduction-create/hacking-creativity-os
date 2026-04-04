"""
BATCH EXPORT — Render all timelines in a DaVinci project to a target folder
============================================================================
Uses the Resolve render queue to export multiple timelines in one pass.

Usage:
  python3 scripts/davinci/batch-export.py --output ./output/final
  python3 scripts/davinci/batch-export.py --preset "YouTube 1080p" --output ./output/youtube
"""

import sys
import os
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from scripts.davinci.resolve_bridge import ResolveBridge  # type: ignore


def batch_export(bridge: ResolveBridge, output_dir: str, preset: str):
    """Queue every timeline in the project for export, then render all."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    project = bridge._project
    timeline_count = project.GetTimelineCount()

    if timeline_count == 0:
        print("⚠️  No timelines found in project.")
        return

    print(f"\n🎬 Queuing {timeline_count} timeline(s) for export...")

    for i in range(1, timeline_count + 1):
        tl = project.GetTimelineByIndex(i)
        tl_name = tl.GetName()
        out_file = str(output_path / f"{tl_name}.mp4")

        project.SetCurrentTimeline(tl)

        # Clear existing render jobs for this timeline
        project.DeleteAllRenderJobs()

        # Load preset and set output
        project.LoadRenderPreset(preset)
        project.SetRenderSettings({
            "TargetDir": str(output_path.resolve()),
            "CustomName": tl_name,
            "ExportVideo": True,
            "ExportAudio": True,
        })

        job_id = project.AddRenderJob()
        print(f"  ✅ Queued: {tl_name} → {out_file}")

    print(f"\n⏳ Starting render queue ({timeline_count} jobs)...")
    bridge.start_render()
    bridge.wait_for_render()

    print(f"\n✅ Batch export complete → {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Batch export all DaVinci timelines")
    parser.add_argument("--output", default="./output/final", help="Output directory")
    parser.add_argument("--preset", default=os.getenv("DAVINCI_RENDER_PRESET", "H.264 Master"), help="Render preset")
    args = parser.parse_args()

    print("\n═══════════════════════════════════════════")
    print("  BATCH EXPORT — Hacking Creativity Pipeline")
    print("═══════════════════════════════════════════")

    bridge = ResolveBridge()
    if not bridge.connected:
        print("❌ Cannot connect to DaVinci Resolve. Make sure it's open.")
        sys.exit(1)

    batch_export(bridge, args.output, args.preset)
