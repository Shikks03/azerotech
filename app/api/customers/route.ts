import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { DB } from "@/lib/db";
import { parseServiceRecord, type ServiceRecordInput } from "@/lib/serviceRecord";
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

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
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

  // Optional first service record (walk-ins) — validated before anything is written
  let record: ServiceRecordInput | null = null;
  if (body.record !== undefined) {
    const parsed = parseServiceRecord(body.record);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    record = parsed.record;
  }

  const createdAt = new Date().toISOString();
  const doc = {
    name: name.trim(),
    phone,
    type: customerType,
    nameMismatches: [],
    createdAt,
  };
  const result = await db.collection(COL).insertOne(doc);
  const customerId = result.insertedId.toString();

  if (record) {
    try {
      await db.collection("serviceRecords").insertOne({ customerId, ...record, createdAt });
    } catch {
      // Roll back so a retry doesn't hit "Customer with this phone already exists"
      await db.collection(COL).deleteOne({ _id: result.insertedId });
      return NextResponse.json({ error: "Failed to save service record" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, customerId }, { status: 201 });
}
