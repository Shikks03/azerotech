import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { DB } from "@/lib/db";
const COL = "lcd_stock";

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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const ALLOWED = ["phone_brand", "lcd_brand", "compatible_models", "anna_price", "marlon_price", "stock"] as const;
  const update: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) update[key] = body[key];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Validate each field if present
  if ("phone_brand" in update) {
    if (typeof update.phone_brand !== "string" || (update.phone_brand as string).trim().length === 0 || (update.phone_brand as string).trim().length > 100) {
      return NextResponse.json({ error: "Invalid phone_brand" }, { status: 400 });
    }
    update.phone_brand = (update.phone_brand as string).trim();
  }
  if ("lcd_brand" in update) {
    if (typeof update.lcd_brand !== "string" || (update.lcd_brand as string).trim().length === 0 || (update.lcd_brand as string).trim().length > 100) {
      return NextResponse.json({ error: "Invalid lcd_brand" }, { status: 400 });
    }
    update.lcd_brand = (update.lcd_brand as string).trim();
  }
  if ("compatible_models" in update) {
    const cm = update.compatible_models;
    if (!Array.isArray(cm) || (cm as unknown[]).length > 50) {
      return NextResponse.json({ error: "Invalid compatible_models" }, { status: 400 });
    }
    const cleaned: string[] = [];
    for (const m of cm as unknown[]) {
      if (typeof m !== "string" || (m as string).trim().length === 0 || (m as string).trim().length > 100) {
        return NextResponse.json({ error: "Invalid compatible_models entry" }, { status: 400 });
      }
      cleaned.push((m as string).trim());
    }
    update.compatible_models = cleaned;
  }
  if ("anna_price" in update) {
    if (update.anna_price !== null) {
      const ap = Number(update.anna_price);
      if (!Number.isInteger(ap) || ap < 0) {
        return NextResponse.json({ error: "Invalid anna_price" }, { status: 400 });
      }
      update.anna_price = ap;
    }
  }
  if ("marlon_price" in update) {
    if (update.marlon_price !== null) {
      const mp = Number(update.marlon_price);
      if (!Number.isInteger(mp) || mp < 0) {
        return NextResponse.json({ error: "Invalid marlon_price" }, { status: 400 });
      }
      update.marlon_price = mp;
    }
  }
  if ("stock" in update) {
    const s = Number(update.stock);
    if (!Number.isInteger(s) || s < 0) {
      return NextResponse.json({ error: "Invalid stock" }, { status: 400 });
    }
    update.stock = s;
  }

  // Derive name if phone_brand or lcd_brand is being updated
  const client = await clientPromise;
  const col = client.db(DB).collection(COL);

  if ("phone_brand" in update || "lcd_brand" in update) {
    const existing = await col.findOne({ id: numericId });
    const resolved_phone = ((update.phone_brand ?? existing?.phone_brand ?? "") as string).trim();
    const resolved_lcd   = ((update.lcd_brand   ?? existing?.lcd_brand   ?? "") as string).trim();
    update.name = `${resolved_phone} ${resolved_lcd}`.trim();
  }

  const result = await col.updateOne({ id: numericId }, { $set: update });
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "LCD stock item not found" }, { status: 404 });
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
  const result = await client.db(DB).collection(COL).deleteOne({ id: numericId });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "LCD stock item not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
