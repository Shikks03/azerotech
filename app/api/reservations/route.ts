import { NextRequest, NextResponse } from "next/server";
import { MongoServerError } from "mongodb";
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
  if (await isPublicRateLimited(db, ip, "reservations")) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

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
  const productId: unknown = body.productId;

  // M5: Validate productId if provided — must be a positive integer
  if (productId !== undefined && productId !== null) {
    if (typeof productId !== "number" || !Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json({ error: "productId must be a positive integer" }, { status: 400 });
    }
  }

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
  // S9-L8: Reject astronomically large values — cap at ₱1,000,000
  if (parsedPrice > 1_000_000) {
    return NextResponse.json({ error: "Invalid productPrice" }, { status: 400 });
  }

  // S5-7: Validate pickupDate is a real calendar date within 1–180 days server-side
  const [pdYear, pdMonth, pdDay] = (pickupDate as string).split("-").map(Number);
  const parsedPickupDate = new Date(`${pickupDate}T00:00:00`);
  if (
    isNaN(parsedPickupDate.getTime()) ||
    parsedPickupDate.getFullYear() !== pdYear ||
    parsedPickupDate.getMonth() + 1 !== pdMonth ||
    parsedPickupDate.getDate() !== pdDay
  ) {
    return NextResponse.json({ error: "Invalid pickup date" }, { status: 400 });
  }
  const todayRes = new Date();
  todayRes.setHours(0, 0, 0, 0);
  const minPickup = new Date(todayRes); minPickup.setDate(todayRes.getDate() + 1);
  const maxPickup = new Date(todayRes); maxPickup.setDate(todayRes.getDate() + 180);
  if (parsedPickupDate < minPickup || parsedPickupDate > maxPickup) {
    return NextResponse.json({ error: "Pickup date must be 1–180 days from today" }, { status: 400 });
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
    // S9-L6: Wrap insertOne to handle E11000 from concurrent same-phone requests
    try {
      const result = await db.collection("customers").insertOne({
        name: submittedName,
        phone,
        type: "reservation",
        nameMismatches: [],
        createdAt: now.toISOString(),
      });
      customerId = result.insertedId.toString();
    } catch (err) {
      if (err instanceof MongoServerError && err.code === 11000) {
        // Race: another concurrent request created this customer between our findOne and insertOne
        const raceCustomer = await db.collection("customers").findOne({ phone });
        if (!raceCustomer) {
          return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
        }
        customerId = raceCustomer._id.toString();
      } else {
        throw err;
      }
    }
  }

  const doc = {
    name: submittedName,
    phone,
    pickupDate: String(pickupDate),
    pickupTime: String(pickupTime),
    productName: String(productName),
    productPrice: parsedPrice,
    ...(productId != null ? { productId: productId as number } : {}),
    status: "Pending",
    submittedAt: now.toISOString(),
    ...(customerId ? { customerId } : {}),
  };
  await db.collection(COL).insertOne(doc);
  return NextResponse.json({ ok: true }, { status: 201 });
}
