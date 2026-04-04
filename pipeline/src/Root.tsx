/**
 * HACKING CREATIVITY — REMOTION ROOT
 *
 * This is the composition registry. Add new video templates here as:
 *   <Composition id="TemplateName" component={YourComponent} {...props} />
 *
 * Each composition accepts a `payload` prop (JSON) so any video can be
 * triggered programmatically via the render engine.
 */

import { Composition } from "remotion";
import { TestCard } from "./compositions/TestCard";

// ── COMPOSITION REGISTRY ──────────────────────────────────────────────────
// Add your compositions here as you build them out.
// The `id` is what you reference in render jobs (e.g., { composition: "TestCard" })

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/*
       * TEST CARD — verify your render pipeline is working
       * Run: npx remotion render src/index.ts TestCard output/test.mp4
       */}
      <Composition
        id="TestCard"
        component={TestCard}
        durationInFrames={150}  // 5 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "Pipeline Online",
          subtitle: "Hacking Creativity OS",
          primaryColor: "#4f46e5",
          accentColor: "#7c3aed",
          fps: 30,
        }}
      />

      {/*
       * FUTURE COMPOSITIONS — uncomment and build as needed:
       *
       * <Composition id="ProductReel_9x16" ... />    // Instagram Reels
       * <Composition id="CampaignLaunch_16x9" ... /> // YouTube
       * <Composition id="BrandSting_1x1" ... />      // LinkedIn
       * <Composition id="ScriptReadthrough" ... />   // internal review
       */}
    </>
  );
};
