/**
 * Product prices are stored as display strings ("₱450") — the admin form sends that
 * shape and the accessories page renders and parses it. Accepts "₱450", "₱1,200",
 * "450" or 450, and returns the canonical "₱<number>" string, or null if invalid.
 */
export function parseProductPrice(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const raw = typeof value === "number" ? String(value) : value.replace(/[₱,\s]/g, "");
  if (raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) return null;
  return `₱${n}`;
}
