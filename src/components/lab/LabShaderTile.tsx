"use client";

import { MeshGradient, GrainGradient, Warp } from "@paper-design/shaders-react";
import type { ReactNode } from "react";

// A thumbnail driven by a real-time WebGL shader — same basic vibe as
// the animated tiles on samgros.com, but without needing to ship video
// files.  Uses @paper-design/shaders-react, which is ~20KB gzipped.
//
// Three preset variants map to the three non-sandbox Lab tiles.  Each
// variant is a curated gradient + slow speed + a knockout glyph on top.

export type LabShaderVariant = "iris" | "ember" | "ink";

interface Props {
  variant: LabShaderVariant;
  glyph: ReactNode;
  /** Small corner label (e.g. "SwiftUI"). Kept subtle. */
  label?: string;
}

export default function LabShaderTile({ variant, glyph, label }: Props) {
  return (
    <div className="absolute inset-0">
      <ShaderSurface variant={variant} />

      {/* Gentle vignette to keep the glyph legible against the shader */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(70% 60% at 50% 45%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.22) 100%)",
        }}
      />

      {/* Glyph — rendered in white knockout, centered */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {glyph}
      </div>

      {/* Corner label */}
      {label && (
        <div
          className="absolute right-3 bottom-2.5 pointer-events-none font-sans"
          style={{
            color: "rgba(255,255,255,0.72)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 0.4,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

// ---- Shader variants ---------------------------------------------------
//
// Each variant picks a shader + palette + motion speed that reads as a
// restrained Sam-Gros-adjacent composition.  The palettes are chosen so
// the white glyph remains legible at the mid-field, and `speed` is kept
// low (0.15–0.35) so motion feels like breathing, not churning.

function ShaderSurface({ variant }: { variant: LabShaderVariant }) {
  switch (variant) {
    case "iris":
      // Deep blue → violet → pink iridescent mesh.  Matches the
      // SwiftUI tile's previous static palette but now breathes.
      return (
        <MeshGradient
          style={{ width: "100%", height: "100%" }}
          colors={["#1e2370", "#3b5bd6", "#8657e7", "#e55aa3", "#ffd0f0"]}
          distortion={0.85}
          swirl={0.18}
          speed={0.22}
          grainMixer={0.08}
          grainOverlay={0}
        />
      );
    case "ember":
      // Warm editorial — terracotta → marigold with soft swirl.
      return (
        <MeshGradient
          style={{ width: "100%", height: "100%" }}
          colors={["#5a1a14", "#b23f20", "#e07a2e", "#f5b135", "#ffd978"]}
          distortion={0.75}
          swirl={0.22}
          speed={0.25}
          grainMixer={0.1}
          grainOverlay={0}
        />
      );
    case "ink":
      // Ink-moss teal.  Warp over an edge pattern gives a marbled,
      // slowly-rolling look that reads as "contemplative/studious."
      return (
        <Warp
          style={{ width: "100%", height: "100%" }}
          colors={["#051916", "#0e3a36", "#1a6e66", "#2fa293", "#0e3a36"]}
          proportion={0.5}
          softness={0.8}
          distortion={0.45}
          swirl={0.65}
          swirlIterations={10}
          shapeScale={0.35}
          shape="edge"
          speed={0.18}
        />
      );
  }
}

// An unused import kept here to flag which extra shader we have on deck.
// Removing it would just mean more fumbling if we want to swap variants.
void GrainGradient;
