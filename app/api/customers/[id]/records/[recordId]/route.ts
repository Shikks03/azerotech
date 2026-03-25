import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/requireAdmin";

const DB = "azerotech";

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
  await client.db(DB).collection("serviceRecords").deleteOne({ _id: oid, customerId: id });
  return NextResponse.json({ ok: true });
}
