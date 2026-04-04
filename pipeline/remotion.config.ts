import { Config } from "@remotion/cli/config";

/**
 * HACKING CREATIVITY — REMOTION ENGINE CONFIG
 * All render settings are parameterized. Override via CLI or JSON job payload.
 */

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(Number(process.env.REMOTION_CONCURRENCY) || 2);
Config.setLogLevel((process.env.REMOTION_LOG as any) || "info");

// Pixel formats for max compatibility
Config.setPixelFormat("yuv420p");

// Chrome flags for font rendering
Config.setChromiumOpenGlRenderer("angle");
