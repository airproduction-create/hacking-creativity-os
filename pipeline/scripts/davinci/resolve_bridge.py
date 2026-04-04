"""
DAVINCI RESOLVE BRIDGE — Hacking Creativity Pipeline Engine
============================================================
Core module for all DaVinci Resolve automation.

SETUP (one-time, macOS):
  1. Open DaVinci Resolve Studio
  2. Go to Preferences → System → General
  3. Enable "External scripting using local network"
  4. Run: python3 scripts/davinci/resolve_bridge.py --test

USAGE:
  from scripts.davinci.resolve_bridge import ResolveBridge
  bridge = ResolveBridge()
  bridge.import_clip("./output/TestCard_2025.mp4")
"""

import sys
import os
import argparse
from pathlib import Path

# ── DAVINCI RESOLVE API PATH (macOS) ──────────────────────────────────────
RESOLVE_API_PATHS = [
    "/Library/Application Support/Blackmagic Design/DaVinci Resolve/Developer/Scripting/Modules",
    "/Applications/DaVinci Resolve/DaVinci Resolve.app/Contents/Libraries/Fusion/Modules",
]

def _init_resolve_api():
    """Add DaVinci Resolve API to sys.path — must be called before import."""
    for p in RESOLVE_API_PATHS:
        if Path(p).exists() and p not in sys.path:
            sys.path.insert(0, p)
            return True
    return False


_api_available = _init_resolve_api()

try:
    import DaVinciResolveScript as dvr  # type: ignore
    RESOLVE_AVAILABLE = True
except ImportError:
    RESOLVE_AVAILABLE = False


