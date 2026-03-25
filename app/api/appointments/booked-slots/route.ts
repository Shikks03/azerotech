import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  // M6: Validate date format before passing to MongoDB query
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ bookedTimes: [] });
  }

  const client = await clientPromise;
  const db = client.db("azerotech");
  const docs = await db
    .collection("appointments")
    .find({ date, status: { $in: ["Pending", "Confirmed"] } })
    .project({ time: 1, _id: 0 })
    .toArray();

  return NextResponse.json({ bookedTimes: docs.map((d) => d.time) });
}
