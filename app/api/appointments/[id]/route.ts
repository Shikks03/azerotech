import { NextRequest, NextResponse } from "next/server";
import { MongoServerError } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { VALID_STATUSES } from "@/lib/constants";
import { DB } from "@/lib/db";
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
  const ALLOWED = ["status", "date", "time", "service", "brand", "deviceType", "name", "phone", "problem", "repairStage"] as const;
  const update: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) update[key] = body[key];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // M6: Validate status against known enum
  if ("status" in update && !VALID_STATUSES.includes(update.status as never)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Validate repairStage against known enum
  const VALID_REPAIR_STAGES: (string | null)[] = ["Device Received", "Waiting for Parts", "Fixing", "Ready for Pickup", null];
  if ("repairStage" in update && !VALID_REPAIR_STAGES.includes(update.repairStage as string | null)) {
    return NextResponse.json({ error: "Invalid repairStage" }, { status: 400 });
  }

  // S5-2: Validate string length limits on free-text fields
  if ("name" in update && (typeof update.name !== "string" || update.name.trim().length === 0 || update.name.length > 100)) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  if ("phone" in update && (typeof update.phone !== "string" || !/^09\d{9}$/.test(update.phone as string))) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }
  if ("time" in update && (typeof update.time !== "string" || update.time.trim().length === 0 || update.time.length > 20)) {
    return NextResponse.json({ error: "Invalid time" }, { status: 400 });
  }
  if ("service" in update && (typeof update.service !== "string" || update.service.trim().length === 0 || update.service.length > 100)) {
    return NextResponse.json({ error: "Invalid service" }, { status: 400 });
  }
  if ("brand" in update && (typeof update.brand !== "string" || update.brand.trim().length === 0 || update.brand.length > 100)) {
    return NextResponse.json({ error: "Invalid brand" }, { status: 400 });
  }
  if ("deviceType" in update && (typeof update.deviceType !== "string" || update.deviceType.trim().length === 0 || update.deviceType.length > 100)) {
    return NextResponse.json({ error: "Invalid deviceType" }, { status: 400 });
  }
  if ("problem" in update && update.problem !== null && update.problem !== undefined) {
    if (typeof update.problem !== "string" || update.problem.length > 1000) {
      return NextResponse.json({ error: "Invalid problem description" }, { status: 400 });
    }
  }

  // S9-M1: Validate date format and calendar validity if provided
  if ("date" in update) {
    const d = update.date;
    if (typeof d !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }
    const [dy, dm, dd] = d.split("-").map(Number);
    const parsed = new Date(`${d}T00:00:00`);
    if (
      isNaN(parsed.getTime()) ||
      parsed.getFullYear() !== dy ||
      parsed.getMonth() + 1 !== dm ||
      parsed.getDate() !== dd
    ) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
  }

  const client = await clientPromise;
  try {
    const result = await client.db(DB).collection(COL).updateOne({ appointmentId: id }, { $set: update });
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof MongoServerError && err.code === 11000) {
      if (err.keyPattern && "date_1_time_1" in err.keyPattern) {
        return NextResponse.json({ error: "This slot is already booked" }, { status: 409 });
      }
      if (err.keyPattern && "appointmentId_1" in err.keyPattern) {
        return NextResponse.json({ error: "Appointment ID conflict" }, { status: 409 });
      }
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
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
