import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { MongoServerError } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { getClientIp, isPublicRateLimited } from "@/lib/publicRateLimit";

const DB = "azerotech";
const COL = "appointments";

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
  const date: unknown = body.date;
  const time: unknown = body.time;
  const service: unknown = body.service;
  const brand: unknown = body.brand;
  const deviceType: unknown = body.deviceType;
  const problem: unknown = body.problem;

  if (
    typeof name !== "string" || name.trim().length === 0 || name.length > 100 ||
    typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    typeof time !== "string" || time.trim().length === 0 || time.length > 20 ||
    typeof service !== "string" || service.trim().length === 0 || service.length > 100 ||
    typeof brand !== "string" || brand.trim().length === 0 || brand.length > 100 ||
    typeof deviceType !== "string" || deviceType.trim().length === 0 || deviceType.length > 100
  ) {
    return NextResponse.json({ error: "Invalid or missing fields" }, { status: 400 });
  }
  if (problem !== undefined && (typeof problem !== "string" || problem.length > 1000)) {
    return NextResponse.json({ error: "Invalid problem description" }, { status: 400 });
  }

  // M2: Server-side date bounds — must be 1–60 days from today
  const parsedDate = new Date(`${date}T00:00:00`);
  if (isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today); minDate.setDate(today.getDate() + 1);
  const maxDate = new Date(today); maxDate.setDate(today.getDate() + 60);
  if (parsedDate < minDate || parsedDate > maxDate) {
    return NextResponse.json({ error: "Date must be 1–60 days from today" }, { status: 400 });
  }

  const now = new Date();

  // M4: Prevent double-booking at API level
  const conflict = await db.collection(COL).findOne({
    date: String(date),
    time: String(time),
    status: { $in: ["Pending", "Confirmed"] },
  });
  if (conflict) {
    return NextResponse.json({ error: "This time slot is already booked" }, { status: 409 });
  }

  // Find or create customer
  const submittedName = String(name).trim();
  let customerId: string | undefined;

  const existing = await db.collection("customers").findOne({ phone });
  if (existing) {
    customerId = existing._id.toString();
    // Check name mismatch (case-insensitive)
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
    // Create new customer
    const result = await db.collection("customers").insertOne({
      name: submittedName,
      phone,
      type: "appointment",
      nameMismatches: [],
      createdAt: now.toISOString(),
    });
    customerId = result.insertedId.toString();
  }

  // M3: Ensure unique index exists, use 6-char hex suffix (16M values/day), retry on collision
  await db.collection(COL).createIndex({ appointmentId: 1 }, { unique: true });

  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  let appointmentId = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    appointmentId = `AZT-${yy}${mm}${dd}-${randomBytes(3).toString("hex")}`;
    const doc = {
      appointmentId,
      name: submittedName,
      phone,
      date: String(date),
      time: String(time),
      service: String(service),
      brand: String(brand),
      deviceType: String(deviceType),
      ...(problem ? { problem: String(problem).trim() } : {}),
      status: "Pending",
      submittedAt: now.toISOString(),
      ...(customerId ? { customerId } : {}),
    };
    try {
      await db.collection(COL).insertOne(doc);
      break;
    } catch (err) {
      if (err instanceof MongoServerError && err.code === 11000 && attempt < 4) continue;
      throw err;
    }
  }
  return NextResponse.json({ ok: true, appointmentId }, { status: 201 });
}
