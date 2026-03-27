import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";

const DB = "azerotech";
const COL = "reservations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;

  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "Invalid reservation ID" }, { status: 400 });
  }

  const body = await req.json();

  // H2: Allowlist permitted fields — prevent overwriting internal fields like _id, customerId
  const ALLOWED = ["status", "pickupDate", "pickupTime", "productName", "productPrice", "name", "phone"] as const;
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

  // H5: Validate numeric fields
  if ("productPrice" in update) {
    const pp = Number(update.productPrice);
    if (!Number.isFinite(pp) || pp < 0) return NextResponse.json({ error: "Invalid productPrice" }, { status: 400 });
    update.productPrice = pp;
  }

  // Validate string length limits
  if ("name" in update && (typeof update.name !== "string" || update.name.trim().length === 0 || update.name.length > 100)) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  if ("phone" in update && (typeof update.phone !== "string" || !/^09\d{9}$/.test(update.phone as string))) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }
  if ("pickupTime" in update && (typeof update.pickupTime !== "string" || update.pickupTime.trim().length === 0 || update.pickupTime.length > 20)) {
    return NextResponse.json({ error: "Invalid pickupTime" }, { status: 400 });
  }
  if ("productName" in update && (typeof update.productName !== "string" || update.productName.trim().length === 0 || update.productName.length > 200)) {
    return NextResponse.json({ error: "Invalid productName" }, { status: 400 });
  }

  // S9-M2: Validate pickupDate format and calendar validity if provided
  if ("pickupDate" in update) {
    const pd = update.pickupDate;
    if (typeof pd !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(pd)) {
      return NextResponse.json({ error: "Invalid pickupDate format" }, { status: 400 });
    }
    const [pdy, pdm, pdd] = pd.split("-").map(Number);
    const parsedPd = new Date(`${pd}T00:00:00`);
    if (
      isNaN(parsedPd.getTime()) ||
      parsedPd.getFullYear() !== pdy ||
      parsedPd.getMonth() + 1 !== pdm ||
      parsedPd.getDate() !== pdd
    ) {
      return NextResponse.json({ error: "Invalid pickupDate" }, { status: 400 });
    }
  }

  const client = await clientPromise;
  const db = client.db(DB);
  const col = db.collection(COL);

  // S8-4: Use findOneAndUpdate for atomicity — eliminates race where two concurrent
  // PATCH-to-Completed requests both read old status and both decrement stock
  const before = await col.findOneAndUpdate(
    { _id: oid },
    { $set: update },
    { returnDocument: "before" }
  );
  if (!before) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  // Stock adjustments — only when status actually changes
  if (update.status && before.status !== update.status) {
    // M5: Prefer numeric productId for stock lookup; fall back to name for legacy reservations
    const productFilter = before.productId != null
      ? { id: before.productId }
      : { name: before.productName };

    if (update.status === "Completed" && !before.stockAdjusted) {
      // S8-10: Only decrement if stock hasn't already been adjusted for this reservation
      const stockResult = await db.collection("products").updateOne(
        { ...productFilter, stock: { $gt: 0 } },
        { $inc: { stock: -1 } }
      );
      if (stockResult.modifiedCount > 0) {
        // Mark the reservation so re-completing doesn't double-decrement
        await col.updateOne({ _id: oid }, { $set: { stockAdjusted: true } });
      }
    } else if (before.status === "Completed" && update.status !== "Completed" && before.stockAdjusted === true) {
      // S9-L5: Only restore stock if stockAdjusted is explicitly true — avoids phantom restore on legacy docs where the field is undefined
      await db.collection("products").updateOne(
        productFilter,
        { $inc: { stock: 1 } }
      );
      await col.updateOne({ _id: oid }, { $set: { stockAdjusted: false } });
    }
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

  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "Invalid reservation ID" }, { status: 400 });
  }

  const client = await clientPromise;
  const result = await client.db(DB).collection(COL).deleteOne({ _id: oid });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
