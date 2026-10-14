import { NextResponse } from "next/server";
import { store } from "@/lib/data/store";

export async function GET() {
  const lastImport = store.importBatches[0] ?? null;
  return NextResponse.json({
    connectionStatus: "Demo Data Mode (Not Connected)",
    erpSystem: "None — synthetic in-memory dataset",
    lastImportAt: lastImport?.importedAt ?? null,
    importBatches: store.importBatches,
    plannedCapabilities: [
      "Live ERP API adapter (e.g. SAP / Oracle / Tally) for materials, suppliers, PO and GRN sync",
      "Scheduled/incremental sync with conflict resolution",
      "Two-way sync (push PO status + GRN confirmations back to source ERP)",
      "Field-level mapping UI between source ERP schema and this system's data model",
    ],
  });
}
