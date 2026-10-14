// Procurement state machines: Purchase Requisition and Purchase Order lifecycles.
// Every transition is validated here, server-side, against an explicit allowed-
// next-states map — so for example a Rejected requisition can never become
// Approved no matter what the UI sends.
import { store, nextId } from "@/lib/data/store";
import type { AuditEntry, PRStatus, POStatus, Role, PurchaseOrder, PurchaseRequisition } from "@/lib/types";
import { recordMovement } from "./stock";

export const PR_TRANSITIONS: Record<PRStatus, PRStatus[]> = {
  Draft: ["Pending Approval", "Cancelled"],
  "Pending Approval": ["Approved", "Rejected", "Cancelled"],
  Approved: ["Converted", "Cancelled"],
  Rejected: [],
  Converted: [],
  Cancelled: [],
};

export const PO_TRANSITIONS: Record<POStatus, POStatus[]> = {
  Draft: ["Pending Approval", "Cancelled"],
  "Pending Approval": ["Approved", "Rejected", "Cancelled"],
  Approved: ["Ordered", "Cancelled"],
  Rejected: [],
  Ordered: ["Partially Received", "Received", "Cancelled"],
  "Partially Received": ["Received", "Cancelled"],
  Received: ["Closed"],
  Closed: [],
  Cancelled: [],
};

function audit(action: string, byUser: string, byRole: Role, comment?: string): AuditEntry {
  return { id: `AUD-${Date.now()}-${Math.round(Math.random() * 9999)}`, date: new Date().toISOString(), byUser, byRole, action, comment };
}

export interface TransitionResult<T> {
  ok: boolean;
  error?: string;
  entity?: T;
}

export function transitionRequisition(
  prId: string,
  to: PRStatus,
  actor: { user: string; role: Role },
  comment?: string
): TransitionResult<PurchaseRequisition> {
  const pr = store.requisitions.find((p) => p.id === prId);
  if (!pr) return { ok: false, error: "Requisition not found" };
  const allowed = PR_TRANSITIONS[pr.status] ?? [];
  if (!allowed.includes(to)) {
    return { ok: false, error: `Cannot move requisition from "${pr.status}" to "${to}". Allowed: ${allowed.join(", ") || "none (terminal state)"}.` };
  }
  const actionLabel =
    to === "Pending Approval" ? "Submitted for approval" : to === "Approved" ? "Approved" : to === "Rejected" ? "Rejected" : to === "Cancelled" ? "Cancelled" : `Moved to ${to}`;
  pr.status = to;
  pr.history.push(audit(actionLabel, actor.user, actor.role, comment));
  return { ok: true, entity: pr };
}

export function convertRequisitionToPO(
  prId: string,
  supplierId: string,
  unitPrices: Record<string, number>,
  expectedDeliveryDate: string,
  actor: { user: string; role: Role }
): TransitionResult<PurchaseOrder> {
  const pr = store.requisitions.find((p) => p.id === prId);
  if (!pr) return { ok: false, error: "Requisition not found" };
  if (pr.status !== "Approved") return { ok: false, error: `Requisition must be Approved before conversion (currently ${pr.status}).` };

  const newPoId = nextId("PO");
  const po: PurchaseOrder = {
    id: newPoId,
    poNumber: newPoId,
    supplierId,
    sourceRequisitionId: pr.id,
    status: "Draft",
    orderDate: new Date().toISOString(),
    expectedDeliveryDate,
    lines: pr.lines.map((l, i) => ({
      id: `POL-${pr.id}-${i + 1}`,
      materialId: l.materialId,
      orderedQty: l.qty,
      uom: l.uom,
      unitPrice: unitPrices[l.materialId] ?? 0,
      receivedQty: 0,
      acceptedQty: 0,
      rejectedQty: 0,
    })),
    grns: [],
    history: [audit(`Created from requisition ${pr.prNumber}`, actor.user, actor.role)],
  };

  store.purchaseOrders.push(po);
  pr.status = "Converted";
  pr.linkedPoId = po.id;
  pr.history.push(audit(`Converted to Purchase Order ${po.poNumber}`, actor.user, actor.role));
  return { ok: true, entity: po };
}

export function transitionPO(poId: string, to: POStatus, actor: { user: string; role: Role }, comment?: string): TransitionResult<PurchaseOrder> {
  const po = store.purchaseOrders.find((p) => p.id === poId);
  if (!po) return { ok: false, error: "Purchase order not found" };
  const allowed = PO_TRANSITIONS[po.status] ?? [];
  if (!allowed.includes(to)) {
    return { ok: false, error: `Cannot move purchase order from "${po.status}" to "${to}". Allowed: ${allowed.join(", ") || "none (terminal state)"}.` };
  }
  const actionLabel =
    to === "Pending Approval" ? "Submitted for approval" : to === "Approved" ? "Approved" : to === "Rejected" ? "Rejected" : to === "Ordered" ? "Sent to supplier" : to === "Closed" ? "Closed" : to === "Cancelled" ? "Cancelled" : `Moved to ${to}`;
  po.status = to;
  po.history.push(audit(actionLabel, actor.user, actor.role, comment));
  return { ok: true, entity: po };
}

export interface ReceiveLineInput {
  poLineId: string;
  qty: number;
  lotNumber: string;
}

