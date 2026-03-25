import { NextRequest, NextResponse } from "next/server";
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

  const client = await clientPromise;
  const db = client.db(DB);

  const reservation = await db.collection(COL).findOne({ id });
  await db.collection(COL).updateOne({ id }, { $set: update });

  if (update.status && reservation && reservation.status !== update.status) {
    // M5: Prefer numeric productId for stock lookup; fall back to name for legacy reservations
    const productFilter = reservation.productId != null
      ? { id: reservation.productId }
      : { name: reservation.productName };

    if (update.status === "Completed") {
      await db.collection("products").updateOne(
        { ...productFilter, stock: { $gt: 0 } },
        { $inc: { stock: -1 } }
      );
    } else if (reservation.status === "Completed") {
      // No upper bound on stock — pre-existing behaviour; admin-only action.
      await db.collection("products").updateOne(
        productFilter,
        { $inc: { stock: 1 } }
      );
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
  const client = await clientPromise;
  await client.db(DB).collection(COL).deleteOne({ id });
  return NextResponse.json({ ok: true });
}
