import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { DB } from "@/lib/db";
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
    const p = Number(update.price);
    if (!Number.isFinite(p) || p < 0) return NextResponse.json({ error: "Invalid price" }, { status: 400 });
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
  if ("image" in update && (typeof update.image !== "string" || update.image.length > 500)) {
    return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  }

  const client = await clientPromise;
  const result = await client
    .db(DB)
    .collection(COL)
    .updateOne({ id: numericId }, { $set: update });
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
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
  const result = await client
    .db(DB)
    .collection(COL)
    .deleteOne({ id: numericId });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
