import { Db } from "mongodb";
import { NextRequest } from "next/server";

// C4: IP-based rate limiting for public POST endpoints
const MAX_PER_WINDOW = 20;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

/**
 * Returns true if the IP has exceeded the rate limit.
 * Uses a sliding window stored in the `public_rate_limits` collection.
 */
export async function isPublicRateLimited(db: Db, ip: string): Promise<boolean> {
  const col = db.collection("public_rate_limits");
  const now = new Date();

  const record = await col.findOne({ ip });

  // No record, or window has expired — start a fresh window
  if (!record || now.getTime() - new Date(record.windowStart).getTime() > WINDOW_MS) {
    await col.updateOne(
      { ip },
      { $set: { ip, count: 1, windowStart: now } },
      { upsert: true }
    );
    return false; // allowed
  }

  const updated = await col.findOneAndUpdate(
    { ip },
    { $inc: { count: 1 } },
    { returnDocument: "after" }
  );

  return (updated?.count ?? 1) > MAX_PER_WINDOW;
}
