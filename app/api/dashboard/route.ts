import { NextResponse } from "next/server";
import { computeDashboard } from "@/lib/domain/dashboard";
import { store } from "@/lib/data/store";
import { getAllExceptionsRanked } from "@/lib/domain/exceptions";
import "@/lib/automation/bootstrap";

export async function GET() {
  const dashboard = computeDashboard();
  const exceptionQueue = getAllExceptionsRanked().filter((e) => e.status === "Open" || e.status === "Acknowledged").slice(0, 8);
  const schedule = [...store.productionOrders]
    .sort((a, b) => new Date(a.plannedStart).getTime() - new Date(b.plannedStart).getTime())
    .slice(0, 10);
  const lastAutomationRun = store.automationRuns[0] ?? null;

  return NextResponse.json({ ...dashboard, exceptionQueue, schedule, lastAutomationRun });
}
