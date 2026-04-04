/**
 * TEST CARD COMPOSITION
 *
 * Purpose: confirm the render pipeline works end-to-end.
 * Replaces this with your first real template once the engine is verified.
 *
 * Animates using Remotion's interpolate() + framer-motion for layered motion.
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  spring,
} from "remotion";
import { motion } from "framer-motion";

interface TestCardProps {
  title: string;
  subtitle: string;
  primaryColor: string;
  accentColor: string;
  fps: number;
}

export const TestCard: React.FC<TestCardProps> = ({
  title,
  subtitle,
  primaryColor,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Fade in 0→30f, hold, fade out 120→150f
  const opacity = interpolate(
    frame,
    [0, 30, durationInFrames - 30, durationInFrames],
    [0, 1, 1, 0],
    { easing: Easing.ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Title slide up
  const titleY = interpolate(frame, [0, 40], [60, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: "clamp",
  });

  // Subtitle fade + delay
  const subtitleOpacity = interpolate(frame, [25, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Accent bar scale
  const barScale = interpolate(frame, [20, 50], [0, 1], {
    easing: Easing.out(Easing.back(1.5)),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, #0f0f1a 0%, ${primaryColor}22 100%)`,
        opacity,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 24,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${primaryColor}15 1px, transparent 1px), linear-gradient(90deg, ${primaryColor}15 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Glow orb */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Accent bar */}
      <div
        style={{
          width: 80,
          height: 4,
          background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`,
          borderRadius: 2,
          transform: `scaleX(${barScale})`,
          transformOrigin: "left center",
        }}
      />

      {/* Title */}
      <div
        style={{
          fontSize: 72,
          fontWeight: 900,
          color: "#ffffff",
          letterSpacing: "-0.03em",
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
          zIndex: 1,
        }}
      >
        {title}
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: 28,
          fontWeight: 400,
          color: `${primaryColor}cc`,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          opacity: subtitleOpacity,
          zIndex: 1,
        }}
      >
        {subtitle}
      </div>

      {/* Status pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 20px",
          background: "rgba(255,255,255,0.06)",
          border: `1px solid ${primaryColor}40`,
          borderRadius: 100,
          opacity: subtitleOpacity,
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#4ade80",
            boxShadow: "0 0 8px #4ade80",
          }}
        />
        <span style={{ color: "#94a3b8", fontSize: 16, fontWeight: 500 }}>
          Render Engine Online
        </span>
      </div>
    </AbsoluteFill>
  );
};
