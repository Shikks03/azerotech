import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getClientIp, isPublicRateLimited } from "@/lib/publicRateLimit";

export async function GET(req: NextRequest) {
  // L-2: Rate limit public booked-slots lookups
  const ip = getClientIp(req);
  const client = await clientPromise;
  const db = client.db("azerotech");
  if (await isPublicRateLimited(db, ip, "booked-slots")) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const date = req.nextUrl.searchParams.get("date");
  // M6: Validate date format before passing to MongoDB query
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ bookedTimes: [] });
  }
  // S9-L9: Calendar roundtrip check — reject overflow dates like 2026-02-30
  const [y, m, d] = date.split("-").map(Number);
  const parsed = new Date(y, m - 1, d);
  if (parsed.getFullYear() !== y || parsed.getMonth() !== m - 1 || parsed.getDate() !== d) {
    return NextResponse.json({ bookedTimes: [] });
  }

  try {
    const docs = await db
      .collection("appointments")
      .find({ date, status: { $in: ["Pending", "Confirmed"] } })
      .project({ time: 1, _id: 0 })
      .toArray();

    return NextResponse.json({ bookedTimes: docs.map((d) => d.time) });
  } catch {
    return NextResponse.json({ bookedTimes: [] }, { status: 500 });
  }
}
