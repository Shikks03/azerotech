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
 *
 * Atomic design: a single findOneAndUpdate performs the $pull (evict expired
 * timestamps) and $push (record this request) in one round-trip, eliminating
 * the TOCTOU race that existed between the old findOne + updateOne/insertOne
 * pattern. The limit check runs on the returned post-update array length.
 */
export async function isPublicRateLimited(db: Db, ip: string, endpoint: string): Promise<boolean> {
  const col = db.collection("public_rate_limits");
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);

  // Single atomic operation:
  //   1. $pull — remove timestamps outside the current sliding window
  //   2. $push — append the current timestamp
  // upsert: true creates the document on first request for this IP+endpoint.
  // returnDocument: "after" gives us the state after both mutations.
  // Use aggregation pipeline update (MongoDB 4.2+) to $pull and $push the same
  // field atomically — regular update operators conflict on the same path.
  const updated = await col.findOneAndUpdate(
    { key: `${ip}:${endpoint}` },
    [
      {
        $set: {
          requests: {
            $filter: {
              input: { $ifNull: ["$requests", []] },
              cond: { $gte: ["$$this", windowStart] },
            },
          },
        },
      },
      { $set: { requests: { $concatArrays: ["$requests", [now]] } } },
    ],
    { upsert: true, returnDocument: "after" }
  );

  const count = updated?.requests?.length ?? 1;
  return count > MAX_PER_WINDOW;
}
