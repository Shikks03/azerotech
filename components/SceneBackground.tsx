"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { detectTier } from "@/lib/background/capability";
import { createWatchdog } from "@/lib/background/watchdog";
import { TIER_PRESETS } from "@/lib/background/sceneConfig";
import type { ActiveTier } from "@/lib/background/types";

const TIER_ORDER: ActiveTier[] = ["high", "medium", "low"];

/** Per-frame budget (ms) that the watchdog treats as "too slow" for a tier. */
function budgetFor(t: ActiveTier): number {
  return (1000 / TIER_PRESETS[t].fpsCap) * 1.5; // 50% over the frame target
}

/**
 * Site-wide idle background. Three stacked fixed layers: a CSS gradient, a static
 * PNG fallback, and (on capable devices) the live WebGL scene from the shared core,
 * which fades in over the PNG. A downgrade-only FPS watchdog steps quality down —
 * ultimately back to the PNG — if frames are slow. Hidden on /admin.
 */
export default function SceneBackground() {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasVisible, setCanvasVisible] = useState(false);

  const hidden = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    if (hidden) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const startTier = detectTier();
    if (startTier === "off") return; // no-WebGL / reduced-motion / save-data: PNG stays

    let disposed = false;
    let handle: {
      start: () => void;
      setOptions: (o: Record<string, unknown>) => void;
      dispose: () => void;
    } | null = null;
    let tierIndex = TIER_ORDER.indexOf(startTier as ActiveTier);

    const watchdog = createWatchdog(() => {
      if (tierIndex >= TIER_ORDER.length - 1) {
        // Bottom tier still too slow — drop to the PNG.
        setCanvasVisible(false);
        handle?.dispose();
        handle = null;
        return;
      }
      tierIndex += 1;
      const next = TIER_ORDER[tierIndex];
      const preset = TIER_PRESETS[next];
      handle?.setOptions({
        dprCap: preset.dprCap,
        internalResScale: preset.internalResScale,
        transmission: preset.transmission,
        fpsCap: preset.fpsCap,
      });
      watchdog.setBudget(budgetFor(next));
      watchdog.reset();
    });

    // Dynamic import keeps three.js + the scene core out of the initial bundle.
    import("@/lib/background/core/sceneCore.mjs").then(({ createScene }) => {
      if (disposed) return;
      const preset = TIER_PRESETS[startTier as ActiveTier];
      watchdog.setBudget(budgetFor(startTier as ActiveTier));
      handle = createScene(canvas, {
        dprCap: preset.dprCap,
        internalResScale: preset.internalResScale,
        transmission: preset.transmission,
        fpsCap: preset.fpsCap,
        antialias: preset.antialias,
        onFirstFrame: () => setCanvasVisible(true),
        onFrame: (ms: number) => watchdog.sample(ms),
      });
      handle.start();
    });

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setCanvasVisible(false);
      handle?.dispose();
      handle = null;
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    return () => {
      disposed = true;
      canvas.removeEventListener("webglcontextlost", onContextLost);
      handle?.dispose();
    };
  }, [hidden]);

  if (hidden) return null;

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Layer 0 — CSS gradient, covers any PNG letterbox edges. */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(160deg, #080B1A 0%, #0F1535 55%, #080B1A 100%)" }}
      />
      {/* Layer 1 — static PNG fallback, always present. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/background.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      {/* Layer 2 — live WebGL scene, fades in over the PNG once the first frame renders. */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full transition-opacity duration-500"
        style={{ opacity: canvasVisible ? 1 : 0 }}
      />
    </div>
  );
}
