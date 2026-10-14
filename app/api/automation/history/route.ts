import { NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import "@/lib/automation/bootstrap";

export async function GET() {
  return NextResponse.json({ runs: store.automationRuns });
}
