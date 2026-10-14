import { NextResponse } from "next/server";
import { runMRP } from "@/lib/domain/mrp";

export async function GET() {
  return NextResponse.json({ lines: runMRP() });
}
