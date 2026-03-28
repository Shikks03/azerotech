import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { MongoServerError } from "mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { signAdminToken, getTokenFromRequest, verifyAdminToken, COOKIE_NAME, TTL_SECONDS } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { DB } from "@/lib/db";

export async function POST(req: NextRequest) {
  // B-1: CSRF defense — must carry custom header (same check as login/logout)
  if (req.headers.get("X-Requested-With") !== "XMLHttpRequest") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const authError = await requireAdmin(req);
  if (authError) return authError;

  // H3: Revoke old JTI atomically — unique index on jti prevents two concurrent refreshes
  // from both succeeding (second insert gets E11000, returns 409)
  const oldToken = getTokenFromRequest(req);
  if (oldToken) {
    const oldPayload = await verifyAdminToken(oldToken);
    if (oldPayload?.jti) {
      const client = await clientPromise;
      // S9-M5: Indexes ensured once at startup, not on every request
      await ensureIndexes(client.db(DB));
      try {
        await client.db(DB).collection("revoked_sessions").insertOne({
          jti: oldPayload.jti,
          expiresAt: new Date(oldPayload.exp * 1000),
          revokedAt: new Date(),
        });
      } catch (err) {
        if (err instanceof MongoServerError && err.code === 11000) {
          // Another concurrent refresh already revoked this token — reject this request
          return NextResponse.json({ error: "Concurrent refresh rejected" }, { status: 409 });
        }
        throw err;
      }
    }
  }

  const jti = randomUUID();
  const token = await signAdminToken(jti);

  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    path: "/",
    maxAge: TTL_SECONDS,
  });
  return res;
}
