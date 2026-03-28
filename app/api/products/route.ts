import { NextRequest, NextResponse } from "next/server";
import { MongoServerError } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { DB } from "@/lib/db";
const COL = "products";

export async function GET(req: NextRequest) {
  // B-3: Strip stock from public responses — admins still receive full data
  const isAdmin = !(await requireAdmin(req));
  const client = await clientPromise;
  const docs = await client
    .db(DB)
    .collection(COL)
    .find({})
    .project(isAdmin ? { _id: 0 } : { _id: 0, stock: 0 })
    .sort({ id: 1 })
    .limit(500)
    .toArray();
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const body = await req.json();

  // H4: Explicit allowlist — never spread body directly into DB
  const { name, price, category, image, stock } = body;
  if (typeof name !== "string" || name.trim().length === 0 || name.length > 200) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum < 0) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }
  if (typeof category !== "string" || category.trim().length === 0 || category.length > 100) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  const stockNum = Number(stock ?? 0);
  if (!Number.isInteger(stockNum) || stockNum < 0) {
    return NextResponse.json({ error: "Invalid stock" }, { status: 400 });
  }

  if (image !== undefined && image !== "" && (typeof image !== "string" || image.length > 500)) {
    return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db(DB);
  await ensureIndexes(db);
  const col = db.collection(COL);

  let newProduct: Record<string, unknown> | undefined;
  for (let attempt = 0; attempt < 5; attempt++) {
    const all = await col.find({}).project({ id: 1 }).toArray();
    const maxId = all.length > 0 ? Math.max(...all.map((d) => Number(d.id))) : 0;
    newProduct = {
      name: name.trim(),
      price: priceNum,
      category: category.trim(),
      image: typeof image === "string" ? image.trim() : "",
      stock: stockNum,
      id: maxId + 1,
    };
    try {
      await col.insertOne(newProduct as Parameters<typeof col.insertOne>[0]);
      break;
    } catch (err) {
      if (err instanceof MongoServerError && err.code === 11000 && attempt < 4) continue;
      throw err;
    }
  }
  if (!newProduct) {
    return NextResponse.json({ error: "Failed to create product after retries" }, { status: 500 });
  }
  return NextResponse.json(newProduct, { status: 201 });
}
