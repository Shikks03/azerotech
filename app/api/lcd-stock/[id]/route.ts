import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";

const DB = "azerotech";
const COL = "lcd_stock";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json();

  // H2: Allowlist permitted fields
  const ALLOWED = ["name", "stock"] as const;
  const update: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) update[key] = body[key];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // H5 + L7: Validate field types and numeric ranges
  if ("name" in update) {
    if (typeof update.name !== "string" || (update.name as string).trim().length === 0) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    update.name = (update.name as string).trim();
  }
  if ("stock" in update) {
    const s = Number(update.stock);
    if (!Number.isInteger(s) || s < 0) return NextResponse.json({ error: "Invalid stock" }, { status: 400 });
    update.stock = s;
  }

  const client = await clientPromise;
  await client
    .db(DB)
    .collection(COL)
    .updateOne({ id: Number(id) }, { $set: update });
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
  await client.db(DB).collection(COL).deleteOne({ id: Number(id) });
  return NextResponse.json({ ok: true });
}
