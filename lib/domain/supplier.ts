// Supplier performance and the "demo risk score". All inputs are computed from
// the purchase-order / GRN history so the numbers on the supplier profile page
// always match the underlying PO records.
import { store } from "@/lib/data/store";
import type { PurchaseOrder, Supplier } from "@/lib/types";

export interface SupplierDeliveryRecord {
  po: PurchaseOrder;
  expectedDate: string;
  resolvedDate: string | null; // date of last GRN if received, else null (still open)
  onTime: boolean | null; // null = still open / not yet resolved
  daysLateOrOverdue: number; // 0 if on time; positive if late (closed) or currently overdue (open)
  stillOpen: boolean;
}

export function getSupplierPOs(supplierId: string): PurchaseOrder[] {
  return store.purchaseOrders
    .filter((po) => po.supplierId === supplierId)
    .sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());
}

export function getDeliveryRecords(supplierId: string): SupplierDeliveryRecord[] {
  return getSupplierPOs(supplierId).map((po) => {
    const expected = new Date(po.expectedDeliveryDate).getTime();
    const lastGrn = po.grns.length ? po.grns[po.grns.length - 1] : null;
    const closedOrReceived = ["Closed", "Received"].includes(po.status);
    const stillOpen = !closedOrReceived;
    let onTime: boolean | null = null;
    let daysLateOrOverdue = 0;
    let resolvedDate: string | null = null;

    if (!stillOpen && lastGrn) {
      resolvedDate = lastGrn.date;
      const resolved = new Date(lastGrn.date).getTime();
      onTime = resolved <= expected;
      daysLateOrOverdue = Math.max(0, Math.round((resolved - expected) / 86400000));
    } else if (stillOpen) {
      const overdue = expected < Date.now();
      onTime = overdue ? false : null; // not yet due = not evaluable
      daysLateOrOverdue = overdue ? Math.floor((Date.now() - expected) / 86400000) : 0;
    }

    return { po, expectedDate: po.expectedDeliveryDate, resolvedDate, onTime, daysLateOrOverdue, stillOpen };
  });
}

export interface SupplierPerformance {
  supplier: Supplier;
  totalOrders: number;
  evaluableOrders: number; // orders where on-time/late could be determined
  onTimeCount: number;
  lateCount: number;
  onTimeDeliveryPct: number; // all-time
  recentOnTimeDeliveryPct: number; // last 3 evaluable orders — used to show a trend
  openOverdueCount: number;
  rejectionRatePct: number;
  totalUnitsReceived: number;
  totalUnitsRejected: number;
  records: SupplierDeliveryRecord[];
}

export function computeSupplierPerformance(supplierId: string): SupplierPerformance {
  const supplier = store.suppliers.find((s) => s.id === supplierId);
  if (!supplier) throw new Error(`Unknown supplier ${supplierId}`);
  const records = getDeliveryRecords(supplierId);
  const evaluable = records.filter((r) => r.onTime !== null);
  const onTimeCount = evaluable.filter((r) => r.onTime).length;
  const lateCount = evaluable.filter((r) => !r.onTime).length;
  const onTimeDeliveryPct = evaluable.length ? Math.round((onTimeCount / evaluable.length) * 1000) / 10 : 100;

  const recent = evaluable.slice(-3);
  const recentOnTime = recent.filter((r) => r.onTime).length;
  const recentOnTimeDeliveryPct = recent.length ? Math.round((recentOnTime / recent.length) * 1000) / 10 : 100;

  const openOverdueCount = records.filter((r) => r.stillOpen && r.onTime === false).length;

  let totalUnitsReceived = 0;
  let totalUnitsRejected = 0;
  for (const po of getSupplierPOs(supplierId)) {
    for (const line of po.lines) {
      totalUnitsReceived += line.receivedQty;
      totalUnitsRejected += line.rejectedQty;
    }
  }
  const rejectionRatePct = totalUnitsReceived > 0 ? Math.round((totalUnitsRejected / totalUnitsReceived) * 1000) / 10 : 0;

  return {
    supplier,
    totalOrders: records.length,
    evaluableOrders: evaluable.length,
    onTimeCount,
    lateCount,
    onTimeDeliveryPct,
    recentOnTimeDeliveryPct,
    openOverdueCount,
    rejectionRatePct,
    totalUnitsReceived,
    totalUnitsRejected,
    records,
  };
}

export interface SupplierRiskScore {
  score: number; // 0 (low risk) - 100 (high risk)
  band: "Low" | "Moderate" | "Elevated" | "High";
  inputs: {
    label: string;
    value: string;
    contribution: number;
    weightExplanation: string;
  }[];
}

// DEMO RISK SCORE — a transparent, deterministic formula over observable PO
// history. This is explicitly NOT a real credit/financial risk product; it
// exists to demonstrate how a risk indicator could be built from ERP data,
// with every input shown on the supplier page.
export function computeSupplierRiskScore(supplierId: string): SupplierRiskScore {
  const perf = computeSupplierPerformance(supplierId);

  const latePenalty = Math.round(45 * (1 - perf.recentOnTimeDeliveryPct / 100));
  const rejectionPenalty = Math.round(Math.min(25, perf.rejectionRatePct * 5));
  const overduePenalty = Math.min(20, perf.openOverdueCount * 10);
  const trendPenalty =
    perf.recentOnTimeDeliveryPct < perf.onTimeDeliveryPct - 10 ? 10 : perf.recentOnTimeDeliveryPct < perf.onTimeDeliveryPct ? 5 : 0;

  const score = Math.max(0, Math.min(100, latePenalty + rejectionPenalty + overduePenalty + trendPenalty));
  const band: SupplierRiskScore["band"] = score >= 60 ? "High" : score >= 35 ? "Elevated" : score >= 15 ? "Moderate" : "Low";

  return {
    score,
    band,
    inputs: [
      {
        label: "Recent on-time delivery (last 3 orders)",
        value: `${perf.recentOnTimeDeliveryPct}%`,
        contribution: latePenalty,
        weightExplanation: "45 × (1 − recent on-time rate)",
      },
      {
        label: "Rejection rate (units rejected / received)",
        value: `${perf.rejectionRatePct}%`,
        contribution: rejectionPenalty,
        weightExplanation: "min(25, rejection% × 5)",
      },
      {
        label: "Currently overdue open orders",
        value: `${perf.openOverdueCount}`,
        contribution: overduePenalty,
        weightExplanation: "min(20, overdue orders × 10)",
      },
      {
        label: "Performance trend (recent vs all-time on-time %)",
        value: `${perf.recentOnTimeDeliveryPct}% vs ${perf.onTimeDeliveryPct}% all-time`,
        contribution: trendPenalty,
        weightExplanation: "+10 if declining >10pts, +5 if declining, else 0",
      },
    ],
  };
}

export function syncSupplierSummaryFields() {
  for (const supplier of store.suppliers) {
    const perf = computeSupplierPerformance(supplier.id);
    supplier.onTimeDeliveryPct = perf.onTimeDeliveryPct;
    supplier.rejectionRatePct = perf.rejectionRatePct;
    supplier.totalOrders = perf.totalOrders;
  }
}
