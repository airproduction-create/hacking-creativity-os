#!/usr/bin/env node
/**
 * BATCH RENDER — Hacking Creativity Pipeline Engine
 * ===================================================
 * Renders all registered Remotion compositions in sequence,
 * outputting each to the output/ folder.
 *
 * Usage:
 *   npm run render:all
 *   node scripts/render/batch-render.js --dry-run
 *   node scripts/render/batch-render.js --compositions TestCard,YourComposition
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

// ── ARGS ─────────────────────────────────────────────────────────────────
const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    "dry-run": { type: "boolean", default: false },
    compositions: { type: "string" }, // comma-separated list; default = all
    width: { type: "string", default: "1920" },
    height: { type: "string", default: "1080" },
    fps: { type: "string", default: "30" },
  },
});

// ── COMPOSITION REGISTRY ─────────────────────────────────────────────────
// Update this list as you add new compositions to src/Root.tsx
const ALL_COMPOSITIONS = [
  {
    id: "TestCard",
    description: "Pipeline verification card",
    defaultProps: {},
  },
  // Add future compositions here:
  // { id: "ProductReel_9x16", description: "Instagram Reels format", defaultProps: {} },
  // { id: "CampaignLaunch_16x9", description: "YouTube / website format", defaultProps: {} },
];

// ── FILTER ───────────────────────────────────────────────────────────────
const selected = args.compositions
  ? args.compositions.split(",").map((s) => s.trim())
  : ALL_COMPOSITIONS.map((c) => c.id);

const queue = ALL_COMPOSITIONS.filter((c) => selected.includes(c.id));

// ── OUTPUT DIR ────────────────────────────────────────────────────────────
const outputDir = process.env.OUTPUT_DIR || path.join(ROOT, "output");
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

// ── RUN ───────────────────────────────────────────────────────────────────
const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const results = [];

console.log("\n═══════════════════════════════════════════════════");
console.log("  HACKING CREATIVITY — BATCH RENDER");
console.log("═══════════════════════════════════════════════════");
console.log(`  Compositions : ${queue.map((c) => c.id).join(", ")}`);
console.log(`  Resolution   : ${args.width}×${args.height} @ ${args.fps}fps`);
console.log(`  Output dir   : ${outputDir}`);
console.log(`  Dry run      : ${args["dry-run"] ? "YES" : "no"}`);
console.log("───────────────────────────────────────────────────\n");

for (const comp of queue) {
  const outputFile = path.join(outputDir, `${comp.id}_${timestamp}.mp4`);
  const propsFlag =
    Object.keys(comp.defaultProps).length > 0
      ? `--props '${JSON.stringify(comp.defaultProps)}'`
      : "";

  const cmd = [
    "npx remotion render",
    "src/index.ts",
    comp.id,
    outputFile,
    `--width ${args.width}`,
    `--height ${args.height}`,
    `--fps ${args.fps}`,
    `--concurrency ${process.env.REMOTION_CONCURRENCY || 2}`,
    propsFlag,
  ]
    .filter(Boolean)
    .join(" ");

  console.log(`🎬 Rendering: ${comp.id}`);
  console.log(`   ${comp.description}`);
  console.log(`   → ${outputFile}\n`);

  if (!args["dry-run"]) {
    try {
      const start = Date.now();
      execSync(cmd, { cwd: ROOT, stdio: "inherit", env: { ...process.env } });
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      results.push({ id: comp.id, status: "ok", output: outputFile, elapsed });
      console.log(`\n  ✅ Done in ${elapsed}s → ${outputFile}\n`);
    } catch (err) {
      results.push({ id: comp.id, status: "failed", error: err.message });
      console.error(`\n  ❌ Failed: ${comp.id}\n     ${err.message}\n`);
    }
  } else {
    results.push({ id: comp.id, status: "dry-run", output: outputFile });
    console.log("  ⏭  (dry-run — skipped)\n");
  }
}

// ── SUMMARY ──────────────────────────────────────────────────────────────
console.log("═══════════════════════════════════════════════════");
console.log("  BATCH RENDER SUMMARY");
console.log("───────────────────────────────────────────────────");
for (const r of results) {
  const icon = r.status === "ok" ? "✅" : r.status === "dry-run" ? "⏭ " : "❌";
  const detail = r.status === "ok" ? `${r.elapsed}s` : r.status === "dry-run" ? "skipped" : r.error;
  console.log(`  ${icon} ${r.id.padEnd(28)} ${detail}`);
}
console.log("═══════════════════════════════════════════════════\n");

// Save manifest
const manifestPath = path.join(outputDir, `batch-manifest_${timestamp}.json`);
if (!args["dry-run"]) {
  writeFileSync(manifestPath, JSON.stringify({ timestamp, results }, null, 2));
  console.log(`  📄 Manifest saved → ${manifestPath}\n`);
}

const failCount = results.filter((r) => r.status === "failed").length;
process.exit(failCount > 0 ? 1 : 0);
