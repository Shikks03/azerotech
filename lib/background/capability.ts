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
