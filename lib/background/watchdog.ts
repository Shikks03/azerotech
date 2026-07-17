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