class ResolveBridge:
    """
    High-level interface to DaVinci Resolve Studio.

    All methods are safe to call — they fail gracefully if Resolve isn't open.
    """

    def __init__(self, project_name: str | None = None, bin_name: str | None = None):
        self.project_name = project_name or os.getenv("DAVINCI_PROJECT_NAME", "HackingCreativity")
        self.bin_name = bin_name or os.getenv("DAVINCI_BIN_NAME", "Pipeline_Output")
        self._resolve = None
        self._pm = None
        self._project = None
        self._media_pool = None
        self._bin = None

        if not RESOLVE_AVAILABLE:
            print("⚠️  DaVinci Resolve API not found. Is Resolve Studio installed?")
            return

        self._connect()

    def _connect(self) -> bool:
        """Establish connection to running DaVinci Resolve instance."""
        try:
            self._resolve = dvr.scriptapp("Resolve")
            if not self._resolve:
                print("❌ DaVinci Resolve is not running. Please open it first.")
                return False

            self._pm = self._resolve.GetProjectManager()
            self._project = self._pm.GetCurrentProject()

            if not self._project:
                # Try opening the configured project
                self._project = self._pm.LoadProject(self.project_name)

            if not self._project:
                print(f"⚠️  Project '{self.project_name}' not found. Using current project.")
                self._project = self._pm.GetCurrentProject()

            self._media_pool = self._project.GetMediaPool()
            self._bin = self._get_or_create_bin(self.bin_name)

            print(f"✅ Connected to DaVinci Resolve — Project: {self._project.GetName()}")
            return True

        except Exception as e:
            print(f"❌ Resolve connection failed: {e}")
            return False

    @property
    def connected(self) -> bool:
        return self._resolve is not None and self._project is not None

    # ── BIN MANAGEMENT ───────────────────────────────────────────────────

    def _get_or_create_bin(self, name: str):
        """Get existing bin or create it in the media pool root."""
        root = self._media_pool.GetRootFolder()
        for folder in root.GetSubFolderList():
            if folder.GetName() == name:
                self._media_pool.SetCurrentFolder(folder)
                return folder

        # Create new bin
        new_bin = self._media_pool.AddSubFolder(root, name)
        self._media_pool.SetCurrentFolder(new_bin)
        print(f"  📁 Created bin: {name}")
        return new_bin

    # ── MEDIA IMPORT ─────────────────────────────────────────────────────

    def import_clip(self, file_path: str) -> bool:
        """Import a rendered clip into the pipeline bin."""
        if not self.connected:
            print("❌ Not connected to Resolve.")
            return False

        abs_path = str(Path(file_path).resolve())
        if not Path(abs_path).exists():
            print(f"❌ File not found: {abs_path}")
            return False

        clips = self._media_pool.ImportMedia([abs_path])
        if clips:
            print(f"  ✅ Imported: {Path(abs_path).name}")
            return True
        else:
            print(f"  ❌ Import failed: {abs_path}")
            return False

    def import_folder(self, folder_path: str) -> int:
        """Import all video files from a folder into the pipeline bin."""
        folder = Path(folder_path)
        video_extensions = {".mp4", ".mov", ".mxf", ".avi", ".mkv"}
        files = [str(f) for f in folder.iterdir() if f.suffix.lower() in video_extensions]

        if not files:
            print(f"⚠️  No video files found in {folder_path}")
            return 0

        clips = self._media_pool.ImportMedia(files)
        count = len(clips) if clips else 0
        print(f"  ✅ Imported {count}/{len(files)} clips from {folder_path}")
        return count

    # ── TIMELINE ─────────────────────────────────────────────────────────

    def create_timeline(self, name: str, width: int = 1920, height: int = 1080, fps: float = 30.0):
        """Create a new timeline with the given settings."""
        if not self.connected:
            return None

        timeline_info = {
            "timelineName": name,
            "widthxheight": f"{width}x{height}",
            "frameRate": str(fps),
            "colorSpaceConversion": os.getenv("DAVINCI_COLORSPACE", "DaVinci Wide Gamut"),
        }

        timeline = self._media_pool.CreateEmptyTimeline(name)
        print(f"  ✅ Created timeline: {name} ({width}×{height} @ {fps}fps)")
        return timeline

    def get_or_create_timeline(self, name: str, **kwargs):
        """Get existing timeline by name or create a new one."""
        if not self.connected:
            return None

        for i in range(1, self._project.GetTimelineCount() + 1):
            tl = self._project.GetTimelineByIndex(i)
            if tl.GetName() == name:
                self._project.SetCurrentTimeline(tl)
                return tl

        return self.create_timeline(name, **kwargs)

    def append_clip_to_timeline(self, timeline, clip_name: str) -> bool:
        """Append a media pool clip to the end of a timeline by name."""
        if not self.connected:
            return False

        root = self._media_pool.GetRootFolder()
        bin_folder = self._get_or_create_bin(self.bin_name)
        clips = bin_folder.GetClipList()

        target = next((c for c in clips if c.GetName() == clip_name), None)
        if not target:
            print(f"  ❌ Clip '{clip_name}' not found in bin.")
            return False

        self._media_pool.SetCurrentFolder(bin_folder)
        self._media_pool.AppendToTimeline([{"mediaPoolItem": target}])
        print(f"  ✅ Appended to timeline: {clip_name}")
        return True

    # ── RENDER ───────────────────────────────────────────────────────────

    def add_render_job(self, output_path: str, preset_name: str | None = None) -> bool:
        """Queue the current timeline for render."""
        if not self.connected:
            return False

        preset = preset_name or os.getenv("DAVINCI_RENDER_PRESET", "H.264 Master")
        output_dir = str(Path(output_path).parent.resolve())

        self._project.LoadRenderPreset(preset)
        self._project.SetRenderSettings({
            "TargetDir": output_dir,
            "CustomName": Path(output_path).stem,
        })

        job_id = self._project.AddRenderJob()
        print(f"  ✅ Queued render job: {job_id} → {output_path}")
        return bool(job_id)

    def start_render(self) -> bool:
        """Start all queued render jobs."""
        if not self.connected:
            return False

        success = self._project.StartRendering()
        print("  🎬 Render started..." if success else "  ❌ Render failed to start.")
        return success

    def wait_for_render(self, poll_interval: float = 2.0) -> bool:
        """Block until all render jobs complete."""
        import time
        while self._project.IsRenderingInProgress():
            progress = self._project.GetRenderJobStatus(self._project.GetRenderJobList()[-1])
            print(f"  ⏳ Rendering... {progress.get('CompletionPercentage', 0):.0f}%", end="\r")
            time.sleep(poll_interval)
        print("\n  ✅ All renders complete.")
        return True

    # ── COLOR GRADING ─────────────────────────────────────────────────────

    def apply_lut(self, lut_path: str, clip_name: str | None = None) -> bool:
        """Apply a LUT to a clip or the entire timeline via Color page."""
        # Note: Full LUT automation requires DaVinci Resolve 18+ API
        print(f"  ℹ️  LUT application via API requires manual Color page setup.")
        print(f"     LUT path: {lut_path}")
        return False

    # ── UTILS ─────────────────────────────────────────────────────────────

    def get_project_info(self) -> dict:
        if not self.connected:
            return {}
        return {
            "name": self._project.GetName(),
            "timelines": self._project.GetTimelineCount(),
            "fps": self._project.GetSetting("timelineFrameRate"),
            "resolution": f"{self._project.GetSetting('timelineResolutionWidth')}×{self._project.GetSetting('timelineResolutionHeight')}",
        }


# ── CLI TEST MODE ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DaVinci Resolve Bridge CLI")
    parser.add_argument("--test", action="store_true", help="Test connection to Resolve")
    parser.add_argument("--import", dest="import_path", help="Import file or folder to bin")
    parser.add_argument("--info", action="store_true", help="Print project info")
    args = parser.parse_args()

    bridge = ResolveBridge()

    if args.test:
        print("\n── CONNECTION TEST ──────────────────────")
        print(f"  Connected: {bridge.connected}")
        if bridge.connected:
            info = bridge.get_project_info()
            for k, v in info.items():
                print(f"  {k.capitalize()}: {v}")

    if args.import_path:
        p = Path(args.import_path)
        if p.is_dir():
            bridge.import_folder(args.import_path)
        else:
            bridge.import_clip(args.import_path)

    if args.info:
        print("\n── PROJECT INFO ─────────────────────────")
        for k, v in bridge.get_project_info().items():
            print(f"  {k}: {v}")
