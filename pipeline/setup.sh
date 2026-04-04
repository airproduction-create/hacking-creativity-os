#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# HACKING CREATIVITY — PIPELINE SETUP
# Run once from the Agency/ folder:
#   cd /path/to/Agency && bash pipeline/setup.sh
# ═══════════════════════════════════════════════════════════════════════════
set -e

BOLD=$(tput bold 2>/dev/null || echo "")
RESET=$(tput sgr0 2>/dev/null || echo "")
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

AGENCY_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PIPELINE_DIR="$AGENCY_DIR/pipeline"
OS_URL="https://hacking-creativity-os.netlify.app"

echo ""
echo "${BOLD}═══════════════════════════════════════════════════${RESET}"
echo "${BOLD}  HACKING CREATIVITY — PIPELINE SETUP              ${RESET}"
echo "═══════════════════════════════════════════════════"
echo ""

# ── 1. SYNC LIVE OS HTML ──────────────────────────────────────────────────
echo "${BOLD}[1/5] Syncing latest OS from Netlify...${RESET}"
if curl -sf "$OS_URL" -o "$AGENCY_DIR/agency-os-app.html"; then
  SIZE=$(wc -c < "$AGENCY_DIR/agency-os-app.html" | tr -d ' ')
  echo -e "  ${GREEN}✅ agency-os-app.html updated (${SIZE} bytes)${NC}"
else
  echo -e "  ${YELLOW}⚠️  Could not reach Netlify. Skipping HTML sync.${NC}"
fi

# ── 2. CHECK NODE VERSION ─────────────────────────────────────────────────
echo ""
echo "${BOLD}[2/5] Checking Node.js version...${RESET}"
NODE_VER=$(node -v 2>/dev/null || echo "not found")
echo "  Node: $NODE_VER"
if [[ "$NODE_VER" == "not found" ]]; then
  echo -e "  ${RED}❌ Node.js not found. Install from https://nodejs.org${NC}"
  exit 1
fi

# ── 3. NPM INSTALL ────────────────────────────────────────────────────────
echo ""
echo "${BOLD}[3/5] Installing pipeline dependencies...${RESET}"
cd "$PIPELINE_DIR"
npm install
echo -e "  ${GREEN}✅ Dependencies installed${NC}"

# ── 4. CHECK FFMPEG ───────────────────────────────────────────────────────
echo ""
echo "${BOLD}[4/5] Checking ffmpeg...${RESET}"
if command -v ffmpeg &>/dev/null; then
  FFMPEG_VER=$(ffmpeg -version 2>&1 | head -1)
  echo -e "  ${GREEN}✅ $FFMPEG_VER${NC}"
else
  echo -e "  ${YELLOW}⚠️  ffmpeg not found. Installing via Homebrew...${NC}"
  if command -v brew &>/dev/null; then
    brew install ffmpeg
    echo -e "  ${GREEN}✅ ffmpeg installed${NC}"
  else
    echo -e "  ${RED}❌ Homebrew not found. Install ffmpeg manually:${NC}"
    echo "     brew install ffmpeg"
    echo "     OR: https://ffmpeg.org/download.html"
  fi
fi

# ── 5. ENV CHECK ──────────────────────────────────────────────────────────
echo ""
echo "${BOLD}[5/5] Running full environment check...${RESET}"
cd "$PIPELINE_DIR"
node scripts/render/env-check.js

# ── DONE ──────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "${BOLD}  SETUP COMPLETE${RESET}"
echo "───────────────────────────────────────────────────"
echo ""
echo "  ${BOLD}Next steps:${RESET}"
echo ""
echo "  1. Fill in your .env keys:"
echo "     open pipeline/.env"
echo ""
echo "  2. Run the Supabase schema in your SQL editor:"
echo "     https://supabase.com/dashboard → SQL Editor"
echo "     → Open: pipeline/supabase-pipeline-schema.sql"
echo ""
echo "  3. Open DaVinci Resolve, then test the connection:"
echo "     python3 pipeline/scripts/davinci/resolve_bridge.py --test"
echo ""
echo "  4. Start the Remotion Studio:"
echo "     cd pipeline && npm start"
echo ""
echo "  5. Queue your first render from the OS:"
echo "     ${OS_URL} → Video Pipeline → Queue Job"
echo ""
echo "═══════════════════════════════════════════════════"
echo ""
