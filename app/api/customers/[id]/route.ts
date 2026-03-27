import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/requireAdmin";

const DB = "azerotech";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json();
  const client = await clientPromise;
  const db = client.db(DB);

  let filter: object;
  try {
    filter = { _id: new ObjectId(id) };
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  // H7: Validate name and phone before writing
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length === 0 || body.name.length > 100) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    update.name = body.name.trim();
  }
  if (body.phone !== undefined) {
    if (typeof body.phone !== "string" || !/^09\d{9}$/.test(body.phone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }
    // Check for duplicate phone on a different customer
    const dup = await db.collection("customers").findOne({
      phone: body.phone,
      _id: { $ne: new ObjectId(id) },
    });
    if (dup) return NextResponse.json({ error: "Phone already in use" }, { status: 409 });
    update.phone = body.phone;
  }
  // Dismiss all mismatch warnings
  if (body.dismissMismatches === true) update.nameMismatches = [];

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const result = await db.collection("customers").updateOne(filter, { $set: update });
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
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
  const db = client.db(DB);

  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // S8-8: Check deletedCount before cascading — prevents cascade on non-existent customer
  const deleteResult = await db.collection("customers").deleteOne({ _id: oid });
  if (deleteResult.deletedCount === 0) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Delete service records and unlink appointments/reservations
  await db.collection("serviceRecords").deleteMany({ customerId: id });
  await db.collection("appointments").updateMany({ customerId: id }, { $unset: { customerId: "" } });
  await db.collection("reservations").updateMany({ customerId: id }, { $unset: { customerId: "" } });

  return NextResponse.json({ ok: true });
}
