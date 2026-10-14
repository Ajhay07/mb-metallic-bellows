// Core domain types for the MB Metallic Bellows demo Operations Management System.
// NOTE: This is DEMO DATA MODE. There is no real ERP/database behind these types —
// see lib/data/store.ts for the in-memory data layer.

export type Role =
  | "Administrator"
  | "Procurement Manager"
  | "Purchase Officer"
  | "Production Planner"
  | "Store/Inventory Manager"
  | "Quality Inspector"
  | "Management";

export type UoM =
  | "KG"
  | "M"
  | "NOS"
  | "SET"
  | "CYL"
  | "LTR"
  | "SHEET";

export type LotStatus = "available" | "quarantined" | "rejected";
export type InspectionStatus = "pending" | "passed" | "failed" | "not_required";

export interface Material {
  id: string;
  code: string;
  name: string;
  category: string;
  uom: UoM;
  grade?: string;
  reorderPoint: number;
  safetyStock: number;
  unitCost: number;
  warehouse: string;
  bin: string;
  primarySupplierId: string;
  leadTimeDays: number;
  reservedQty: number; // aggregate manual reservation against open production orders (demo simplification)
  notes?: string;
}

export interface StockLot {
  id: string;
  materialId: string;
  lotNumber: string;
  qty: number;
  originalQty: number;
  warehouse: string;
  bin: string;
  status: LotStatus;
  inspectionStatus: InspectionStatus;
  receivedDate: string;
  sourcePoId?: string;
  sourceGrnId?: string;
  remarks?: string;
}

export type StockMovementType =
  | "receipt"
  | "issue"
  | "return"
  | "quarantine"
  | "release"
  | "reject"
  | "adjustment";

export interface StockMovement {
  id: string;
  materialId: string;
  lotId?: string;
  type: StockMovementType;
  qty: number; // signed: positive = stock in, negative = stock out
  date: string;
  reference: string; // e.g. GRN number, Work Order number, adjustment ref
  performedBy: string;
  note?: string;
}

export interface SupplierMaterialLink {
  materialId: string;
  leadTimeDays: number;
  lastPrice: number;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  location: string;
  contactPerson: string;
  email: string;
  phone: string;
  materialsSupplied: SupplierMaterialLink[];
  onTimeDeliveryPct: number; // trailing performance, demo-computed from PO history
  rejectionRatePct: number;
  totalOrders: number;
  activeSince: string;
  notes?: string;
}

export type PRStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Cancelled"
  | "Converted";

export interface AuditEntry {
  id: string;
  date: string;
  byUser: string;
  byRole: Role;
  action: string;
  comment?: string;
}

export interface RequisitionLine {
  id: string;
  materialId: string;
  qty: number;
  uom: UoM;
  neededByDate: string;
}

export interface PurchaseRequisition {
  id: string;
  prNumber: string;
  title: string;
  requestedBy: string;
  requestedByRole: Role;
  requestDate: string;
  status: PRStatus;
  priority: "Low" | "Medium" | "High" | "Critical";
  lines: RequisitionLine[];
  history: AuditEntry[];
  sourceRuleId?: string; // set when generated as a draft by the automation engine
  linkedPoId?: string;
  justification: string;
}

export type POStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Ordered"
  | "Partially Received"
  | "Received"
  | "Closed"
  | "Cancelled";

export interface POLine {
  id: string;
  materialId: string;
  orderedQty: number;
  uom: UoM;
  unitPrice: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
}

export interface GRNRecord {
  id: string;
  grnNumber: string;
  date: string;
  lines: { poLineId: string; qty: number; lotNumber: string }[];
  inspectionStatus: InspectionStatus;
  inspector?: string;
  remarks?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  sourceRequisitionId?: string;
  status: POStatus;
  orderDate: string;
  expectedDeliveryDate: string;
  lines: POLine[];
  grns: GRNRecord[];
  history: AuditEntry[];
}

export interface BOMLine {
  id: string;
  materialId: string;
  qtyPerUnit: number;
  uom: UoM;
  scrapPercent: number;
  stage: string; // which production stage consumes this component
}

export interface BOM {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  revision: string;
  description: string;
  lines: BOMLine[];
}

export type ProductionStage =
  | "Material Prep"
  | "Cutting"
  | "Forming"
  | "Welding"
  | "Assembly"
  | "Dimensional Inspection"
  | "Leak Test"
  | "Final QA"
  | "Packing"
  | "Completed";

export const PRODUCTION_ROUTING: ProductionStage[] = [
  "Material Prep",
  "Cutting",
  "Forming",
  "Welding",
  "Assembly",
  "Dimensional Inspection",
  "Leak Test",
  "Final QA",
  "Packing",
  "Completed",
];

export type ProductionOrderStatus =
  | "Not Started"
  | "In Progress"
  | "On Hold"
  | "Completed"
  | "Cancelled";

export interface StageHistoryEntry {
  stage: ProductionStage;
  enteredAt: string;
  exitedAt?: string;
  note?: string;
}

export interface ProductionOrder {
  id: string;
  woNumber: string;
  bomId: string;
  qty: number;
  priority: "Low" | "Medium" | "High" | "Critical";
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  currentStage: ProductionStage;
  status: ProductionOrderStatus;
  stageHistory: StageHistoryEntry[];
  delayReason?: string;
  customer: string;
  salesOrderRef: string;
}

export type ExceptionCategory =
  | "Procurement"
  | "Inventory"
  | "Production"
  | "Supplier"
  | "Quality";

export type ExceptionSeverity = "Critical" | "High" | "Medium" | "Low";
export type ExceptionStatus = "Open" | "Acknowledged" | "Resolved" | "Dismissed";

export interface ExceptionItem {
  id: string;
  category: ExceptionCategory;
  severity: ExceptionSeverity;
  title: string;
  description: string;
  recommendedAction: string;
  owner: Role;
  status: ExceptionStatus;
  statusReason?: string;
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  affectedEntity: { type: string; id: string; label: string; href: string };
  sourceRuleId?: string;
  history: AuditEntry[];
}

export interface AutomationRuleResult {
  ruleId: string;
  ruleName: string;
  severity: ExceptionSeverity;
  findingsCount: number;
  newExceptions: number;
  updatedExceptions: number;
  messages: string[];
}

export interface AutomationRunRecord {
  id: string;
  runAt: string;
  runBy: string;
  results: AutomationRuleResult[];
  totalNew: number;
  totalUpdated: number;
}

export interface AutomationRuleDefinition {
  id: string;
  name: string;
  description: string;
  trigger: string;
  conditionSummary: string;
  actionSummary: string;
  severity: ExceptionSeverity;
  enabled: boolean;
}

export interface ImportBatch {
  id: string;
  fileName: string;
  importedAt: string;
  importedBy: string;
  recordType: string;
  rowCount: number;
  validRows: number;
  errorRows: number;
  status: "Validated" | "Failed Validation" | "Previewed";
  errors: string[];
}
