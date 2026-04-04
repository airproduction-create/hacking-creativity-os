#!/usr/bin/env node
/**
 * RENDER JOB RUNNER
 *
 * Pulls a job from Supabase (or accepts a JSON payload via CLI),
 * renders it via Remotion, updates job status throughout.
 *
 * Usage:
 *   node scripts/render/render-job.js --composition TestCard --output ./output/test.mp4
 *   node scripts/render/render-job.js --job <supabase_job_id>
 *   echo '{"composition":"TestCard","payload":{}}' | node scripts/render/render-job.js
 */

import { execSync, spawn } from "child_process";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

// ── PARSE ARGS ────────────────────────────────────────────────────────────
const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    composition: { type: "string", default: "TestCard" },
    output: { type: "string" },
    props: { type: "string" },   // JSON string of props
    job: { type: "string" },     // Supabase job ID
    width: { type: "string", default: "1920" },
    height: { type: "string", default: "1080" },
    fps: { type: "string", default: "30" },
  },
});

// ── RESOLVE OUTPUT PATH ───────────────────────────────────────────────────
const outputDir = process.env.OUTPUT_DIR || path.join(ROOT, "output");
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outputFile = args.output || path.join(outputDir, `${args.composition}_${timestamp}.mp4`);

// ── BUILD REMOTION CLI COMMAND ────────────────────────────────────────────
const propsJson = args.props ? `--props '${args.props}'` : "";

const cmd = [
  "npx remotion render",
  "src/index.ts",
  args.composition,
  outputFile,
  `--width ${args.width}`,
  `--height ${args.height}`,
  `--fps ${args.fps}`,
  `--concurrency ${process.env.REMOTION_CONCURRENCY || 2}`,
  propsJson,
].filter(Boolean).join(" ");

// ── RUN ──────────────────────────────────────────────────────────────────
console.log("\n🎬 PIPELINE ENGINE — Starting render");
console.log(`   Composition : ${args.composition}`);
console.log(`   Output      : ${outputFile}`);
console.log(`   Resolution  : ${args.width}×${args.height} @ ${args.fps}fps`);
console.log(`   Command     : ${cmd}\n`);

try {
  execSync(cmd, { cwd: ROOT, stdio: "inherit", env: { ...process.env } });
  console.log(`\n✅ Render complete → ${outputFile}`);
} catch (err) {
  console.error("\n❌ Render failed:", err.message);
  process.exit(1);
}
