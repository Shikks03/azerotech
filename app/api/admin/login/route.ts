import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { signAdminToken, COOKIE_NAME, TTL_SECONDS } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { getClientIp } from "@/lib/publicRateLimit";
import { DB } from "@/lib/db";
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

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
  if (record?.lockUntil) {
    if (new Date(record.lockUntil) > new Date()) {
      const remaining = Math.ceil(
        (new Date(record.lockUntil).getTime() - Date.now()) / 1000 / 60
      );
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${remaining} minutes.`, lockedUntil: record.lockUntil },
        { status: 429 }
      );
    } else {
      // Lock expired — reset so they start fresh
      await attempts.updateOne({ ip }, { $unset: { lockUntil: "" }, $set: { attempts: 0 } });
    }
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

  // S-I1: Validate password type before incrementing attempt counter — prevents wasting
  // lockout quota by sending non-string bodies without a real password attempt
  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
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

  const match = await bcrypt.compare(password, hash);

  if (!match) {
    return NextResponse.json({ attemptsUsed: newCount, maxAttempts: MAX_ATTEMPTS }, { status: 401 });
  }

  // Success — only clear lockUntil; preserve attempts count for shared-NAT scenarios
  // S-I2: resetting attempts: 0 allowed shared-NAT attackers to indefinitely prevent lockout
  await attempts.updateOne({ ip }, { $unset: { lockUntil: "" } });

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
