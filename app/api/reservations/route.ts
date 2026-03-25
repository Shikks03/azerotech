import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { getClientIp, isPublicRateLimited } from "@/lib/publicRateLimit";

const DB = "azerotech";
const COL = "reservations";

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const client = await clientPromise;
  const docs = await client
    .db(DB)
    .collection(COL)
    .find({})
    .sort({ submittedAt: -1 })
    .limit(500)
    .toArray();
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  // C4: Rate limit public submissions — 20 per 10 minutes per IP
  const ip = getClientIp(req);
  const client = await clientPromise;
  const db = client.db(DB);
  if (await isPublicRateLimited(db, ip)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const body = await req.json();

  // C2: Validate phone to prevent NoSQL injection
  const phone: unknown = body.phone;
  if (typeof phone !== "string" || !/^09\d{9}$/.test(phone)) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  // C1 + H5: Destructure only expected fields, validate types and lengths
  const name: unknown = body.name;
  const pickupDate: unknown = body.pickupDate;
  const pickupTime: unknown = body.pickupTime;
  const productName: unknown = body.productName;
  const productPrice: unknown = body.productPrice;

  if (
    typeof name !== "string" || name.trim().length === 0 || name.length > 100 ||
    typeof pickupDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(pickupDate) ||
    typeof pickupTime !== "string" || pickupTime.trim().length === 0 || pickupTime.length > 20 ||
    typeof productName !== "string" || productName.trim().length === 0 || productName.length > 200
  ) {
    return NextResponse.json({ error: "Invalid or missing fields" }, { status: 400 });
  }
  const parsedPrice = Number(productPrice);
  if (productPrice == null || !isFinite(parsedPrice) || parsedPrice < 0) {
    return NextResponse.json({ error: "Invalid product price" }, { status: 400 });
  }

  const now = new Date();

  // Find or create customer
  const submittedName = String(name).trim();
  let customerId: string | undefined;

  const existing = await db.collection("customers").findOne({ phone });
  if (existing) {
    customerId = existing._id.toString();
    if (submittedName.toLowerCase() !== (existing.name as string).trim().toLowerCase()) {
      await db.collection("customers").updateOne(
        { _id: existing._id },
        {
          $push: {
            nameMismatches: {
              $each: [{ submittedName, date: now.toISOString() }],
              $slice: -50,
            },
          } as never,
        }
      );
    }
  } else {
    const result = await db.collection("customers").insertOne({
      name: submittedName,
      phone,
      type: "reservation",
      nameMismatches: [],
      createdAt: now.toISOString(),
    });
    customerId = result.insertedId.toString();
  }

  const doc = {
    name: submittedName,
    phone,
    pickupDate: String(pickupDate),
    pickupTime: String(pickupTime),
    productName: String(productName),
    productPrice: parsedPrice,
    status: "Pending",
    submittedAt: now.toISOString(),
    ...(customerId ? { customerId } : {}),
  };
  await db.collection(COL).insertOne(doc);
  return NextResponse.json({ ok: true }, { status: 201 });
}
