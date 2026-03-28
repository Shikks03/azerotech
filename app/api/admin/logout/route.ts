import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { DB } from "@/lib/db";

export async function POST(req: NextRequest) {
  // C4: CSRF defense — must carry custom header
  if (req.headers.get("X-Requested-With") !== "XMLHttpRequest") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // H6: Only revoke if token is valid — prevents flooding revoked_sessions with
  // unauthenticated requests. Cookie is always cleared regardless.
  const token = getTokenFromRequest(req);
  if (token) {
    const payload = await verifyAdminToken(token);
    if (payload?.jti) {
      const client = await clientPromise;
      try {
        await client.db(DB).collection("revoked_sessions").insertOne({
          jti: payload.jti,
          expiresAt: new Date(payload.exp * 1000),
          revokedAt: new Date(),
        });
        console.warn(`[auth] Session ${payload.jti} revoked`);
      } catch {
        // Ignore duplicate jti (e.g. concurrent logout)
      }
    }
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
