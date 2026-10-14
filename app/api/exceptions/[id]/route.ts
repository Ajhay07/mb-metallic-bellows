import { NextResponse } from "next/server";
import { store } from "@/lib/data/store";
import { notFound } from "@/lib/api/helpers";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const exc = store.exceptions.find((e) => e.id === params.id);
  if (!exc) return notFound("Exception not found");
  return NextResponse.json({ exception: exc });
}
