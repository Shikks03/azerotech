import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getClientIp, isPublicRateLimited } from "@/lib/publicRateLimit";

const DB = "azerotech";
const COL = "appointments";

const SAFE_PROJECTION = {
  _id: 0,
  appointmentId: 1,
  service: 1,
  brand: 1,
  deviceType: 1,
  date: 1,
  status: 1,
  repairStage: 1,
};

export async function GET(req: NextRequest) {
  const client = await clientPromise;
  const db = client.db(DB);

  // S5-9/S8-2: Rate limit all IPs — unknown IPs share a bucket (acceptable; S8-3 enumeration mitigated by rate limit)
  const ip = getClientIp(req);
  if (await isPublicRateLimited(db, ip, "repair-status")) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;
  const appointmentId = searchParams.get("appointmentId");
  const phone = searchParams.get("phone");

  // Require at least one param
  if (!appointmentId && !phone) {
    return NextResponse.json({ error: "Provide appointmentId or phone" }, { status: 400 });
  }

  // Validate appointmentId format if provided
  if (appointmentId && !/^AZT-\d{6}-[0-9a-f]{6}$/i.test(appointmentId)) {
    return NextResponse.json({ error: "Invalid appointmentId format" }, { status: 400 });
  }

  // Validate phone format if provided (and no appointmentId)
  if (!appointmentId && phone && !/^09\d{9}$/.test(phone)) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  const col = db.collection(COL);
  let doc;

  if (appointmentId) {
    // Exact match by appointmentId
    doc = await col.findOne({ appointmentId }, { projection: SAFE_PROJECTION });
  } else {
    // Most recent active appointment for this phone
    // Note: findOne() does not accept a sort option in the MongoDB Node.js driver.
    // Use find().sort().limit(1).next() to guarantee the most recent result.
    doc = await col
      .find({ phone, status: { $in: ["Pending", "Confirmed"] } })
      .sort({ submittedAt: -1 })
      .limit(1)
      .project(SAFE_PROJECTION)
      .next();
  }

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(doc);
}
