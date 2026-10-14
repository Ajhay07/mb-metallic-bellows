// In-memory mutable data store for the demo.
//
// PERSISTENCE APPROACH (documented further in README.md): this demo intentionally
// avoids standing up a real database. All seed data lives in lib/data/seed.ts and
// is loaded into module-scoped arrays here at server start. Route handlers under
// app/api/** mutate these arrays through the domain logic in lib/domain/* and
// lib/automation/*, so business rules (stock math, MRP netting, workflow state
// machines, automation evaluation) all run server-side, exactly as they would
// against a real database — only the storage medium differs. Because Next.js
// keeps one Node process per server instance, state survives across requests
// within a running server but resets on restart. A production build would swap
// this module for a Postgres/Prisma (or similar) data access layer without any
// of the calling code in app/api or lib/domain needing to change shape.
import type {
  Material,
  StockLot,
  StockMovement,
  Supplier,
  BOM,
  ProductionOrder,
  PurchaseRequisition,
  PurchaseOrder,
  ExceptionItem,
  AutomationRunRecord,
  ImportBatch,
} from "@/lib/types";
import {
  materials as seedMaterials,
  stockLots as seedLots,
  suppliers as seedSuppliers,
  boms as seedBoms,
  productionOrders as seedProductionOrders,
  requisitions as seedRequisitions,
  purchaseOrders as seedPurchaseOrders,
  seedExceptions,
} from "./seed";

// Deep-clone so repeated dev-server hot reloads (and any future reset endpoint)
// never mutate the literal seed objects themselves.
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

interface Store {
  materials: Material[];
  stockLots: StockLot[];
  stockMovements: StockMovement[];
  suppliers: Supplier[];
  boms: BOM[];
  productionOrders: ProductionOrder[];
  requisitions: PurchaseRequisition[];
  purchaseOrders: PurchaseOrder[];
  exceptions: ExceptionItem[];
  automationRuns: AutomationRunRecord[];
  importBatches: ImportBatch[];
  seq: Record<string, number>;
}

const globalForStore = globalThis as unknown as { __mbStore?: Store };

function buildInitialStore(): Store {
  return {
    materials: clone(seedMaterials),
    stockLots: clone(seedLots),
    stockMovements: [],
    suppliers: clone(seedSuppliers),
    boms: clone(seedBoms),
    productionOrders: clone(seedProductionOrders),
    requisitions: clone(seedRequisitions),
    purchaseOrders: clone(seedPurchaseOrders),
    exceptions: clone(seedExceptions),
    automationRuns: [],
    importBatches: [
      {
        id: "IMP-001",
        fileName: "legacy_material_master_export.csv",
        importedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        importedBy: "Arun Selvaraj",
        recordType: "Materials",
        rowCount: 18,
        validRows: 18,
        errorRows: 0,
        status: "Validated",
        errors: [],
      },
      {
        id: "IMP-002",
        fileName: "supplier_master_q3.csv",
        importedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
        importedBy: "Priya Raman",
        recordType: "Suppliers",
        rowCount: 7,
        validRows: 6,
        errorRows: 1,
        status: "Failed Validation",
        errors: ["Row 5: missing required field 'leadTimeDays' for material link M09"],
      },
    ],
    seq: {},
  };
}

// Reuse the store across hot-reloads in dev; always fresh on a new server process.
export const store: Store = globalForStore.__mbStore ?? (globalForStore.__mbStore = buildInitialStore());

const PAD_LENGTH: Record<string, number> = { LOT: 3, IMP: 3 };

export function nextId(prefix: string): string {
  const key = prefix;
  store.seq[key] = (store.seq[key] ?? 0) + 1;
  const pad = PAD_LENGTH[prefix] ?? 4;
  return `${prefix}-${String(store.seq[key]).padStart(pad, "0")}`;
}

// Reset the demo back to its seed state. Mutates the shared `store` object's
// properties in place (rather than reassigning the `store` binding) so every
// module that imported `store` keeps seeing live data after a reset, same as
// it does across the globalForStore hot-reload trick above. This is a demo
// convenience only — it still has no persistence; it just re-seeds memory.
// Callers that want the Automation Centre's seed run history/exceptions back
// too should call lib/automation/bootstrap's reseed helper right after this
// (kept separate here to avoid a circular import between store <-> rules).
export function resetStore(): void {
  const fresh = buildInitialStore();
  Object.assign(store, fresh);
  store.seq["PR"] = 2006;
  store.seq["PO"] = 3018;
  store.seq["WO"] = 1010;
  store.seq["EXC"] = 9002;
}

// Seed the sequence counters high enough that new IDs never collide with seed IDs.
// Guarded: Next.js dev mode evaluates this module separately for the page/RSC
// compilation and the route-handler compilation. `store` itself is shared across
// both via globalForStore, but without this guard these assignments would run
// again on the second evaluation and silently reset counters already advanced by
// nextId() calls (e.g. the automation bootstrap's auto-drafted requisition),
// producing duplicate IDs across entities. Only set defaults the first time.
if (store.seq["PR"] === undefined) store.seq["PR"] = 2006;
if (store.seq["PO"] === undefined) store.seq["PO"] = 3018;
if (store.seq["WO"] === undefined) store.seq["WO"] = 1010;
if (store.seq["EXC"] === undefined) store.seq["EXC"] = 9002;
store.seq["GRN"] = 5014;
store.seq["LOT"] = 21;
store.seq["IMP"] = 2;
store.seq["RUN"] = 0;
