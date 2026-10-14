import { NextResponse } from "next/server";
import { RULE_DEFINITIONS } from "@/lib/automation/rules";

export async function GET() {
  return NextResponse.json({ rules: RULE_DEFINITIONS });
}
