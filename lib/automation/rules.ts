// Deterministic, server-side automation rule evaluators.
//
// Every rule here is a plain function over the seeded dataset: no ML, no
// opaque scoring — just thresholds and arithmetic you can read below and see
// reflected exactly in the Automation Centre UI. "Run Checks Now" (see
// app/api/automation/run/route.ts) calls runAllRules(), which evaluates each
// enabled rule, upserts matching rows into the Exceptions inbox, and (for the
// reorder-recommendation rule only) creates or refreshes a DRAFT requisition
// that a human must still review and submit — it is never auto-submitted.
import { store, nextId } from "@/lib/data/store";
import { computeMaterialStock } from "@/lib/domain/stock";
import { runMRP } from "@/lib/domain/mrp";
import { computeProductionReadiness } from "@/lib/domain/production";
import { getOpenPurchaseOrderLinesForMaterial } from "@/lib/domain/stock";
import type {
  AutomationRuleDefinition,
  AutomationRunRecord,
  AutomationRuleResult,
  ExceptionItem,
  ExceptionSeverity,
  Role,
} from "@/lib/types";

export const RULE_DEFINITIONS: AutomationRuleDefinition[] = [
  {
    id: "predictive-shortage",
    name: "Predictive Material Shortage Alerts",
    description:
      "Runs the MRP net-requirement calculation for every material against all open production orders and raises an alert wherever available stock plus confirmed incoming quantity will not cover the gross requirement.",
    trigger: "Run Checks Now, or scheduled (every MRP-relevant change in a real deployment)",
    conditionSummary: "netRequirement = max(0, grossRequirement − availableQty − incomingQty) > 0",
    actionSummary: "Creates/updates a Critical–Low severity Inventory exception linking the material, the shortfall, and every affected production order.",
    severity: "Critical",
    enabled: true,
  },
  {
    id: "reorder-recommendation",
    name: "Reorder Recommendations",
    description:
      "Flags any material whose on-hand + incoming quantity has fallen below its reorder point, and drafts (but never submits) a purchase requisition sized to bring stock back to reorder point + safety stock.",
    trigger: "Run Checks Now, or scheduled (e.g. nightly in a real deployment)",
    conditionSummary: "onHand + incomingQty < reorderPoint",
    actionSummary: "Creates/updates a Draft requisition (status always Draft) and a matching Procurement exception. A human must review and submit it.",
    severity: "Medium",
    enabled: true,
  },
  {
    id: "supplier-delay-detection",
    name: "Supplier Delay Detection",
    description: "Scans open purchase orders (Ordered / Partially Received) for expected delivery dates that have already passed.",
    trigger: "Run Checks Now, or scheduled (daily in a real deployment)",
    conditionSummary: "PO.status in [Ordered, Partially Received] AND expectedDeliveryDate < today",
    actionSummary: "Creates/updates a Supplier exception sized by days overdue, recommending expediting or escalation to the supplier.",
    severity: "High",
    enabled: true,
  },
  {
    id: "production-readiness",
    name: "Production Readiness Checks",
    description:
      "Checks every Not Started or On Hold production order's material readiness (including quarantine holds) and raises an exception for any order that cannot start cleanly.",
    trigger: "Run Checks Now, or scheduled (on every stock/production change in a real deployment)",
    conditionSummary: "Order status in [Not Started, On Hold] AND computeProductionReadiness(order).ready === false",
    actionSummary: "Creates/updates a Production exception naming the blocking materials and shortfall quantities, severity scaled by order priority.",
    severity: "High",
    enabled: true,
  },
  {
    id: "approval-escalation",
    name: "Approval Escalation (SLA Breach)",
    description: "Flags purchase requisitions and purchase orders that have sat in Pending Approval beyond the approval SLA.",
    trigger: "Run Checks Now, or scheduled (hourly in a real deployment)",
    conditionSummary: "status === 'Pending Approval' AND hoursSinceRequestDate > SLA (24h for requisitions, 48h for purchase orders)",
    actionSummary: "Creates/updates a Procurement exception recommending the request be approved, rejected, or reassigned.",
    severity: "High",
    enabled: true,
  },
];

