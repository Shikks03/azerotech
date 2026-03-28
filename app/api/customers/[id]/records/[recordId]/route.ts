import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { DB } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id, recordId } = await params;
  const client = await clientPromise;

  let oid: ObjectId;
  try {
    oid = new ObjectId(recordId);
  } catch {
    return NextResponse.json({ error: "Invalid recordId" }, { status: 400 });
  }

  // M3: Include customerId in filter to prevent IDOR (a record can only be deleted by its owner's customer route)
  // S8-9: Check deletedCount — returns 404 if record not found or belongs to a different customer
  const result = await client.db(DB).collection("serviceRecords").deleteOne({ _id: oid, customerId: id });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Service record not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
