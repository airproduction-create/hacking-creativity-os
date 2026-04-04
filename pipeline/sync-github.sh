#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# SYNC TO GITHUB — Run from your Agency/ folder after setup.sh
# Updates both agency-os-app.html (from Netlify) and pushes all pipeline files
#
# Usage:  cd /path/to/Agency && bash pipeline/sync-github.sh
# ═══════════════════════════════════════════════════════════════════════════
set -e

AGENCY_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OS_URL="https://hacking-creativity-os.netlify.app"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  HACKING CREATIVITY — GITHUB SYNC"
echo "═══════════════════════════════════════════════════"
echo ""

cd "$AGENCY_DIR"

# Check we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "❌ Not a git repo. Run: git init && git remote add origin <url>"
  exit 1
fi

# Pull latest OS HTML from live Netlify
echo "[1/3] Pulling latest OS HTML from Netlify..."
if curl -sf "$OS_URL" -o agency-os-app.html; then
  echo "  ✅ agency-os-app.html updated"
else
  echo "  ⚠️  Could not reach Netlify, using local copy"
fi

# Stage all changes
echo ""
echo "[2/3] Staging changes..."
git add agency-os-app.html
git add pipeline/
git status --short

# Commit and push
echo ""
echo "[3/3] Committing and pushing..."
git commit -m "feat: video pipeline — Remotion + DaVinci Resolve + Supabase queue

- Fixed pipeline page HTML position (now renders correctly in OS)
- Added pipeline/ folder: Remotion 4, framer-motion, Supabase job queue
- Added DaVinci Resolve Python bridge and sync scripts
- Added tsconfig.json, batch-render.js, setup.sh, sync-github.sh
- Live at: https://hacking-creativity-os.netlify.app" || echo "  ℹ️  Nothing new to commit"

git push origin main
echo ""
echo "  ✅ Pushed to GitHub"
echo ""
echo "═══════════════════════════════════════════════════"
