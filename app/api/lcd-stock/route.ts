import { NextRequest, NextResponse } from "next/server";
import { MongoServerError } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { ensureIndexes } from "@/lib/ensureIndexes";

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

  if (typeof body.name !== "string" || body.name.trim().length === 0 || body.name.length > 200) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  const stock = Number(body.stock);
  if (!Number.isInteger(stock) || stock < 0) {
    return NextResponse.json({ error: "Invalid stock" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db(DB);
  await ensureIndexes(db);
  const col = db.collection(COL);

  let newItem: { id: number; name: string; stock: number } | undefined;
  for (let attempt = 0; attempt < 5; attempt++) {
    const all = await col.find({}).project({ id: 1 }).toArray();
    const maxId = all.length > 0 ? Math.max(...all.map((d) => Number(d.id))) : 0;
    newItem = { id: maxId + 1, name: body.name.trim(), stock };
    try {
      await col.insertOne(newItem);
      break;
    } catch (err) {
      if (err instanceof MongoServerError && err.code === 11000 && attempt < 4) continue;
      throw err;
    }
  }
  return NextResponse.json(newItem, { status: 201 });
}
