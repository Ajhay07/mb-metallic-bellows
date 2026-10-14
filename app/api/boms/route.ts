import { NextResponse } from "next/server";
import { store } from "@/lib/data/store";

export async function GET() {
  return NextResponse.json({ boms: store.boms });
}
