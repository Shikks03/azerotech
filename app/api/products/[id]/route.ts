import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { DB } from "@/lib/db";
import { deleteImageIfUnused, isValidImageRef } from "@/lib/productImages";
import { parseProductPrice } from "@/lib/productPrice";
const COL = "products";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = await req.json();

  // H2: Allowlist permitted fields
  const ALLOWED = ["name", "price", "category", "image", "stock"] as const;
  const update: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) update[key] = body[key];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // H5: Validate numeric fields
  if ("price" in update) {
    const p = parseProductPrice(update.price);
    if (p === null) return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    update.price = p;
  }
  if ("stock" in update) {
    const s = Number(update.stock);
    if (!Number.isInteger(s) || s < 0) return NextResponse.json({ error: "Invalid stock" }, { status: 400 });
    update.stock = s;
  }

  // Validate string length limits
  if ("name" in update && (typeof update.name !== "string" || update.name.trim().length === 0 || update.name.length > 200)) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  if ("category" in update && (typeof update.category !== "string" || update.category.trim().length === 0 || update.category.length > 100)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if ("image" in update) {
    if (typeof update.image !== "string" || !isValidImageRef(update.image.trim())) {
      return NextResponse.json({ error: "Invalid image" }, { status: 400 });
    }
    update.image = update.image.trim();
  }

  const client = await clientPromise;
  const db = client.db(DB);
  const before = await db
    .collection(COL)
    .findOneAndUpdate({ id: numericId }, { $set: update }, { returnDocument: "before" });
  if (!before) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  if ("image" in update && before.image !== update.image) {
    await deleteImageIfUnused(db, before.image);
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
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db(DB);
  const deleted = await db.collection(COL).findOneAndDelete({ id: numericId });
  if (!deleted) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  await deleteImageIfUnused(db, deleted.image);
  return NextResponse.json({ ok: true });
}
