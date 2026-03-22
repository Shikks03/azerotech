import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const stored = process.env.ADMIN_PASSWORD;

  if (!stored) return NextResponse.json({ success: false }, { status: 500 });

  const a = Buffer.from(password ?? "");
  const b = Buffer.from(stored);
  const match = a.length === b.length && timingSafeEqual(a, b);

  return match
    ? NextResponse.json({ success: true })
    : NextResponse.json({ success: false }, { status: 401 });
}
