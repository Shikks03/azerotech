# WebGL Idle Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `bg-lab/` floating 3D-glass scene as the site-wide public background, live-rendered on capable devices with quality tiers + an FPS watchdog, degrading to a static PNG on the weakest / no-WebGL / reduced-motion devices.

**Architecture:** A single `SceneBackground` client component, mounted once in the root layout, stacks three fixed full-viewport layers — CSS gradient, static PNG, WebGL canvas. Three.js is dynamically imported (`ssr: false`) and the canvas fades in over the PNG once its first frame renders. Capability detection picks a starting tier; a downgrade-only FPS watchdog drops tiers (ultimately to the PNG) if frames are slow.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript (strict), Three.js r0.165.

**Testing note:** This repo has **no automated test runner** (confirmed: `package.json` has only `dev`/`build`/`start`/`lint`). Adding one is out of scope. Verification for every task is therefore: `npx tsc --noEmit` (typecheck), `npm run lint`, and — for visual tasks — `npm run dev` + the browser checks in the spec's verification matrix. Pure-logic modules (capability, watchdog) are written as small pure functions and verified by typecheck + a documented manual reasoning check.

**Spec:** `docs/superpowers/specs/2026-07-17-webgl-idle-background-design.md`

---

## File Structure

| Path | Responsibility |
|---|---|
| `lib/background/types.ts` | Shared types: `Tier`, `ActiveTier`, `TierPreset`, `ShapeConfig`. |
| `lib/background/sceneConfig.ts` | `SHAPES` array + `TIER_PRESETS`, lifted from `bg-lab/shapes.js`. |
| `lib/background/capability.ts` | `detectTier()` + `getTierOverride()` — pick starting tier. |
| `lib/background/watchdog.ts` | `createWatchdog()` — rolling-window frame-time downgrade trigger. |
| `lib/background/scene.ts` | `createScene()` — ported Three.js scene, tier-aware, with lifecycle API. |
| `components/SceneBackground.tsx` | Client orchestration: 3 layers, dynamic import, watchdog wiring, fade, `/admin` hide, cleanup. |
| `app/layout.tsx` | Swap `<PageBackground/>` → `<SceneBackground/>`. |
| `components/PageBackground.tsx` | **Deleted**; its gradient moves into `SceneBackground` layer 0. |
| `public/background.png` | Baked static scene frame (fallback). |
| `bg-lab/shapes.js` | Add a dev-only capture handler to generate the PNG. |

---

## Task 1: Install Three.js and pin the version

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install Three r0.165 + types**

Run:
```bash
npm install three@0.165.0
npm install --save-dev @types/three@0.165.0
```

- [ ] **Step 2: Verify install and version**

Run: `node -e "console.log(require('three/package.json').version)"`
Expected: `0.165.0`

- [ ] **Step 3: Typecheck baseline still passes**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "build(bg): add three@0.165 for idle background"
```

---

## Task 2: Shared types

**Files:**
- Create: `lib/background/types.ts`

- [ ] **Step 1: Write the types file**

```typescript
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

