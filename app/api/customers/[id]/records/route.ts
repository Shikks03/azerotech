import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { DB } from "@/lib/db";
import { parseServiceRecord } from "@/lib/serviceRecord";
const COL = "serviceRecords";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
  }
  const client = await clientPromise;
  const docs = await client
    .db(DB)
    .collection(COL)
    .find({ customerId: id })
    .sort({ date: -1 })
    .limit(500)
    .toArray();
  return NextResponse.json(docs);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // H8: Validate all fields
  const parsed = parseServiceRecord(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const client = await clientPromise;
  const db = client.db(DB);

  // Validate that the customer actually exists
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });
  }
  const customer = await db.collection("customers").findOne({ _id: oid });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const doc = {
    customerId: id,
    ...parsed.record,
    createdAt: new Date().toISOString(),
  };
  const result = await db.collection(COL).insertOne(doc);
  return NextResponse.json({ ok: true, recordId: result.insertedId.toString() }, { status: 201 });
}
