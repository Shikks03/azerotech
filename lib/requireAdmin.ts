import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyAdminToken } from "./auth";
import clientPromise from "./mongodb";

const DB = "azerotech";
// Methods that mutate state — require X-Requested-With CSRF header
const MUTATION_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

export async function requireAdmin(
  req: NextRequest
): Promise<NextResponse | null> {
  // CSRF: mutation requests must carry custom header.
  // SameSite=Strict blocks cross-site cookie sending; this is defense-in-depth.
  if (MUTATION_METHODS.has(req.method)) {
    const xrw = req.headers.get("X-Requested-With");
    if (xrw !== "XMLHttpRequest") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const token = getTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifyAdminToken(token);
  if (!payload || !payload.jti || payload.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check revocation list
  const client = await clientPromise;
  const revoked = await client
    .db(DB)
    .collection("revoked_sessions")
    .findOne({ jti: payload.jti });

  if (revoked) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null; // authenticated
}
