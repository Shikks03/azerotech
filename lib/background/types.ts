// lib/background/types.ts
// Shared types for the WebGL idle background.

/** All possible quality states. "off" = no WebGL, PNG fallback only. */
export type Tier = "high" | "medium" | "low" | "off";

/** Tiers that actually render a WebGL scene. */
export type ActiveTier = Exclude<Tier, "off">;

/** Per-tier renderer/material knobs. */
export interface TierPreset {
  /** Max device-pixel-ratio before internal-res scaling. */
  dprCap: number;
  /** Whether MeshPhysicalMaterial.transmission is enabled (the big cost). */
  transmission: boolean;
  /** Multiplier on the drawing-buffer resolution (canvas CSS size unchanged). */
  internalResScale: number;
  /** MSAA on the WebGLRenderer. Set at creation only (see scene.ts). */
  antialias: boolean;
  /** Target frames per second (render loop is gated to this). */
  fpsCap: number;
}
