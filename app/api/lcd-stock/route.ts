import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";

const DB = "azerotech";
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

  const body = await req.json();
  const client = await clientPromise;
  const col = client.db(DB).collection(COL);
  const all = await col.find({}).project({ id: 1 }).toArray();
  const maxId = all.length > 0 ? Math.max(...all.map((d) => Number(d.id))) : 0;
  const newItem = { id: maxId + 1, name: String(body.name).trim(), stock: Number(body.stock ?? 0) };
  await col.insertOne(newItem);
  return NextResponse.json(newItem, { status: 201 });
}
