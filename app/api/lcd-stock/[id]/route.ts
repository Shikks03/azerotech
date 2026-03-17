import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const DB = "azerotech";
const COL = "lcd_stock";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const client = await clientPromise;
  await client
    .db(DB)
    .collection(COL)
    .updateOne({ id: Number(id) }, { $set: body });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = await clientPromise;
  await client.db(DB).collection(COL).deleteOne({ id: Number(id) });
  return NextResponse.json({ ok: true });
}
