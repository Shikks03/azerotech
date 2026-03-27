import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";

const DB = "azerotech";
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
  const body = await req.json();
  const { date, service, device, cost, notes } = body;

  // H8: Validate all fields
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (typeof service !== "string" || service.trim().length === 0 || service.length > 200) {
    return NextResponse.json({ error: "Invalid service" }, { status: 400 });
  }
  if (typeof device !== "string" || device.trim().length === 0 || device.length > 200) {
    return NextResponse.json({ error: "Invalid device" }, { status: 400 });
  }
  const costNum = Number(cost ?? 0);
  if (!Number.isFinite(costNum) || costNum < 0) {
    return NextResponse.json({ error: "Invalid cost" }, { status: 400 });
  }
  if (notes !== undefined && (typeof notes !== "string" || notes.length > 2000)) {
    return NextResponse.json({ error: "Notes too long (max 2000 chars)" }, { status: 400 });
  }

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
    date,
    service: service.trim(),
    device: device.trim(),
    cost: costNum,
    notes: typeof notes === "string" ? notes : "",
    createdAt: new Date().toISOString(),
  };
  const result = await db.collection(COL).insertOne(doc);
  return NextResponse.json({ ok: true, recordId: result.insertedId.toString() }, { status: 201 });
}
