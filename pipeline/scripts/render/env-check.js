#!/usr/bin/env node
/**
 * ENV CHECK — Run this before first render to verify the stack.
 * Usage: npm run check
 */

import { execSync } from "child_process";

const checks = [
  { name: "Node.js", cmd: "node -v", required: true },
  { name: "Python 3", cmd: "python3 --version", required: true },
  { name: "ffmpeg", cmd: "ffmpeg -version", required: true },
  { name: "Remotion CLI", cmd: "npx remotion --version", required: true },
  { name: "DaVinci Resolve API", cmd: "python3 -c \"import sys; sys.path.insert(0, '/Library/Application Support/Blackmagic Design/DaVinci Resolve/Developer/Scripting/Modules'); import DaVinciResolveScript; print('ok')\"", required: false },
];

const envVars = [
  { name: "SUPABASE_URL", required: false },
  { name: "SUPABASE_SERVICE_KEY", required: false },
  { name: "ANTHROPIC_API_KEY", required: false },
  { name: "ELEVENLABS_API_KEY", required: false },
  { name: "VIDEODB_API_KEY", required: false },
];

console.log("\n═══════════════════════════════════════════");
console.log("  HACKING CREATIVITY — PIPELINE ENV CHECK  ");
console.log("═══════════════════════════════════════════\n");

let allPass = true;

console.log("── BINARIES ───────────────────────────────");
for (const check of checks) {
  try {
    const out = execSync(check.cmd, { stdio: "pipe" }).toString().trim().split("\n")[0];
    console.log(`  ✅ ${check.name.padEnd(22)} ${out}`);
  } catch {
    const icon = check.required ? "❌" : "⚠️ ";
    console.log(`  ${icon} ${check.name.padEnd(22)} NOT FOUND${check.required ? " (REQUIRED)" : " (optional)"}`);
    if (check.required) allPass = false;
  }
}

console.log("\n── ENV VARS ───────────────────────────────");
for (const env of envVars) {
  const val = process.env[env.name];
  if (val) {
    console.log(`  ✅ ${env.name.padEnd(26)} set (${val.length} chars)`);
  } else {
    console.log(`  ⚠️  ${env.name.padEnd(26)} not set (add to .env when ready)`);
  }
}

console.log("\n───────────────────────────────────────────");
if (allPass) {
  console.log("  ✅ All required checks passed. Ready to render.\n");
} else {
  console.log("  ❌ Missing required tools. See above.\n");
  console.log("  Install ffmpeg:  brew install ffmpeg");
  console.log("  Then run:        npm install\n");
}
