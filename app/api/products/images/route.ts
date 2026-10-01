import { NextRequest, NextResponse } from "next/server";
import { Binary } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { DB } from "@/lib/db";
import { IMAGES_COL, IMAGE_PATH_PREFIX, MAX_IMAGE_BYTES, sniffImageType } from "@/lib/productImages";

/** Upload a product image. Body is the raw image bytes (JPEG, PNG or WebP). */
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await req.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (bytes.length === 0) {
    return NextResponse.json({ error: "Empty image" }, { status: 400 });
  }
  if (bytes.length > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image too large (max 500 KB after resizing)" }, { status: 413 });
  }

  const contentType = sniffImageType(bytes);
  if (!contentType) {
    return NextResponse.json({ error: "Unsupported image type (use JPEG, PNG or WebP)" }, { status: 400 });
  }

  const client = await clientPromise;
  const result = await client.db(DB).collection(IMAGES_COL).insertOne({
    data: new Binary(bytes),
    contentType,
    size: bytes.length,
    createdAt: new Date(),
  });

  return NextResponse.json({ url: `${IMAGE_PATH_PREFIX}${result.insertedId.toString()}` }, { status: 201 });
}
