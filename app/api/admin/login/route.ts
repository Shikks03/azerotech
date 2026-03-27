import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { signAdminToken, COOKIE_NAME, TTL_SECONDS } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

const DB = "azerotech";
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(req: NextRequest): string {
  // H1: x-real-ip is set by the reverse proxy and cannot be spoofed by clients.
  // x-forwarded-for comes first only as last resort since any client can forge it.
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  // C4: CSRF defense — must carry custom header
  if (req.headers.get("X-Requested-With") !== "XMLHttpRequest") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // M7: Always track attempts for all IPs, including "unknown" (shared bucket).
  // This is preferable to allowing unlimited brute-force from unproxied deployments.
  const ip = getClientIp(req);
  const client = await clientPromise;
  const attempts = client.db(DB).collection("login_attempts");

  // Check rate limit
  const record = await attempts.findOne({ ip });
  if (record?.lockUntil && new Date(record.lockUntil) > new Date()) {
    const remaining = Math.ceil(
      (new Date(record.lockUntil).getTime() - Date.now()) / 1000 / 60
    );
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${remaining} minutes.` },
      { status: 429 }
    );
  }

  const { password } = await req.json();
  const hashEncoded = process.env.ADMIN_PASSWORD_HASH;
  if (!hashEncoded) return NextResponse.json({ success: false }, { status: 500 });
  // Hash is stored as base64 to prevent Next.js from expanding $ signs in .env files
  const hash = Buffer.from(hashEncoded, "base64").toString();
  // S5-10: Ensure the decoded value is a real bcrypt hash — misconfigured env fails fast
  if (!hash.startsWith("$2b$") && !hash.startsWith("$2a$")) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  // H2: Increment counter atomically before bcrypt to prevent race-condition bypass
  const updated = await attempts.findOneAndUpdate(
    { ip },
    {
      $inc: { attempts: 1 },
      $set: { ip, lastAttempt: new Date() },
    },
    { upsert: true, returnDocument: "after" }
  );
  const newCount = updated?.attempts ?? 1;

  // Lock if threshold exceeded
  if (newCount >= MAX_ATTEMPTS) {
    await attempts.updateOne(
      { ip, lockUntil: { $exists: false } },
      { $set: { lockUntil: new Date(Date.now() + LOCK_DURATION_MS) } }
    );
    console.warn(`[auth] IP ${ip} locked after ${MAX_ATTEMPTS} failed attempts`);
    return NextResponse.json(
      { error: `Too many attempts. Try again in 15 minutes.` },
      { status: 429 }
    );
  }

  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const match = await bcrypt.compare(password, hash);

  if (!match) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  // Success — reset counter but preserve document to maintain lockout continuity
  await attempts.updateOne({ ip }, { $set: { attempts: 0, lockUntil: null } });

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
