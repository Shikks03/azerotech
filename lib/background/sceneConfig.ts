// lib/background/sceneConfig.ts
// App-only quality-tier presets. The shape config itself now lives in the shared
// scene core (lib/background/core/shapes.mjs), the single source of truth read by
// both the bg-lab sandbox and the app.
import type { ActiveTier, TierPreset } from "./types";

export const TIER_PRESETS: Record<ActiveTier, TierPreset> = {
  high:   { dprCap: 2,   transmission: true,  internalResScale: 1.0,  antialias: true,  fpsCap: 60 },
  medium: { dprCap: 1.5, transmission: true,  internalResScale: 0.85, antialias: true,  fpsCap: 60 },
  low:    { dprCap: 1,   transmission: false, internalResScale: 0.7,  antialias: false, fpsCap: 30 },
};