export function receiveGoods(
  poId: string,
  lines: ReceiveLineInput[],
  actor: { user: string; role: Role }
): TransitionResult<PurchaseOrder> {
  const po = store.purchaseOrders.find((p) => p.id === poId);
  if (!po) return { ok: false, error: "Purchase order not found" };
  if (!["Ordered", "Partially Received"].includes(po.status)) {
    return { ok: false, error: `Goods can only be received against an Ordered or Partially Received PO (currently ${po.status}).` };
  }

  const grnNumber = nextId("GRN");
  const grnLines: { poLineId: string; qty: number; lotNumber: string }[] = [];

  for (const input of lines) {
    const line = po.lines.find((l) => l.id === input.poLineId);
    if (!line) continue;
    const remaining = line.orderedQty - line.receivedQty;
    const qty = Math.min(input.qty, Math.max(0, remaining));
    if (qty <= 0) continue;
    line.receivedQty += qty;
    line.acceptedQty += qty; // acceptance is confirmed at inspection; see recordInspection
    grnLines.push({ poLineId: line.id, qty, lotNumber: input.lotNumber });

    const lotId = nextId("LOT");
    store.stockLots.push({
      id: lotId,
      materialId: line.materialId,
      lotNumber: input.lotNumber,
      qty,
      originalQty: qty,
      warehouse: store.materials.find((m) => m.id === line.materialId)?.warehouse ?? "WH-1",
      bin: store.materials.find((m) => m.id === line.materialId)?.bin ?? "RM-A1",
      status: "available",
      inspectionStatus: "pending",
      receivedDate: new Date().toISOString(),
      sourcePoId: po.id,
      sourceGrnId: grnNumber,
    });
    recordMovement({ materialId: line.materialId, lotId, type: "receipt", qty, reference: grnNumber, performedBy: actor.user, note: `GRN against ${po.poNumber}` });
  }

  if (grnLines.length === 0) return { ok: false, error: "No receivable quantity on the supplied lines." };

  po.grns.push({ id: `GRN-REC-${grnNumber}`, grnNumber, date: new Date().toISOString(), lines: grnLines, inspectionStatus: "pending" });

  const fullyReceived = po.lines.every((l) => l.receivedQty >= l.orderedQty);
  po.status = fullyReceived ? "Received" : "Partially Received";
  po.history.push(audit(`Goods Received (${grnNumber})${fullyReceived ? "" : " — partial"}`, actor.user, actor.role));

  return { ok: true, entity: po };
}

export function recordInspection(
  lotId: string,
  result: "passed" | "failed",
  inspector: string,
  remarks: string | undefined
): TransitionResult<PurchaseOrder> {
  const lot = store.stockLots.find((l) => l.id === lotId);
  if (!lot) return { ok: false, error: "Lot not found" };
  lot.inspectionStatus = result;
  if (result === "failed") {
    lot.status = "rejected";
    lot.remarks = remarks ?? lot.remarks;
    recordMovement({ materialId: lot.materialId, lotId: lot.id, type: "reject", qty: -lot.qty, reference: lot.sourceGrnId ?? lot.lotNumber, performedBy: inspector, note: remarks });
    if (lot.sourcePoId) {
      const po = store.purchaseOrders.find((p) => p.id === lot.sourcePoId);
      const line = po?.lines.find((l) => l.materialId === lot.materialId);
      if (po && line) {
        line.acceptedQty = Math.max(0, line.acceptedQty - lot.qty);
        line.rejectedQty += lot.qty;
        po.history.push(audit(`Inspection Failed — lot ${lot.lotNumber} rejected`, inspector, "Quality Inspector", remarks));
      }
    }
  } else {
    lot.status = "available";
    if (lot.sourcePoId) {
      const po = store.purchaseOrders.find((p) => p.id === lot.sourcePoId);
      po?.history.push(audit(`Inspection Passed — lot ${lot.lotNumber} released`, inspector, "Quality Inspector", remarks));
    }
  }
  return { ok: true };
}

export function quarantineLot(lotId: string, reason: string, actor: { user: string; role: Role }): TransitionResult<void> {
  const lot = store.stockLots.find((l) => l.id === lotId);
  if (!lot) return { ok: false, error: "Lot not found" };
  if (lot.status === "rejected") return { ok: false, error: "Lot already rejected; cannot quarantine." };
  lot.status = "quarantined";
  lot.inspectionStatus = "pending";
  lot.remarks = reason;
  recordMovement({ materialId: lot.materialId, lotId: lot.id, type: "quarantine", qty: 0, reference: lot.lotNumber, performedBy: actor.user, note: reason });
  return { ok: true };
}

export function releaseLot(lotId: string, actor: { user: string; role: Role }): TransitionResult<void> {
  const lot = store.stockLots.find((l) => l.id === lotId);
  if (!lot) return { ok: false, error: "Lot not found" };
  if (lot.status !== "quarantined") return { ok: false, error: "Only a quarantined lot can be released." };
  lot.status = "available";
  lot.inspectionStatus = "passed";
  recordMovement({ materialId: lot.materialId, lotId: lot.id, type: "release", qty: 0, reference: lot.lotNumber, performedBy: actor.user, note: "Released from quarantine" });
  return { ok: true };
}
