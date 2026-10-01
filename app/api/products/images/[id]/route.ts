import { NextRequest, NextResponse } from "next/server";
import { ObjectId, type Binary } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { DB } from "@/lib/db";
import { IMAGES_COL } from "@/lib/productImages";

/** Public: serve an uploaded product image. Images are immutable (a new upload gets a new id). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const client = await clientPromise;
  const doc = await client.db(DB).collection(IMAGES_COL).findOne({ _id: new ObjectId(id) });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = (doc.data as Binary).buffer;
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": doc.contentType as string,
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
