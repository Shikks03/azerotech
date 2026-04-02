import { NextRequest, NextResponse } from "next/server";
import { MongoServerError } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { DB } from "@/lib/db";
const COL = "lcd_stock";

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const client = await clientPromise;
  const docs = await client.db(DB).collection(COL).find({}).sort({ id: 1 }).limit(500).toArray();
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // phone_brand: required, string, 1–100 chars
  if (typeof body.phone_brand !== "string" || body.phone_brand.trim().length === 0 || body.phone_brand.trim().length > 100) {
    return NextResponse.json({ error: "Invalid phone_brand" }, { status: 400 });
  }
  // lcd_brand: required, string, 1–100 chars
  if (typeof body.lcd_brand !== "string" || body.lcd_brand.trim().length === 0 || body.lcd_brand.trim().length > 100) {
    return NextResponse.json({ error: "Invalid lcd_brand" }, { status: 400 });
  }
  // stock: required, integer >= 0
  const stock = Number(body.stock);
  if (!Number.isInteger(stock) || stock < 0) {
    return NextResponse.json({ error: "Invalid stock" }, { status: 400 });
  }

  // compatible_models: optional, array of strings each 1–100 chars, max 50 items
  const compatible_models: string[] = [];
  if (body.compatible_models !== undefined) {
    if (!Array.isArray(body.compatible_models) || body.compatible_models.length > 50) {
      return NextResponse.json({ error: "Invalid compatible_models" }, { status: 400 });
    }
    for (const m of body.compatible_models) {
      if (typeof m !== "string" || m.trim().length === 0 || m.trim().length > 100) {
        return NextResponse.json({ error: "Invalid compatible_models entry" }, { status: 400 });
      }
      compatible_models.push(m.trim());
    }
  }

  // anna_price / marlon_price: optional, integer >= 0 or null
  let anna_price: number | null = null;
  if (body.anna_price !== undefined && body.anna_price !== null) {
    const ap = Number(body.anna_price);
    if (!Number.isInteger(ap) || ap < 0) {
      return NextResponse.json({ error: "Invalid anna_price" }, { status: 400 });
    }
    anna_price = ap;
  }
  let marlon_price: number | null = null;
  if (body.marlon_price !== undefined && body.marlon_price !== null) {
    const mp = Number(body.marlon_price);
    if (!Number.isInteger(mp) || mp < 0) {
      return NextResponse.json({ error: "Invalid marlon_price" }, { status: 400 });
    }
    marlon_price = mp;
  }

  const phone_brand = body.phone_brand.trim();
  const lcd_brand = body.lcd_brand.trim();
  const name = `${phone_brand} ${lcd_brand}`.trim();

  const client = await clientPromise;
  const db = client.db(DB);
  await ensureIndexes(db);
  const col = db.collection(COL);

  let newItem: {
    id: number; name: string; phone_brand: string; lcd_brand: string;
    compatible_models: string[]; anna_price: number | null; marlon_price: number | null; stock: number;
  } | undefined;
  for (let attempt = 0; attempt < 5; attempt++) {
    const all = await col.find({}).project({ id: 1 }).toArray();
    const maxId = all.length > 0 ? Math.max(...all.map((d) => Number(d.id))) : 0;
    newItem = { id: maxId + 1, name, phone_brand, lcd_brand, compatible_models, anna_price, marlon_price, stock };
    try {
      await col.insertOne(newItem);
      break;
    } catch (err) {
      if (err instanceof MongoServerError && err.code === 11000 && attempt < 4) continue;
      throw err;
    }
  }
  if (!newItem) {
    return NextResponse.json({ error: "Failed to create LCD item after retries" }, { status: 500 });
  }
  return NextResponse.json(newItem, { status: 201 });
}
