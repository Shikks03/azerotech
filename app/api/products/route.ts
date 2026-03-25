import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";

const DB = "azerotech";
const COL = "products";

export async function GET() {
  const client = await clientPromise;
  const docs = await client
    .db(DB)
    .collection(COL)
    .find({})
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

  const client = await clientPromise;
  const col = client.db(DB).collection(COL);
  const all = await col.find({}).project({ id: 1 }).toArray();
  const maxId = all.length > 0 ? Math.max(...all.map((d) => Number(d.id))) : 0;
  const newProduct = {
    name: name.trim(),
    price: priceNum,
    category: category.trim(),
    image: typeof image === "string" ? image.trim() : "",
    stock: stockNum,
    id: maxId + 1,
  };
  await col.insertOne(newProduct);
  return NextResponse.json(newProduct, { status: 201 });
}