/** One floating shape, anchored in viewport fractions. Mirrors bg-lab/shapes.js. */
export interface ShapeConfig {
  id: number;
  type: "cube" | "tetrahedron" | "torus";
  x: number; // 0 = left edge, 1 = right edge
  y: number; // 0 = top, 1 = bottom
  size: number; // fraction of viewport width
  rotBase: [number, number, number];
  spinAxes: [number, number, number];
  float: { amp: number; period: number };
  hFloatRatio: number;
  phase: number;
  tint: number;
  envIntensity: number;
  iridThickness: [number, number];
  edgeTint?: number;
  wobble?: { amp: number; period: number };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/background/types.ts
git commit -m "feat(bg): shared types for idle background"
```

---

## Task 3: Scene config (SHAPES + tier presets)

**Files:**
- Create: `lib/background/sceneConfig.ts`
- Reference (copy from): `bg-lab/shapes.js:23-136` (the `SHAPES` array)

- [ ] **Step 1: Write the config file**

Copy the 8 entries from the `SHAPES` array in `bg-lab/shapes.js` (lines 23–136) verbatim into the array below (they already match `ShapeConfig`). Then add `TIER_PRESETS`.

```typescript
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/background/sceneConfig.ts
git commit -m "feat(bg): scene config + tier presets"
```

---

## Task 4: Capability detection

**Files:**
- Create: `lib/background/capability.ts`

- [ ] **Step 1: Write the detection module**

```typescript
// lib/background/capability.ts
// Picks a starting quality tier from device signals. Browser-only (reads window/navigator).
import type { Tier } from "./types";

/** Read ?bgtier= override for QA. Returns null if absent/invalid. */
export function getTierOverride(): Tier | null {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("bgtier");
  return v === "high" || v === "medium" || v === "low" || v === "off" ? v : null;
}

/** True if the browser can create a WebGL2/WebGL context at all. */
function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Lowercased GPU renderer string, or "" if unavailable. */
function gpuRenderer(): string {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return "";
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (!ext) return "";
    return String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "").toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Pick the starting tier. Priority: override > no-WebGL/reduced-motion/save-data/software-GPU
 * (all -> "off") > weak-mobile heuristics ("low"/"medium") > "high".
 */
export function detectTier(): Tier {
  if (typeof window === "undefined") return "off";

  const override = getTierOverride();
  if (override) return override;

  if (!hasWebGL()) return "off";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "off";

  const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return "off";

  const renderer = gpuRenderer();
  if (renderer.includes("swiftshader") || renderer.includes("llvmpipe") || renderer.includes("software")) {
    return "off";
  }

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;

  if (coarse && (mem < 4 || cores < 4)) return "low";
  if (coarse) return "medium";
  return "high";
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Manual reasoning check**

Confirm by reading the code: desktop with WebGL → `high`; phone (`pointer: coarse`) with 8GB → `medium`; phone with 2GB → `low`; `prefers-reduced-motion` → `off`; `?bgtier=low` → `low`. No runtime harness needed — these are direct branch reads.

- [ ] **Step 4: Commit**

```bash
git add lib/background/capability.ts
git commit -m "feat(bg): capability detection + tier override"
```

---

## Task 5: FPS watchdog

**Files:**
- Create: `lib/background/watchdog.ts`

- [ ] **Step 1: Write the watchdog**

```typescript
// lib/background/watchdog.ts
// Rolling-window frame-time monitor. Downgrade-only: calls onExceed when sustained
// frame time blows the current budget for two consecutive full windows.

export interface Watchdog {
  /** Feed one rendered-frame delta (ms). */
  sample(frameMs: number): void;
  /** Set the current tier's per-frame budget (ms). */
  setBudget(ms: number): void;
  /** Clear the window + strike count (call after a tier change). */
  reset(): void;
}

export interface WatchdogOptions {
  windowSize?: number; // frames per evaluation window (default 90)
  warmupMs?: number;   // ignore this much wall-time first (default 500)
  strikesToTrip?: number; // consecutive bad windows before onExceed (default 2)
}

export function createWatchdog(onExceed: () => void, opts: WatchdogOptions = {}): Watchdog {
  const windowSize = opts.windowSize ?? 90;
  const warmupMs = opts.warmupMs ?? 500;
  const strikesToTrip = opts.strikesToTrip ?? 2;

  let budget = Infinity;
  let elapsed = 0;
  const win: number[] = [];
  let strikes = 0;

  function median(arr: number[]): number {
    const s = [...arr].sort((a, b) => a - b);
    const mid = s.length >> 1;
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }

  return {
    setBudget(ms: number) {
      budget = ms;
    },
    reset() {
      win.length = 0;
      strikes = 0;
    },
    sample(frameMs: number) {
      elapsed += frameMs;
      if (elapsed < warmupMs) return; // skip shader-compile / load spikes

      win.push(frameMs);
      if (win.length < windowSize) return;

      const bad = median(win) > budget;
      win.length = 0;

      if (bad) {
        strikes += 1;
        if (strikes >= strikesToTrip) {
          strikes = 0;
          onExceed();
        }
      } else {
        strikes = 0; // a good window resets the streak
      }
    },
  };
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Manual reasoning check**

Confirm: with `setBudget(22)` (≈45fps floor for a 60fps tier), a steady stream of `sample(33)` (≈30fps) fills two 90-frame windows → `onExceed` fires once. A stream of `sample(16)` never trips. A single spike inside an otherwise-good window is absorbed by the median.

- [ ] **Step 4: Commit**

```bash
git add lib/background/watchdog.ts
git commit -m "feat(bg): fps watchdog (downgrade-only)"
```

---

## Task 6: Port the Three.js scene

**Files:**
- Create: `lib/background/scene.ts`
- Reference (copy verbatim, add TS types): `bg-lab/shapes.js` builders —
  `buildBackgroundTexture` (165-236), `buildMaterial` (241-279), `buildTesseractGeometry` (291-355), `buildGeometry` (357-367).

This is the largest task. The geometry/material/background **builders are copied verbatim** from `bg-lab/shapes.js` (they are correct and unchanged) with TypeScript parameter types added. What changes vs. the lab: (a) wrap everything in a `createScene(canvas, tier, cb)` factory, (b) drop HUD/guides/FPS-label/`importmap` code, (c) make renderer options and material transmission **tier-driven**, (d) gate the loop to `fpsCap` and report frame times via `cb.onFrame`, (e) fire `cb.onFirstFrame` after the first render, (f) add `setQuality()` and `dispose()`.

- [ ] **Step 1: Write the scene factory — module head, types, and builders**

```typescript
// lib/background/scene.ts
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { ActiveTier, ShapeConfig } from "./types";
import { SHAPES, TIER_PRESETS } from "./sceneConfig";

export interface SceneCallbacks {
  onFirstFrame?: () => void;
  onFrame?: (frameMs: number) => void;
}

export interface SceneHandle {
  start(): void;
  stop(): void;
  setQuality(tier: ActiveTier): void;
  dispose(): void;
}

// ─── Builders: copied verbatim from bg-lab/shapes.js with TS types added ──────
// buildBackgroundTexture(): copy body from shapes.js:165-236 unchanged.
function buildBackgroundTexture(): THREE.CanvasTexture {
  /* PASTE shapes.js lines 166-235 here (the function body). */
  throw new Error("paste body");
}

// buildMaterial(): copy body from shapes.js:241-279 unchanged, typing the signature.
function buildMaterial(cfg: ShapeConfig, sizePx: number): THREE.MeshPhysicalMaterial {
  /* PASTE shapes.js lines 242-278 here (the function body). */
  throw new Error("paste body");
}

// buildTesseractGeometry(): copy body from shapes.js:291-355 unchanged.
function buildTesseractGeometry(): THREE.BufferGeometry {
  /* PASTE shapes.js lines 296-354 here (the function body). */
  throw new Error("paste body");
}

// buildGeometry(): copy body from shapes.js:357-367 unchanged, typing the signature.
function buildGeometry(type: ShapeConfig["type"]): THREE.BufferGeometry {
  /* PASTE shapes.js lines 358-366 here (the function body). */
  throw new Error("paste body");
}
```

> When pasting `buildMaterial`, keep its existing torus-vs-cube branch. The low-tier
> transmission-off behavior is applied separately in `applyTransmission()` (Step 3), not here.

- [ ] **Step 2: Write the factory body — renderer, scene, meshes, layout**

Append inside the same file, the `createScene` factory. This mirrors shapes.js lines 138–503 (renderer, camera, env map, scene background, mesh build loop, `anchorToWorld`, `layoutShapes`, `resize`) but as closures over the factory args. Copy those bodies, dropping the guide group (476–492) and HUD.

```typescript
export function createScene(
  canvas: HTMLCanvasElement,
  tier: ActiveTier,
  cb: SceneCallbacks = {},
): SceneHandle {
  let preset = TIER_PRESETS[tier];

  // Renderer — antialias is fixed at creation (changing it needs a new renderer).
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: preset.antialias, alpha: false });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const CAMERA_Z = 1000;
  const camera = new THREE.PerspectiveCamera(50, 1, 1, 3000);
  camera.position.z = CAMERA_Z;
  let viewW = 0, viewH = 0;

