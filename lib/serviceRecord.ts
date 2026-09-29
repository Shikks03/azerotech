/** Staff who can be credited with a walk-in repair. */
export const TECHNICIANS = ["Gerald", "Joan", "JR", "G/J"] as const;
export type Technician = (typeof TECHNICIANS)[number];

export interface ServiceRecordInput {
  date: string;
  device: string;
  problem: string;
  cost: number;
  repairedBy: Technician;
  notes: string;
}

/**
 * Validates a walk-in service record payload.
 * Returns the cleaned record, or an error message.
 */
export function parseServiceRecord(
  body: unknown
): { ok: true; record: ServiceRecordInput } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Invalid service record" };
  const { date, device, problem, cost, repairedBy, notes } = body as Record<string, unknown>;

  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: "Invalid date" };
  }
  if (typeof device !== "string" || device.trim().length === 0 || device.length > 200) {
    return { ok: false, error: "Invalid device model" };
  }
  if (typeof problem !== "string" || problem.trim().length === 0 || problem.length > 1000) {
    return { ok: false, error: "Invalid problem" };
  }
  const costNum = Number(cost);
  if (cost === "" || cost === null || cost === undefined || !Number.isFinite(costNum) || costNum < 0) {
    return { ok: false, error: "Invalid price" };
  }
  if (typeof repairedBy !== "string" || !(TECHNICIANS as readonly string[]).includes(repairedBy)) {
    return { ok: false, error: "Invalid technician" };
  }
  if (notes !== undefined && (typeof notes !== "string" || notes.length > 2000)) {
    return { ok: false, error: "Notes too long (max 2000 chars)" };
  }

  return {
    ok: true,
    record: {
      date,
      device: device.trim(),
      problem: problem.trim(),
      cost: costNum,
      repairedBy: repairedBy as Technician,
      notes: typeof notes === "string" ? notes.trim() : "",
    },
  };
}
