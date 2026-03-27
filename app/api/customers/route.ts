import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";

const DB = "azerotech";
const COL = "customers";

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const client = await clientPromise;
  const docs = await client
    .db(DB)
    .collection(COL)
    .find({})
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const body = await req.json();
  const { name, phone } = body;
  if (typeof name !== "string" || name.trim().length === 0 || name.length > 100 || !phone) {
    return NextResponse.json({ error: "name and phone are required" }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db(DB);

  // C2: Validate phone to prevent NoSQL injection
  if (typeof phone !== "string" || !/^09\d{9}$/.test(phone)) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  // Check if customer already exists
  const existing = await db.collection(COL).findOne({ phone });
  if (existing) {
    return NextResponse.json({ error: "Customer with this phone already exists" }, { status: 409 });
  }

  // S5-5: Validate type against allowlist
  const VALID_TYPES = ["walk-in", "appointment", "reservation"];
  const customerType = body.type ?? "walk-in";
  if (!VALID_TYPES.includes(customerType)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const doc = {
    name: name.trim(),
    phone,
    type: customerType,
    nameMismatches: [],
    createdAt: new Date().toISOString(),
  };
  const result = await db.collection(COL).insertOne(doc);
  return NextResponse.json({ ok: true, customerId: result.insertedId.toString() }, { status: 201 });
}