  // Env map (PMREM RoomEnvironment) — one-time.
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const roomEnv = new RoomEnvironment();
  const envTexture = pmrem.fromScene(roomEnv).texture;
  scene.environment = envTexture;
  pmrem.dispose();
  roomEnv.dispose();

  const bgTexture = buildBackgroundTexture();
  scene.background = bgTexture;

  // Build meshes — copy shapes.js:370-425 (the SHAPES.map loop). Use `buildMaterial`,
  // `buildTesseractGeometry`, `buildGeometry` from Step 1. Keep edge overlays.
  // Store cfg on mesh.userData.cfg exactly as the lab does.
  const shapeMeshes: THREE.Object3D[] = /* PASTE + adapt shapes.js:370-425 */ [];

  function anchorToWorld(fx: number, fy: number) {
    return { x: (fx - 0.5) * viewW, y: (0.5 - fy) * viewH, z: 0 };
  }

  // layoutShapes(): copy shapes.js:437-472 (drop the layoutGuides() call at 473).
  function layoutShapes() {
    /* PASTE shapes.js:438-472 (the for-loop body), operating on shapeMeshes. */
  }

  function applyResolution() {
    const effectiveDpr = Math.min(window.devicePixelRatio, preset.dprCap) * preset.internalResScale;
    renderer.setPixelRatio(effectiveDpr);
    renderer.setSize(viewW, viewH, true); // updateStyle=true keeps canvas CSS at full size
  }

