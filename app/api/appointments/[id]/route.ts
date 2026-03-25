import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";

const DB = "azerotech";
const COL = "appointments";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json();

  // H2: Allowlist permitted fields — prevent overwriting internal fields like _id, customerId
  const ALLOWED = ["status", "date", "time", "service", "brand", "deviceType", "name", "phone", "problem"] as const;
  const update: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) update[key] = body[key];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // M6: Validate status against known enum
  const VALID_STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"];
  if ("status" in update && !VALID_STATUSES.includes(update.status as string)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const client = await clientPromise;
  const result = await client.db(DB).collection(COL).updateOne({ appointmentId: id }, { $set: update });
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  const client = await clientPromise;
  const result = await client.db(DB).collection(COL).deleteOne({ appointmentId: id });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
