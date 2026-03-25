import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { MongoServerError } from "mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { signAdminToken, getTokenFromRequest, verifyAdminToken, COOKIE_NAME, TTL_SECONDS } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

const DB = "azerotech";

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  // H3: Revoke old JTI atomically — unique index on jti prevents two concurrent refreshes
  // from both succeeding (second insert gets E11000, returns 409)
  const oldToken = getTokenFromRequest(req);
  if (oldToken) {
    const oldPayload = await verifyAdminToken(oldToken);
    if (oldPayload?.jti) {
      const client = await clientPromise;
      // Ensure unique index exists (idempotent)
      await client.db(DB).collection("revoked_sessions").createIndex({ jti: 1 }, { unique: true });
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
  const isProd = process.env.NODE_ENV === "production";

  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: isProd,
    path: "/",
    maxAge: TTL_SECONDS,
  });
  return res;
}