  function resize() {
    viewW = window.innerWidth;
    viewH = window.innerHeight;
    camera.aspect = viewW / viewH;
    camera.fov = 2 * Math.atan(viewH / 2 / CAMERA_Z) * (180 / Math.PI);
    camera.updateProjectionMatrix();
    applyResolution();
    layoutShapes();
  }
  // ... continued in Step 3
```

- [ ] **Step 3: Write the loop, tier switching, and dispose (same file, same factory)**

```typescript
  // --- Transmission toggle (the low-tier cost saver) ---
  function applyTransmission(on: boolean) {
    for (const mesh of shapeMeshes) {
      const m = (mesh as THREE.Mesh).material;
      if (m && (m as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial) {
        const pm = m as THREE.MeshPhysicalMaterial;
        const isTorus = (mesh.userData.cfg as ShapeConfig).type === "torus";
        pm.transmission = on ? 1.0 : 0.0;
        pm.transparent = true;
        pm.opacity = on ? (isTorus ? 0.85 : 1.0) : (isTorus ? 0.9 : 0.45);
        pm.needsUpdate = true;
      }
    }
  }

  // --- Animation loop with fps cap + frame reporting ---
  const clock = new THREE.Clock();
  let acc = 0;
  let firstFrameSent = false;

  function tick() {
    const dt = clock.getDelta();
    acc += dt;
    const minFrame = 1 / preset.fpsCap;
    if (acc < minFrame) return; // gate to fps cap
    const frameMs = acc * 1000;
    acc = 0;
    const t = clock.elapsedTime;

    // Per-shape float + rotation: copy shapes.js:515-539 (the for-loop body).
    for (const mesh of shapeMeshes) {
      /* PASTE shapes.js:516-538 (float + rotation update), operating on this mesh. */
    }

    renderer.render(scene, camera);

    if (!firstFrameSent) {
      firstFrameSent = true;
      cb.onFirstFrame?.();
    }
    cb.onFrame?.(frameMs);
  }

  // Initial layout MUST run before start (sets mesh base positions).
  resize();
  window.addEventListener("resize", resize);
  applyTransmission(preset.transmission);

  return {
    start() {
      clock.getDelta(); // drop accumulated idle time
      renderer.setAnimationLoop(tick);
    },
    stop() {
      renderer.setAnimationLoop(null);
    },
    setQuality(next: ActiveTier) {
      preset = TIER_PRESETS[next]; // NOTE: antialias change is ignored (renderer fixed)
      applyResolution();
      applyTransmission(preset.transmission);
    },
    dispose() {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", resize);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) (mat as THREE.Material).dispose();
      });
      bgTexture.dispose();
      envTexture.dispose();
      renderer.dispose();
    },
  };
}
```

- [ ] **Step 4: Paste all referenced bodies**

Replace every `/* PASTE ... */` and `throw new Error("paste body")` with the exact code from the cited `bg-lab/shapes.js` line ranges, adding only TS types where a variable is declared. Do **not** copy: the `importmap`, HUD wiring (570-576), guide group (476-492), `reducedMotion` branch (557-568), or the module-level `resize()`/`setAnimationLoop` calls (554-568) — those responsibilities now live in the component.

- [ ] **Step 5: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors. If `three/examples/jsm/environments/RoomEnvironment.js` fails to resolve types, confirm `@types/three@0.165` is installed (Task 1).

- [ ] **Step 6: Commit**

```bash
git add lib/background/scene.ts
git commit -m "feat(bg): port three.js idle scene with tier-aware renderer"
```

---

## Task 7: SceneBackground component

**Files:**
- Create: `components/SceneBackground.tsx`

- [ ] **Step 1: Write the component**

```tsx
// components/SceneBackground.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { detectTier } from "@/lib/background/capability";
import { createWatchdog } from "@/lib/background/watchdog";
import { TIER_PRESETS } from "@/lib/background/sceneConfig";
import type { ActiveTier, Tier } from "@/lib/background/types";

