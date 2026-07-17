// lib/background/sceneConfig.ts
// App-only quality-tier presets. The shape config itself now lives in the shared
// scene core (lib/background/core/shapes.mjs), the single source of truth read by
// both the bg-lab sandbox and the app.
import type { ActiveTier, TierPreset } from "./types";

// Every tier renders at FULL internal resolution (crisp). Efficiency comes from
// the quality-neutral levers instead: a 30fps cap (invisible for slow idle drift),
// AA auto-disabled on high-DPR screens (handled in sceneCore), and — only at the
// bottom rung — turning transmission off. internalResScale stays 1.0 as an
// emergency-only knob; the DPR ladder gives the watchdog meaningful middle steps.
export const TIER_PRESETS: Record<ActiveTier, TierPreset> = {
  high:   { dprCap: 2,   transmission: true,  internalResScale: 1.0, antialias: true,  fpsCap: 30 },
  medium: { dprCap: 1.5, transmission: true,  internalResScale: 1.0, antialias: true,  fpsCap: 30 },
  low:    { dprCap: 1,   transmission: false, internalResScale: 1.0, antialias: false, fpsCap: 30 },
};