function severityRank(s: ExceptionSeverity): number {
  return { Critical: 4, High: 3, Medium: 2, Low: 1 }[s];
}

function upsertException(
  input: Omit<ExceptionItem, "id" | "createdAt" | "updatedAt" | "status" | "history"> & { dedupeKey: string }
): { created: boolean } {
  const existing = store.exceptions.find((e) => e.sourceRuleId === input.sourceRuleId && e.affectedEntity.id === input.affectedEntity.id && e.affectedEntity.type === input.affectedEntity.type);

  if (existing) {
    const changed = existing.description !== input.description || existing.severity !== input.severity;
    existing.description = input.description;
    existing.severity = input.severity;
    existing.recommendedAction = input.recommendedAction;
    existing.deadline = input.deadline;
    existing.title = input.title;
    existing.updatedAt = new Date().toISOString();
    if (existing.status === "Dismissed" || existing.status === "Resolved") {
      // A resolved/dismissed issue that is detected again is reopened — the
      // underlying condition still exists in the data.
      existing.status = "Open";
    }
    if (changed) {
      existing.history.push({
        id: `AUD-${Date.now()}-${Math.round(Math.random() * 9999)}`,
        date: new Date().toISOString(),
        byUser: "Automation Engine",
        byRole: "Administrator",
        action: "Re-evaluated by rule — details updated",
      });
    }
    return { created: false };
  }

  const exc: ExceptionItem = {
    id: nextId("EXC"),
    category: input.category,
    severity: input.severity,
    title: input.title,
    description: input.description,
    recommendedAction: input.recommendedAction,
    owner: input.owner,
    status: "Open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deadline: input.deadline,
    affectedEntity: input.affectedEntity,
    sourceRuleId: input.sourceRuleId,
    history: [
      {
        id: `AUD-${Date.now()}-${Math.round(Math.random() * 9999)}`,
        date: new Date().toISOString(),
        byUser: "Automation Engine",
        byRole: "Administrator" as Role,
        action: "Created by automation rule",
      },
    ],
  };
  store.exceptions.push(exc);
  return { created: true };
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

function runPredictiveShortage(): AutomationRuleResult {
  let created = 0;
  let updated = 0;
  const messages: string[] = [];
  const mrp = runMRP().filter((l) => l.isShortage);

  for (const line of mrp) {
    const until = line.requiredByDate ? daysUntil(line.requiredByDate) : 999;
    const severity: ExceptionSeverity = until <= 5 ? "Critical" : until <= 10 ? "High" : until <= 20 ? "Medium" : "Low";
    const affectedOrders = Array.from(new Set(line.demands.map((d) => d.productionOrder.woNumber))).join(", ");
    const { created: wasCreated } = upsertException({
      dedupeKey: line.materialId,
      category: "Inventory",
      severity,
      title: `Material shortage forecast: ${line.materialCode}`,
      description: `MRP shows a net shortfall of ${line.netRequirement} ${line.uom} for ${line.materialName} (${line.materialCode}). Gross requirement ${line.grossRequirement} ${line.uom} vs. available ${line.availableQty} ${line.uom} + confirmed incoming ${line.incomingQty} ${line.uom}. Affects production order(s): ${affectedOrders}. Required by ${line.requiredByDate ? new Date(line.requiredByDate).toLocaleDateString("en-IN") : "unscheduled"}.`,
      recommendedAction: `Raise or expedite a purchase order for at least ${line.suggestedPurchaseQty} ${line.uom} of ${line.materialCode}, or re-sequence the affected production orders.`,
      owner: "Store/Inventory Manager",
      affectedEntity: { type: "material", id: line.materialId, label: line.materialCode, href: `/mrp?material=${line.materialId}` },
      sourceRuleId: "predictive-shortage",
      deadline: line.requiredByDate ?? undefined,
    });
    if (wasCreated) created++;
    else updated++;
    messages.push(`${line.materialCode}: net shortfall ${line.netRequirement} ${line.uom} (${severity})`);
  }

  return { ruleId: "predictive-shortage", ruleName: "Predictive Material Shortage Alerts", severity: "Critical", findingsCount: mrp.length, newExceptions: created, updatedExceptions: updated, messages };
}

function runReorderRecommendation(): AutomationRuleResult {
  let created = 0;
  let updated = 0;
  let prCreated = 0;
  let prUpdated = 0;
  const messages: string[] = [];

  const flagged = store.materials.filter((m) => {
    const stock = computeMaterialStock(m.id);
    return stock.onHand + stock.incomingQty < m.reorderPoint;
  });

  for (const material of flagged) {
    const stock = computeMaterialStock(material.id);
    const target = material.reorderPoint + material.safetyStock;
    const suggestedQty = Math.max(0, Math.round(target - stock.onHand - stock.incomingQty));
    if (suggestedQty <= 0) continue;

    const existingDraftPR = store.requisitions.find(
      (pr) => pr.sourceRuleId === "reorder-recommendation" && pr.status === "Draft" && pr.lines.some((l) => l.materialId === material.id)
    );

    if (existingDraftPR) {
      existingDraftPR.lines[0].qty = suggestedQty;
      existingDraftPR.history.push({
        id: `AUD-${Date.now()}-${Math.round(Math.random() * 9999)}`,
        date: new Date().toISOString(),
        byUser: "Automation Engine",
        byRole: "Administrator",
        action: "Draft quantity refreshed on re-run",
        comment: `Recalculated suggested quantity: ${suggestedQty} ${material.uom}.`,
      });
      prUpdated++;
    } else {
      const newPrId = nextId("PR");
      store.requisitions.push({
        id: newPrId,
        prNumber: newPrId,
        title: `${material.name} replenishment (auto-recommended)`,
        requestedBy: "Priya Raman",
        requestedByRole: "Procurement Manager",
        requestDate: new Date().toISOString(),
        status: "Draft",
        priority: stock.availableQty <= 0 ? "High" : "Medium",
        lines: [{ id: `PRL-AUTO-${material.id}`, materialId: material.id, qty: suggestedQty, uom: material.uom, neededByDate: new Date(Date.now() + material.leadTimeDays * 86400000).toISOString() }],
        history: [
          {
            id: `AUD-${Date.now()}-${Math.round(Math.random() * 9999)}`,
            date: new Date().toISOString(),
            byUser: "Automation Engine",
            byRole: "Administrator",
            action: "Draft created by rule: Reorder Recommendation",
            comment: `On-hand (${stock.onHand}) + incoming (${stock.incomingQty}) is below the reorder point (${material.reorderPoint}).`,
          },
        ],
        sourceRuleId: "reorder-recommendation",
        justification: `Automation Centre rule 'Reorder Recommendation' detected on-hand + incoming stock below the reorder point. Draft quantity brings stock back to reorder point + safety stock (${target} ${material.uom}). Review and submit for approval.`,
      });
      prCreated++;
    }

    const { created: wasCreated } = upsertException({
      dedupeKey: material.id,
      category: "Procurement",
      severity: "Medium",
      title: `Reorder recommended: ${material.code}`,
      description: `${material.name} is below its reorder point (on-hand ${stock.onHand} + incoming ${stock.incomingQty} < reorder point ${material.reorderPoint} ${material.uom}). A draft requisition for ${suggestedQty} ${material.uom} has been prepared for review.`,
      recommendedAction: `Review and submit the draft requisition for ${suggestedQty} ${material.uom} of ${material.code}.`,
      owner: "Procurement Manager",
      affectedEntity: { type: "material", id: material.id, label: material.code, href: `/materials/${material.id}` },
      sourceRuleId: "reorder-recommendation",
    });
    if (wasCreated) created++;
    else updated++;
    messages.push(`${material.code}: ${existingDraftPR ? "draft requisition refreshed" : "draft requisition created"} for ${suggestedQty} ${material.uom}`);
  }

  return {
    ruleId: "reorder-recommendation",
    ruleName: "Reorder Recommendations",
    severity: "Medium",
    findingsCount: flagged.length,
    newExceptions: created,
    updatedExceptions: updated,
    messages: [...messages, `Requisitions: ${prCreated} created, ${prUpdated} updated`],
  };
}

function runSupplierDelayDetection(): AutomationRuleResult {
  let created = 0;
  let updated = 0;
  const messages: string[] = [];
  const overduePOs = store.purchaseOrders.filter((po) => ["Ordered", "Partially Received"].includes(po.status) && new Date(po.expectedDeliveryDate).getTime() < Date.now());

  for (const po of overduePOs) {
    const daysOverdue = Math.floor((Date.now() - new Date(po.expectedDeliveryDate).getTime()) / 86400000);
    const supplier = store.suppliers.find((s) => s.id === po.supplierId);
    const severity: ExceptionSeverity = daysOverdue >= 7 ? "Critical" : daysOverdue >= 3 ? "High" : "Medium";
    const materialNames = po.lines.map((l) => store.materials.find((m) => m.id === l.materialId)?.code ?? l.materialId).join(", ");

    const { created: wasCreated } = upsertException({
      dedupeKey: po.id,
      category: "Supplier",
      severity,
      title: `Overdue delivery: ${po.poNumber} (${supplier?.name ?? po.supplierId})`,
      description: `${po.poNumber} to ${supplier?.name ?? po.supplierId} for ${materialNames} was expected ${new Date(po.expectedDeliveryDate).toLocaleDateString("en-IN")} and is now ${daysOverdue} day(s) overdue (status: ${po.status}).`,
      recommendedAction: `Contact ${supplier?.name ?? "the supplier"} for a firm revised ETA and expedite; consider an alternate source if the delay continues.`,
      owner: "Procurement Manager",
      affectedEntity: { type: "purchaseOrder", id: po.id, label: po.poNumber, href: `/procurement/purchase-orders/${po.id}` },
      sourceRuleId: "supplier-delay-detection",
      deadline: po.expectedDeliveryDate,
    });
    if (wasCreated) created++;
    else updated++;
    messages.push(`${po.poNumber}: ${daysOverdue} day(s) overdue (${severity})`);
  }

  return { ruleId: "supplier-delay-detection", ruleName: "Supplier Delay Detection", severity: "High", findingsCount: overduePOs.length, newExceptions: created, updatedExceptions: updated, messages };
}

function runProductionReadiness(): AutomationRuleResult {
  let created = 0;
  let updated = 0;
  const messages: string[] = [];
  const candidates = store.productionOrders.filter((wo) => wo.status === "Not Started" || wo.status === "On Hold");

  for (const wo of candidates) {
    const readiness = computeProductionReadiness(wo);
    if (readiness.ready) continue;

    const until = daysUntil(wo.plannedStart);
    const basePriority = wo.priority === "Critical" ? 3 : wo.priority === "High" ? 2 : wo.priority === "Medium" ? 1 : 0;
    const urgency = until <= 3 ? 3 : until <= 7 ? 2 : until <= 14 ? 1 : 0;
    const combined = basePriority + urgency;
    const severity: ExceptionSeverity = combined >= 5 ? "Critical" : combined >= 3 ? "High" : combined >= 1 ? "Medium" : "Low";

    const blockers = readiness.blockingLines.map((l) => `${l.materialCode} (short ${l.shortfall} ${l.uom}${l.quarantinedQty > 0 ? `, ${l.quarantinedQty} ${l.uom} held in quarantine` : ""})`).join("; ");

    const { created: wasCreated } = upsertException({
      dedupeKey: wo.id,
      category: "Production",
      severity,
      title: `Production order not ready: ${wo.woNumber}`,
      description: `${wo.woNumber} (${wo.qty} units, priority ${wo.priority}, planned start ${new Date(wo.plannedStart).toLocaleDateString("en-IN")}) cannot start cleanly. Blocking material(s): ${blockers}.`,
      recommendedAction: `Expedite the blocking material(s) or re-sequence ${wo.woNumber} behind an order whose materials are ready.`,
      owner: "Production Planner",
      affectedEntity: { type: "productionOrder", id: wo.id, label: wo.woNumber, href: `/production/${wo.id}` },
      sourceRuleId: "production-readiness",
      deadline: wo.plannedStart,
    });
    if (wasCreated) created++;
    else updated++;
    messages.push(`${wo.woNumber}: blocked by ${blockers} (${severity})`);
  }

  return { ruleId: "production-readiness", ruleName: "Production Readiness Checks", severity: "High", findingsCount: candidates.length, newExceptions: created, updatedExceptions: updated, messages };
}

const PR_SLA_HOURS = 24;
const PO_SLA_HOURS = 48;

function runApprovalEscalation(): AutomationRuleResult {
  let created = 0;
  let updated = 0;
  const messages: string[] = [];

  const stalePRs = store.requisitions.filter((pr) => pr.status === "Pending Approval" && (Date.now() - new Date(pr.requestDate).getTime()) / 3600000 > PR_SLA_HOURS);
  const stalePOs = store.purchaseOrders.filter((po) => po.status === "Pending Approval" && (Date.now() - new Date(po.orderDate).getTime()) / 3600000 > PO_SLA_HOURS);

  for (const pr of stalePRs) {
    const hours = Math.floor((Date.now() - new Date(pr.requestDate).getTime()) / 3600000);
    const { created: wasCreated } = upsertException({
      dedupeKey: pr.id,
      category: "Procurement",
      severity: hours > PR_SLA_HOURS * 3 ? "Critical" : "High",
      title: `Approval SLA breached: ${pr.prNumber}`,
      description: `${pr.prNumber} ("${pr.title}") has been Pending Approval for ${hours} hours, beyond the ${PR_SLA_HOURS}h requisition approval SLA.`,
      recommendedAction: `Approve, reject, or reassign ${pr.prNumber} without further delay.`,
      owner: "Procurement Manager",
      affectedEntity: { type: "requisition", id: pr.id, label: pr.prNumber, href: `/procurement/requisitions/${pr.id}` },
      sourceRuleId: "approval-escalation",
    });
    if (wasCreated) created++;
    else updated++;
    messages.push(`${pr.prNumber}: pending ${hours}h (SLA ${PR_SLA_HOURS}h)`);
  }

  for (const po of stalePOs) {
    const hours = Math.floor((Date.now() - new Date(po.orderDate).getTime()) / 3600000);
    const { created: wasCreated } = upsertException({
      dedupeKey: po.id,
      category: "Procurement",
      severity: hours > PO_SLA_HOURS * 3 ? "Critical" : "High",
      title: `Approval SLA breached: ${po.poNumber}`,
      description: `${po.poNumber} has been Pending Approval for ${hours} hours, beyond the ${PO_SLA_HOURS}h purchase order approval SLA.`,
      recommendedAction: `Approve, reject, or reassign ${po.poNumber} without further delay.`,
      owner: "Procurement Manager",
      affectedEntity: { type: "purchaseOrder", id: po.id, label: po.poNumber, href: `/procurement/purchase-orders/${po.id}` },
      sourceRuleId: "approval-escalation",
    });
    if (wasCreated) created++;
    else updated++;
    messages.push(`${po.poNumber}: pending ${hours}h (SLA ${PO_SLA_HOURS}h)`);
  }

  return {
    ruleId: "approval-escalation",
    ruleName: "Approval Escalation (SLA Breach)",
    severity: "High",
    findingsCount: stalePRs.length + stalePOs.length,
    newExceptions: created,
    updatedExceptions: updated,
    messages,
  };
}

const RUNNERS: Record<string, () => AutomationRuleResult> = {
  "predictive-shortage": runPredictiveShortage,
  "reorder-recommendation": runReorderRecommendation,
  "supplier-delay-detection": runSupplierDelayDetection,
  "production-readiness": runProductionReadiness,
  "approval-escalation": runApprovalEscalation,
};

export function runAllRules(runBy: string): AutomationRunRecord {
  const results: AutomationRuleResult[] = [];
  for (const def of RULE_DEFINITIONS) {
    if (!def.enabled) continue;
    const runner = RUNNERS[def.id];
    if (!runner) continue;
    results.push(runner());
  }
  const record: AutomationRunRecord = {
    id: nextId("RUN"),
    runAt: new Date().toISOString(),
    runBy,
    results,
    totalNew: results.reduce((s, r) => s + r.newExceptions, 0),
    totalUpdated: results.reduce((s, r) => s + r.updatedExceptions, 0),
  };
  store.automationRuns.unshift(record);
  return record;
}
