// lib/background/sceneConfig.ts
import type { ShapeConfig, ActiveTier, TierPreset } from "./types";

// 8 physical-glass shapes, copied 1:1 from bg-lab/shapes.js (lines 23-136).
export const SHAPES: ShapeConfig[] = [
  { id: 1, type: "cube", x: 0.059, y: 0.141, size: 0.062, rotBase: [0.4, 0.6, 0.0], spinAxes: [0, 0, 0], float: { amp: 12, period: 9.4 }, hFloatRatio: 0.4, phase: 0.0, tint: 0x9fb0ff, envIntensity: 0.6, iridThickness: [150, 450], edgeTint: 0xcdd8ff },
  { id: 2, type: "tetrahedron", x: 0.110, y: 0.306, size: 0.050, rotBase: [0.2, 0.3, 0.0], spinAxes: [0.06, 0.09, 0.0], float: { amp: 10, period: 11.2 }, hFloatRatio: 0.4, phase: 1.1, tint: 0x9fb0ff, envIntensity: 0.55, iridThickness: [150, 450], edgeTint: 0xcdd8ff },
  { id: 3, type: "torus", x: 0.026, y: 0.505, size: 0.132, rotBase: [1.0, 0.0, -0.4], spinAxes: [0.0, 0.0, 0.0], wobble: { amp: 0.06, period: 7.5 }, float: { amp: 13, period: 10.1 }, hFloatRatio: 0.4, phase: 2.3, tint: 0x9fb0ff, envIntensity: 1.2, iridThickness: [150, 450] },
  { id: 4, type: "cube", x: 0.140, y: 0.755, size: 0.095, rotBase: [0.6, 0.8, 0.0], spinAxes: [0, 0, 0], float: { amp: 14, period: 8.7 }, hFloatRatio: 0.4, phase: 3.7, tint: 0xb99cff, envIntensity: 0.9, iridThickness: [150, 500], edgeTint: 0xe2c8ff },
  { id: 5, type: "cube", x: 0.938, y: 0.153, size: 0.059, rotBase: [0.35, -0.5, 0.0], spinAxes: [0, 0, 0], float: { amp: 11, period: 9.8 }, hFloatRatio: 0.4, phase: 0.7, tint: 0x9fb0ff, envIntensity: 0.6, iridThickness: [150, 450], edgeTint: 0xcdd8ff },
  { id: 6, type: "torus", x: 0.990, y: 0.333, size: 0.112, rotBase: [1.1, 0.0, 0.5], spinAxes: [0.0, 0.0, 0.0], wobble: { amp: 0.05, period: 8.3 }, float: { amp: 12, period: 11.6 }, hFloatRatio: 0.4, phase: 4.2, tint: 0x9fb0ff, envIntensity: 1.2, iridThickness: [150, 450] },
  { id: 7, type: "tetrahedron", x: 0.908, y: 0.516, size: 0.066, rotBase: [-0.1, 0.2, 0.0], spinAxes: [0.08, 0.12, 0.0], float: { amp: 13, period: 8.3 }, hFloatRatio: 0.4, phase: 5.5, tint: 0x9fb0ff, envIntensity: 0.55, iridThickness: [150, 450], edgeTint: 0xcdd8ff },
  { id: 8, type: "torus", x: 0.925, y: 0.843, size: 0.151, rotBase: [1.05, 0.0, -0.15], spinAxes: [0.0, 0.0, 0.0], wobble: { amp: 0.07, period: 9.1 }, float: { amp: 16, period: 13.2 }, hFloatRatio: 0.4, phase: 1.9, tint: 0xcf9aff, envIntensity: 1.6, iridThickness: [200, 600] },
];

export const TIER_PRESETS: Record<ActiveTier, TierPreset> = {
  high:   { dprCap: 2,   transmission: true,  internalResScale: 1.0,  antialias: true,  fpsCap: 60 },
  medium: { dprCap: 1.5, transmission: true,  internalResScale: 0.85, antialias: true,  fpsCap: 60 },
  low:    { dprCap: 1,   transmission: false, internalResScale: 0.7,  antialias: false, fpsCap: 30 },
};