const TIER_ORDER: ActiveTier[] = ["high", "medium", "low"];

export default function SceneBackground() {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasVisible, setCanvasVisible] = useState(false);

  // Hide entirely on /admin (matches Header/Footer).
  const hidden = pathname?.startsWith("/admin");

  useEffect(() => {
    if (hidden) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let tier = detectTier();
    if (tier === "off") return; // PNG stays; no WebGL.

    let disposed = false;
    let handle: import("@/lib/background/scene").SceneHandle | null = null;
    let tierIndex = TIER_ORDER.indexOf(tier as ActiveTier);

    const watchdog = createWatchdog(() => {
      // Downgrade one tier, or drop to PNG at the bottom.
      if (tierIndex >= TIER_ORDER.length - 1) {
        setCanvasVisible(false);
        handle?.dispose();
        handle = null;
        return;
      }
      tierIndex += 1;
      const next = TIER_ORDER[tierIndex];
      handle?.setQuality(next);
      watchdog.setBudget(budgetFor(next));
      watchdog.reset();
    });

    function budgetFor(t: ActiveTier): number {
      return (1000 / TIER_PRESETS[t].fpsCap) * 1.5; // 50% over the frame target
    }

    // Dynamic import keeps three.js out of the initial bundle.
    import("@/lib/background/scene").then(({ createScene }) => {
      if (disposed) return;
      const active = TIER_ORDER[tierIndex];
      watchdog.setBudget(budgetFor(active));
      handle = createScene(canvas, active, {
        onFirstFrame: () => setCanvasVisible(true),
        onFrame: (ms) => watchdog.sample(ms),
      });
      handle.start();
    });

    const onVisibility = () => {
      if (!handle) return;
      if (document.hidden) handle.stop();
      else handle.start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setCanvasVisible(false);
      handle?.dispose();
      handle = null;
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      handle?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden]);

  if (hidden) return null;

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Layer 0 — CSS gradient (covers PNG letterbox edges). From old PageBackground. */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(160deg, #080B1A 0%, #0F1535 55%, #080B1A 100%)" }}
      />
      {/* Layer 1 — static PNG fallback, always present. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/background.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Layer 2 — WebGL canvas, fades in over the PNG once the first frame renders. */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full transition-opacity duration-500"
        style={{ opacity: canvasVisible ? 1 : 0 }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/SceneBackground.tsx
git commit -m "feat(bg): SceneBackground orchestration component"
```

---

## Task 8: Wire into layout, delete PageBackground

**Files:**
- Modify: `app/layout.tsx:7` and `app/layout.tsx:36`
- Delete: `components/PageBackground.tsx`

- [ ] **Step 1: Swap the import**

In `app/layout.tsx`, replace line 7:
```tsx
import PageBackground from "@/components/PageBackground";
```
with:
```tsx
import SceneBackground from "@/components/SceneBackground";
```

- [ ] **Step 2: Swap the mount**

In `app/layout.tsx`, replace line 36 `<PageBackground />` with:
```tsx
        <SceneBackground />
```

- [ ] **Step 3: Delete the old component**

Run:
```bash
git rm components/PageBackground.tsx
```

- [ ] **Step 4: Typecheck + lint + build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: build succeeds. Confirm in the build output that a separate chunk for `three` exists (dynamic import → its own chunk), not folded into the main entry.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(bg): mount SceneBackground site-wide, remove PageBackground"
```

---

## Task 9: Generate the fallback PNG

**Files:**
- Modify: `bg-lab/shapes.js` (append a dev-only capture handler)
- Create: `public/background.png`

- [ ] **Step 1: Add the capture handler to the lab**

Append to the end of `bg-lab/shapes.js`:
```javascript
// ─── Dev-only PNG capture — press "P" to download the current frame at 2560×1440.
// Not shipped; bg-lab is excluded from the Next build.
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() !== "p") return;
  const W = 2560, H = 1440;
  const prevW = window.innerWidth, prevH = window.innerHeight;
  viewW = W; viewH = H;
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  camera.aspect = W / H;
  camera.fov = 2 * Math.atan(H / 2 / CAMERA_Z) * (180 / Math.PI);
  camera.updateProjectionMatrix();
  layoutShapes();
  renderer.render(scene, camera);
  renderer.domElement.toBlob((blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "background.png";
    a.click();
    URL.revokeObjectURL(a.href);
    // restore live size
    viewW = prevW; viewH = prevH;
    resize();
  }, "image/png");
});
```

- [ ] **Step 2: Capture the frame**

Run: `npx serve bg-lab` (or open `bg-lab/index.html`), let the scene settle ~2s, press **P**, save the downloaded `background.png` to `public/background.png`.

- [ ] **Step 3: Verify the asset exists and is sane**

Run: `node -e "const s=require('fs').statSync('public/background.png');console.log(s.size)"`
Expected: a nonzero size (roughly 0.5–3 MB for a 2560×1440 PNG).

- [ ] **Step 4: Commit**

```bash
git add bg-lab/shapes.js public/background.png
git commit -m "feat(bg): dev capture handler + baked fallback PNG"
```

---

## Task 10: Full verification matrix

**Files:** none (verification only)

- [ ] **Step 1: Build passes**

Run: `npm run build`
Expected: success; `three` in its own async chunk.

- [ ] **Step 2: Live tier renders**

Run `npm run dev`, open `http://localhost:3000/`. Expected: PNG paints immediately, then the WebGL canvas fades in within ~1s; shapes float/tumble.

- [ ] **Step 3: Tier overrides**

Visit `/?bgtier=low`, `/?bgtier=medium`, `/?bgtier=high`, `/?bgtier=off`. Expected: `low` shows non-refractive (transmission-off) glass, `off` shows the PNG only, each is stable.

- [ ] **Step 4: Reduced motion**

In DevTools → Rendering → emulate `prefers-reduced-motion: reduce`, reload `/`. Expected: PNG only, no canvas.

- [ ] **Step 5: Watchdog downgrade**

DevTools → Performance → CPU 6× throttle (and/or GPU throttle), reload `/`. Expected: within a few seconds the scene downgrades (visibly simpler / eventually the PNG) rather than stuttering indefinitely.

- [ ] **Step 6: Navigation continuity**

From `/`, navigate to `/services`, `/accessories`, `/contact`. Expected: background is continuous, no flash/re-init hitch between routes.

- [ ] **Step 7: Admin exclusion**

Visit `/admin`. Expected: no canvas and no PNG (background hidden).

- [ ] **Step 8: Final commit (if any doc/notes)**

```bash
git add -A
git commit -m "chore(bg): verification pass complete" --allow-empty
```

---

## Self-Review Notes

- **Spec coverage:** layer model (T7), single persistent mount (T7/T8), 4 tiers (T3/T6), detection (T4), watchdog (T5/T7), transmission-off low tier (T6 `applyTransmission`), `/admin` hide (T7), dispose/context-loss (T6/T7), Three r0.165 pin (T1), PNG generation (T9), verification matrix (T10). All spec sections mapped.
- **Type consistency:** `Tier`/`ActiveTier`/`TierPreset`/`ShapeConfig` defined in T2 and used unchanged in T3–T7; `SceneHandle`/`SceneCallbacks` defined in T6 and consumed in T7; `createWatchdog(onExceed, opts)` signature matches its T7 call site.
- **Known simplification:** `setQuality()` does not change MSAA (renderer is fixed at creation). Documented in T6; acceptable because DPR/resolution/transmission dominate cost and the watchdog only downgrades.
