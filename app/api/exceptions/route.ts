import { NextResponse } from "next/server";
import { getAllExceptionsRanked } from "@/lib/domain/exceptions";
import "@/lib/automation/bootstrap";

export async function GET() {
  return NextResponse.json({ exceptions: getAllExceptionsRanked() });
}
