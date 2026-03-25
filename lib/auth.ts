import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

export const COOKIE_NAME = "azerotech_admin_token";
const ALG = "HS256";
const TTL_SECONDS = 60 * 60; // 1 hour

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export interface AdminTokenPayload {
  sub: string;
  jti: string;
  role: "admin";
  iat: number;
  exp: number;
}

const ISSUER = "azerotech-admin";
const AUDIENCE = "azerotech-admin";

export async function signAdminToken(jti: string): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: ALG })
    .setSubject("admin")
    .setJti(jti)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyAdminToken(
  token: string
): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [ALG],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return payload as unknown as AdminTokenPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get(COOKIE_NAME)?.value ?? null;
}

export { TTL_SECONDS };
