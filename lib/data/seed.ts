// =============================================================================
// DEMO DATASET — MB Metallic Bellows Pvt. Ltd. Operations Management System
// -----------------------------------------------------------------------------
// Everything in this file is synthetic demo data. It is the single source of
// seed facts for the whole app. Derived numbers (stock availability, MRP
// shortages, supplier on-time %, production readiness) are NEVER hardcoded
// here — they are computed at request time in lib/domain/* from these base
// records, so the numbers always agree with each other.
// =============================================================================
import type {
  Material,
  StockLot,
  Supplier,
  BOM,
  ProductionOrder,
  PurchaseRequisition,
  PurchaseOrder,
  ExceptionItem,
} from "@/lib/types";
import { daysAgo, daysFromNow } from "./dateutil";

// -----------------------------------------------------------------------------
// Suppliers
// -----------------------------------------------------------------------------
export const suppliers: Supplier[] = [
  {
    id: "SUP-01",
    code: "CST",
    name: "Chennai Steel Traders",
    location: "Ambattur Industrial Estate, Chennai, TN",
    contactPerson: "R. Gopinath",
    email: "gopinath@chennaisteel.example.com",
    phone: "+91 44 2625 1190",
    materialsSupplied: [
      { materialId: "M01", leadTimeDays: 12, lastPrice: 215 },
      { materialId: "M02", leadTimeDays: 14, lastPrice: 265 },
      { materialId: "M03", leadTimeDays: 18, lastPrice: 310 },
    ],
    onTimeDeliveryPct: 0,
    rejectionRatePct: 0,
    totalOrders: 0,
    activeSince: "2018-04-01",
  },
  {
    id: "SUP-02",
    code: "TNFW",
    name: "Tamil Nadu Flange Works",
    location: "SIDCO Industrial Estate, Thirumudivakkam, TN",
    contactPerson: "S. Muthukumar",
    email: "muthukumar@tnflangeworks.example.com",
    phone: "+91 44 2477 3302",
    materialsSupplied: [
      { materialId: "M06", leadTimeDays: 20, lastPrice: 650 },
      { materialId: "M07", leadTimeDays: 20, lastPrice: 1250 },
      { materialId: "M17", leadTimeDays: 22, lastPrice: 1480 },
      { materialId: "M18", leadTimeDays: 20, lastPrice: 1850 },
    ],
    onTimeDeliveryPct: 0,
    rejectionRatePct: 0,
    totalOrders: 0,
    activeSince: "2017-09-15",
    notes: "Historically reliable; on-time performance has been slipping over the last quarter.",
  },
  {
    id: "SUP-03",
    code: "PTI",
    name: "Precision Tube Industries",
    location: "Hosur Road, Bengaluru, KA",
    contactPerson: "N. Vikram Rao",
    email: "vikram@precisiontube.example.com",
    phone: "+91 80 2852 4471",
    materialsSupplied: [
      { materialId: "M04", leadTimeDays: 15, lastPrice: 980 },
      { materialId: "M05", leadTimeDays: 16, lastPrice: 1450 },
    ],
    onTimeDeliveryPct: 0,
    rejectionRatePct: 0,
    totalOrders: 0,
    activeSince: "2019-01-20",
  },
  {
    id: "SUP-04",
    code: "SSBC",
    name: "SS Bellows Components Pvt Ltd",
    location: "Oragadam, Kancheepuram, TN",
    contactPerson: "K. Anandan",
    email: "anandan@ssbellowscomp.example.com",
    phone: "+91 44 6655 2210",
    materialsSupplied: [
      { materialId: "M08", leadTimeDays: 25, lastPrice: 4200 },
      { materialId: "M09", leadTimeDays: 25, lastPrice: 6800 },
      { materialId: "M15", leadTimeDays: 18, lastPrice: 890 },
    ],
    onTimeDeliveryPct: 0,
    rejectionRatePct: 0,
    totalOrders: 0,
    activeSince: "2020-06-10",
  },
  {
    id: "SUP-05",
    code: "WAC",
    name: "Weldarc Consumables",
    location: "Guindy Industrial Estate, Chennai, TN",
    contactPerson: "T. Balamurugan",
    email: "bala@weldarc.example.com",
    phone: "+91 44 2234 8821",
    materialsSupplied: [
      { materialId: "M10", leadTimeDays: 10, lastPrice: 1650 },
      { materialId: "M11", leadTimeDays: 7, lastPrice: 1200 },
      { materialId: "M16", leadTimeDays: 10, lastPrice: 2800 },
    ],
    onTimeDeliveryPct: 0,
    rejectionRatePct: 0,
    totalOrders: 0,
    activeSince: "2019-11-05",
  },
  {
    id: "SUP-06",
    code: "IFC",
    name: "Industrial Fasteners Co",
    location: "Perungudi, Chennai, TN",
    contactPerson: "V. Senthil Kumar",
    email: "senthil@indfasteners.example.com",
    phone: "+91 44 2496 7743",
    materialsSupplied: [
      { materialId: "M12", leadTimeDays: 10, lastPrice: 185 },
      { materialId: "M13", leadTimeDays: 12, lastPrice: 420 },
    ],
    onTimeDeliveryPct: 0,
    rejectionRatePct: 0,
    totalOrders: 0,
    activeSince: "2021-02-18",
  },
  {
    id: "SUP-07",
    code: "SCIP",
    name: "SouthCoat Industrial Paints",
    location: "Mappedu, Thiruvallur, TN",
    contactPerson: "P. Ezhilarasan",
    email: "ezhil@southcoat.example.com",
    phone: "+91 44 2778 6650",
    materialsSupplied: [{ materialId: "M14", leadTimeDays: 9, lastPrice: 310 }],
    onTimeDeliveryPct: 0,
    rejectionRatePct: 0,
    totalOrders: 0,
    activeSince: "2020-03-01",
  },
];

// -----------------------------------------------------------------------------
// Materials (master data). reservedQty is a simplified, aggregate "committed
// elsewhere" figure (stock allocated/earmarked for demand outside the open
// production orders modelled here, or already pulled in part). Available
// stock for any new requirement is always onHand - reservedQty - quarantinedQty.
// -----------------------------------------------------------------------------
export const materials: Material[] = [
  {
    id: "M01", code: "SS304-SHEET-2MM", name: "SS304 Sheet 2.0mm", category: "Raw Material – Sheet",
    uom: "KG", grade: "SS304", reorderPoint: 500, safetyStock: 150, unitCost: 215,
    warehouse: "WH-1 Raw Material Store", bin: "RM-A1", primarySupplierId: "SUP-01",
    leadTimeDays: 12, reservedQty: 180,
  },
  {
    id: "M02", code: "SS316L-SHEET-1.5MM", name: "SS316L Sheet 1.5mm", category: "Raw Material – Sheet",
    uom: "KG", grade: "SS316L", reorderPoint: 300, safetyStock: 100, unitCost: 265,
    warehouse: "WH-1 Raw Material Store", bin: "RM-A2", primarySupplierId: "SUP-01",
    leadTimeDays: 14, reservedQty: 90,
  },
  {
    id: "M03", code: "SS316-COIL-0.3MM", name: "SS316 Cold Rolled Coil 0.3mm (Bellows Grade)",
    category: "Raw Material – Coil", uom: "KG", grade: "SS316", reorderPoint: 800, safetyStock: 300,
    unitCost: 310, warehouse: "WH-1 Raw Material Store", bin: "RM-A3", primarySupplierId: "SUP-01",
    leadTimeDays: 18, reservedQty: 250,
    notes: "Critical input — hydroformed into the bellows convolution element in-house.",
  },
  {
    id: "M04", code: "SS304-TUBE-OD50", name: "SS304 Seamless Tube OD50x2mm", category: "Raw Material – Tube",
    uom: "M", grade: "SS304", reorderPoint: 200, safetyStock: 60, unitCost: 980,
    warehouse: "WH-1 Raw Material Store", bin: "RM-B1", primarySupplierId: "SUP-03",
    leadTimeDays: 15, reservedQty: 40,
  },
  {
    id: "M05", code: "SS316-TUBE-OD76", name: "SS316 Seamless Tube OD76x3mm", category: "Raw Material – Tube",
    uom: "M", grade: "SS316", reorderPoint: 150, safetyStock: 50, unitCost: 1450,
    warehouse: "WH-1 Raw Material Store", bin: "RM-B2", primarySupplierId: "SUP-03",
    leadTimeDays: 16, reservedQty: 0,
  },
  {
    id: "M06", code: "CS-FLANGE-DN50", name: "Carbon Steel Flange DN50 PN16", category: "Bought Out – Flange",
    uom: "NOS", reorderPoint: 60, safetyStock: 20, unitCost: 650,
    warehouse: "WH-1 Raw Material Store", bin: "RM-C1", primarySupplierId: "SUP-02",
    leadTimeDays: 20, reservedQty: 0,
  },
  {
    id: "M07", code: "SS-FLANGE-DN80", name: "SS304 Flange DN80 PN16", category: "Bought Out – Flange",
    uom: "NOS", reorderPoint: 35, safetyStock: 15, unitCost: 1250,
    warehouse: "WH-1 Raw Material Store", bin: "RM-C2", primarySupplierId: "SUP-02",
    leadTimeDays: 20, reservedQty: 10,
  },
  {
    id: "M08", code: "BELLOWS-BLANK-DN50", name: "Preformed Bellows Element DN50 (2-ply)",
    category: "Bought Out – Bellows Element", uom: "NOS", reorderPoint: 30, safetyStock: 10,
    unitCost: 4200, warehouse: "WH-1 Raw Material Store", bin: "RM-D1", primarySupplierId: "SUP-04",
    leadTimeDays: 25, reservedQty: 10,
  },
  {
    id: "M09", code: "BELLOWS-BLANK-DN80", name: "Preformed Bellows Element DN80 (2-ply)",
    category: "Bought Out – Bellows Element", uom: "NOS", reorderPoint: 20, safetyStock: 8,
    unitCost: 6800, warehouse: "WH-1 Raw Material Store", bin: "RM-D2", primarySupplierId: "SUP-04",
    leadTimeDays: 25, reservedQty: 4,
  },
  {
    id: "M10", code: "WELD-WIRE-316L", name: "Welding Filler Wire ER316L 1.2mm",
    category: "Consumable – Welding", uom: "KG", reorderPoint: 80, safetyStock: 25, unitCost: 1650,
    warehouse: "WH-2 Consumables Store", bin: "CN-A1", primarySupplierId: "SUP-05",
    leadTimeDays: 10, reservedQty: 10,
  },
  {
    id: "M11", code: "WELD-ARGON", name: "Argon Shielding Gas Cylinder", category: "Consumable – Welding",
    uom: "CYL", reorderPoint: 15, safetyStock: 5, unitCost: 1200,
    warehouse: "WH-2 Consumables Store", bin: "CN-A2", primarySupplierId: "SUP-05",
    leadTimeDays: 7, reservedQty: 2,
  },
  {
    id: "M12", code: "FASTENER-SET-M12", name: "Fastener Set M12 SS304 (Bolt/Nut/Washer)",
    category: "Bought Out – Fastener", uom: "SET", reorderPoint: 150, safetyStock: 40, unitCost: 185,
    warehouse: "WH-1 Raw Material Store", bin: "RM-E1", primarySupplierId: "SUP-06",
    leadTimeDays: 10, reservedQty: 0,
    notes: "Running low against reorder point; no replenishment PO currently open.",
  },
  {
    id: "M13", code: "GASKET-SPIRAL-DN50", name: "Spiral Wound Gasket DN50", category: "Bought Out – Gasket",
    uom: "NOS", reorderPoint: 40, safetyStock: 15, unitCost: 420,
    warehouse: "WH-1 Raw Material Store", bin: "RM-E2", primarySupplierId: "SUP-06",
    leadTimeDays: 12, reservedQty: 10,
  },
  {
    id: "M14", code: "PAINT-PRIMER-EPOXY", name: "Epoxy Zinc Primer Paint", category: "Consumable – Finishing",
    uom: "LTR", reorderPoint: 50, safetyStock: 15, unitCost: 310,
    warehouse: "WH-2 Consumables Store", bin: "CN-B1", primarySupplierId: "SUP-07",
    leadTimeDays: 9, reservedQty: 20,
  },
  {
    id: "M15", code: "END-RING-SS304", name: "End Ring / Collar SS304", category: "Bought Out – Fitting",
    uom: "NOS", reorderPoint: 50, safetyStock: 15, unitCost: 890,
    warehouse: "WH-1 Raw Material Store", bin: "RM-D3", primarySupplierId: "SUP-04",
    leadTimeDays: 18, reservedQty: 10,
  },
  {
    id: "M16", code: "QA-DYEPEN-KIT", name: "Dye Penetrant Inspection Kit (Consumable)",
    category: "Consumable – Quality", uom: "SET", reorderPoint: 10, safetyStock: 3, unitCost: 2800,
    warehouse: "WH-2 Consumables Store", bin: "CN-C1", primarySupplierId: "SUP-05",
    leadTimeDays: 10, reservedQty: 0,
  },
  {
    id: "M17", code: "SS-FLANGE-DN50-HP", name: "SS316 Flange DN50 PN40 (High Pressure)",
    category: "Bought Out – Flange", uom: "NOS", reorderPoint: 25, safetyStock: 10, unitCost: 1480,
    warehouse: "WH-1 Raw Material Store", bin: "RM-C3", primarySupplierId: "SUP-02",
    leadTimeDays: 22, reservedQty: 0,
  },
  {
    id: "M18", code: "SS-FLANGE-DN100", name: "SS304 Flange DN100 PN16", category: "Bought Out – Flange",
    uom: "NOS", reorderPoint: 30, safetyStock: 10, unitCost: 1850,
    warehouse: "WH-1 Raw Material Store", bin: "RM-C4", primarySupplierId: "SUP-02",
    leadTimeDays: 20, reservedQty: 14,
    notes: "Critically short against two open production orders; replenishment PO partially received.",
  },
];

// -----------------------------------------------------------------------------
// Stock lots (sum of lots per material drives "on hand"; quarantined lots are
// excluded from availability entirely until released by Quality).
// -----------------------------------------------------------------------------
export const stockLots: StockLot[] = [
  { id: "LOT-001", materialId: "M01", lotNumber: "CST-SS304-2401", qty: 700, originalQty: 700, warehouse: "WH-1", bin: "RM-A1", status: "available", inspectionStatus: "passed", receivedDate: daysAgo(40), sourcePoId: "PO-3001" },
  { id: "LOT-002", materialId: "M01", lotNumber: "CST-SS304-2512", qty: 500, originalQty: 500, warehouse: "WH-1", bin: "RM-A1", status: "available", inspectionStatus: "passed", receivedDate: daysAgo(18), sourcePoId: "PO-3001" },
  { id: "LOT-003", materialId: "M02", lotNumber: "CST-316L-2488", qty: 650, originalQty: 650, warehouse: "WH-1", bin: "RM-A2", status: "available", inspectionStatus: "passed", receivedDate: daysAgo(22), sourcePoId: "PO-3001" },
  { id: "LOT-004", materialId: "M03", lotNumber: "CST-COIL-2531", qty: 420, originalQty: 500, warehouse: "WH-1", bin: "RM-A3", status: "available", inspectionStatus: "passed", receivedDate: daysAgo(55), remarks: "Balance of a prior receipt; largely drawn down by WIP forming." },
  { id: "LOT-005", materialId: "M04", lotNumber: "PTI-T50-1187", qty: 280, originalQty: 280, warehouse: "WH-1", bin: "RM-B1", status: "available", inspectionStatus: "passed", receivedDate: daysAgo(30), sourcePoId: "PO-3008" },
  { id: "LOT-006", materialId: "M04", lotNumber: "PTI-T50-1240", qty: 200, originalQty: 200, warehouse: "WH-1", bin: "RM-B1", status: "available", inspectionStatus: "passed", receivedDate: daysAgo(25), sourcePoId: "PO-3008" },
  { id: "LOT-007", materialId: "M05", lotNumber: "PTI-T76-0931", qty: 210, originalQty: 210, warehouse: "WH-1", bin: "RM-B2", status: "available", inspectionStatus: "passed", receivedDate: daysAgo(30), sourcePoId: "PO-3008" },
  { id: "LOT-008", materialId: "M06", lotNumber: "TNFW-CS50-0771", qty: 42, originalQty: 120, warehouse: "WH-1", bin: "RM-C1", status: "available", inspectionStatus: "passed", receivedDate: daysAgo(70), sourcePoId: "PO-3010", remarks: "Balance after issues to recent assemblies; reorder already placed (PO-3003, overdue)." },
  { id: "LOT-009", materialId: "M07", lotNumber: "TNFW-SS80-0845", qty: 100, originalQty: 100, warehouse: "WH-1", bin: "RM-C2", status: "available", inspectionStatus: "passed", receivedDate: daysAgo(50), sourcePoId: "PO-3011" },
  { id: "LOT-010", materialId: "M08", lotNumber: "SSBC-DN50-0412", qty: 70, originalQty: 70, warehouse: "WH-1", bin: "RM-D1", status: "available", inspectionStatus: "passed", receivedDate: daysAgo(15), sourcePoId: "PO-3005" },
  { id: "LOT-011", materialId: "M09", lotNumber: "SSBC-DN80-0298", qty: 26, originalQty: 26, warehouse: "WH-1", bin: "RM-D2", status: "available", inspectionStatus: "passed", receivedDate: daysAgo(15), sourcePoId: "PO-3005" },
  { id: "LOT-012", materialId: "M10", lotNumber: "WAC-ER316L-5510", qty: 60, originalQty: 60, warehouse: "WH-2", bin: "CN-A1", status: "available", inspectionStatus: "passed", receivedDate: daysAgo(6), sourcePoId: "PO-3007" },
  { id: "LOT-013", materialId: "M10", lotNumber: "WAC-ER316L-5511", qty: 25, originalQty: 25, warehouse: "WH-2", bin: "CN-A1-HOLD", status: "quarantined", inspectionStatus: "pending", receivedDate: daysAgo(6), sourcePoId: "PO-3007", remarks: "Mill certificate markings illegible on spool label — held pending re-verification with supplier. Blocked from allocation." },
  { id: "LOT-014", materialId: "M11", lotNumber: "WAC-AR-7701", qty: 20, originalQty: 20, warehouse: "WH-2", bin: "CN-A2", status: "available", inspectionStatus: "passed", receivedDate: daysAgo(14), sourcePoId: "PO-3007" },
  { id: "LOT-015", materialId: "M12", lotNumber: "IFC-M12-3304", qty: 55, originalQty: 220, warehouse: "WH-1", bin: "RM-E1", status: "available", inspectionStatus: "passed", receivedDate: daysAgo(65), sourcePoId: "PO-3016", remarks: "Below reorder point; no open replenishment PO." },
  { id: "LOT-016", materialId: "M13", lotNumber: "IFC-GSK-1187", qty: 90, originalQty: 90, warehouse: "WH-1", bin: "RM-E2", status: "available", inspectionStatus: "passed", receivedDate: daysAgo(20), sourcePoId: "PO-3006" },
  { id: "LOT-017", materialId: "M14", lotNumber: "SCIP-EPX-2241", qty: 120, originalQty: 150, warehouse: "WH-2", bin: "CN-B1", status: "available", inspectionStatus: "passed", receivedDate: daysAgo(10), sourcePoId: "PO-3009" },
  { id: "LOT-018", materialId: "M15", lotNumber: "SSBC-ERING-0512", qty: 110, originalQty: 110, warehouse: "WH-1", bin: "RM-D3", status: "available", inspectionStatus: "passed", receivedDate: daysAgo(15), sourcePoId: "PO-3005" },
  { id: "LOT-019", materialId: "M16", lotNumber: "WAC-DPKIT-0071", qty: 12, originalQty: 12, warehouse: "WH-2", bin: "CN-C1", status: "available", inspectionStatus: "passed", receivedDate: daysAgo(40) },
  { id: "LOT-020", materialId: "M17", lotNumber: "TNFW-HP50-0902", qty: 30, originalQty: 30, warehouse: "WH-1", bin: "RM-C3", status: "available", inspectionStatus: "passed", receivedDate: daysAgo(35), sourcePoId: "PO-3012" },
  { id: "LOT-021", materialId: "M18", lotNumber: "TNFW-DN100-1102", qty: 20, originalQty: 20, warehouse: "WH-1", bin: "RM-C4", status: "available", inspectionStatus: "passed", receivedDate: daysAgo(2), sourcePoId: "PO-3004", remarks: "Partial receipt against PO-3004; 20 of 40 ordered still outstanding and overdue." },
];

// -----------------------------------------------------------------------------
// Bills of Material — 5 finished expansion-joint products
// -----------------------------------------------------------------------------
export const boms: BOM[] = [
  {
    id: "BOM-A", productId: "PROD-EJ-DN50-SS304-STD", productCode: "EJ-DN50-SS304-STD",
    productName: "Standard Expansion Joint DN50 (SS304)", revision: "R2",
    description: "Single-ply SS304 expansion joint, DN50 PN16, carbon steel mating flanges.",
    lines: [
      { id: "BL-A1", materialId: "M01", qtyPerUnit: 3.5, uom: "KG", scrapPercent: 8, stage: "Cutting" },
      { id: "BL-A2", materialId: "M08", qtyPerUnit: 1, uom: "NOS", scrapPercent: 0, stage: "Assembly" },
      { id: "BL-A3", materialId: "M06", qtyPerUnit: 2, uom: "NOS", scrapPercent: 0, stage: "Assembly" },
      { id: "BL-A4", materialId: "M10", qtyPerUnit: 0.4, uom: "KG", scrapPercent: 5, stage: "Welding" },
      { id: "BL-A5", materialId: "M11", qtyPerUnit: 0.15, uom: "CYL", scrapPercent: 0, stage: "Welding" },
      { id: "BL-A6", materialId: "M12", qtyPerUnit: 1, uom: "SET", scrapPercent: 0, stage: "Assembly" },
      { id: "BL-A7", materialId: "M13", qtyPerUnit: 2, uom: "NOS", scrapPercent: 0, stage: "Assembly" },
      { id: "BL-A8", materialId: "M14", qtyPerUnit: 0.3, uom: "LTR", scrapPercent: 5, stage: "Packing" },
    ],
  },
  {
    id: "BOM-B", productId: "PROD-EJ-DN80-SS316-STD", productCode: "EJ-DN80-SS316-STD",
    productName: "Standard Expansion Joint DN80 (SS316)", revision: "R1",
    description: "Hydroformed SS316 bellows element from coil, DN80 PN16, SS flanges.",
    lines: [
      { id: "BL-B1", materialId: "M03", qtyPerUnit: 18, uom: "KG", scrapPercent: 5, stage: "Forming" },
      { id: "BL-B2", materialId: "M02", qtyPerUnit: 4, uom: "KG", scrapPercent: 8, stage: "Cutting" },
      { id: "BL-B3", materialId: "M07", qtyPerUnit: 2, uom: "NOS", scrapPercent: 0, stage: "Assembly" },
      { id: "BL-B4", materialId: "M10", qtyPerUnit: 0.6, uom: "KG", scrapPercent: 5, stage: "Welding" },
      { id: "BL-B5", materialId: "M11", qtyPerUnit: 0.2, uom: "CYL", scrapPercent: 0, stage: "Welding" },
      { id: "BL-B6", materialId: "M15", qtyPerUnit: 2, uom: "NOS", scrapPercent: 0, stage: "Assembly" },
      { id: "BL-B7", materialId: "M14", qtyPerUnit: 0.5, uom: "LTR", scrapPercent: 5, stage: "Packing" },
    ],
  },
  {
    id: "BOM-C", productId: "PROD-EJ-DN50-SS316L-HP", productCode: "EJ-DN50-SS316L-HP",
    productName: "High Pressure Expansion Joint DN50 (SS316L)", revision: "R3",
    description: "High-pressure rated SS316L joint, DN50 PN40, dye-penetrant tested.",
    lines: [
      { id: "BL-C1", materialId: "M02", qtyPerUnit: 5, uom: "KG", scrapPercent: 8, stage: "Cutting" },
      { id: "BL-C2", materialId: "M08", qtyPerUnit: 1, uom: "NOS", scrapPercent: 0, stage: "Assembly" },
      { id: "BL-C3", materialId: "M17", qtyPerUnit: 2, uom: "NOS", scrapPercent: 0, stage: "Assembly" },
      { id: "BL-C4", materialId: "M10", qtyPerUnit: 0.5, uom: "KG", scrapPercent: 5, stage: "Welding" },
      { id: "BL-C5", materialId: "M11", qtyPerUnit: 0.18, uom: "CYL", scrapPercent: 0, stage: "Welding" },
      { id: "BL-C6", materialId: "M12", qtyPerUnit: 1, uom: "SET", scrapPercent: 0, stage: "Assembly" },
      { id: "BL-C7", materialId: "M16", qtyPerUnit: 0.1, uom: "SET", scrapPercent: 0, stage: "Dimensional Inspection" },
      { id: "BL-C8", materialId: "M14", qtyPerUnit: 0.3, uom: "LTR", scrapPercent: 5, stage: "Packing" },
    ],
  },
  {
    id: "BOM-D", productId: "PROD-EJ-DN100-SS304-STD", productCode: "EJ-DN100-SS304-STD",
    productName: "Standard Expansion Joint DN100 (SS304)", revision: "R1",
    description: "Larger-bore SS304 joint, DN100 PN16, with internal liner tube.",
    lines: [
      { id: "BL-D1", materialId: "M01", qtyPerUnit: 6, uom: "KG", scrapPercent: 8, stage: "Cutting" },
      { id: "BL-D2", materialId: "M04", qtyPerUnit: 2, uom: "M", scrapPercent: 5, stage: "Cutting" },
      { id: "BL-D3", materialId: "M18", qtyPerUnit: 2, uom: "NOS", scrapPercent: 0, stage: "Assembly" },
      { id: "BL-D4", materialId: "M10", qtyPerUnit: 0.7, uom: "KG", scrapPercent: 5, stage: "Welding" },
      { id: "BL-D5", materialId: "M11", qtyPerUnit: 0.25, uom: "CYL", scrapPercent: 0, stage: "Welding" },
      { id: "BL-D6", materialId: "M15", qtyPerUnit: 2, uom: "NOS", scrapPercent: 0, stage: "Assembly" },
      { id: "BL-D7", materialId: "M12", qtyPerUnit: 2, uom: "SET", scrapPercent: 0, stage: "Assembly" },
      { id: "BL-D8", materialId: "M14", qtyPerUnit: 0.6, uom: "LTR", scrapPercent: 5, stage: "Packing" },
    ],
  },
  {
    id: "BOM-E", productId: "PROD-EJ-DN80-SS316-HT", productCode: "EJ-DN80-SS316-HT",
    productName: "High Temperature Expansion Joint DN80 (SS316)", revision: "R2",
    description: "High-temperature service joint with reinforced tube section, leak-tested.",
    lines: [
      { id: "BL-E1", materialId: "M03", qtyPerUnit: 22, uom: "KG", scrapPercent: 5, stage: "Forming" },
      { id: "BL-E2", materialId: "M05", qtyPerUnit: 1.5, uom: "M", scrapPercent: 5, stage: "Cutting" },
      { id: "BL-E3", materialId: "M07", qtyPerUnit: 2, uom: "NOS", scrapPercent: 0, stage: "Assembly" },
      { id: "BL-E4", materialId: "M10", qtyPerUnit: 0.65, uom: "KG", scrapPercent: 5, stage: "Welding" },
      { id: "BL-E5", materialId: "M11", qtyPerUnit: 0.22, uom: "CYL", scrapPercent: 0, stage: "Welding" },
      { id: "BL-E6", materialId: "M15", qtyPerUnit: 2, uom: "NOS", scrapPercent: 0, stage: "Assembly" },
      { id: "BL-E7", materialId: "M16", qtyPerUnit: 0.12, uom: "SET", scrapPercent: 0, stage: "Leak Test" },
      { id: "BL-E8", materialId: "M14", qtyPerUnit: 0.55, uom: "LTR", scrapPercent: 5, stage: "Packing" },
    ],
  },
];

// -----------------------------------------------------------------------------
// Production orders (work orders)
// -----------------------------------------------------------------------------
export const productionOrders: ProductionOrder[] = [
  {
    id: "WO-1001", woNumber: "WO-1001", bomId: "BOM-C", qty: 12, priority: "Medium",
    plannedStart: daysFromNow(1), plannedEnd: daysFromNow(16),
    currentStage: "Material Prep", status: "Not Started",
    stageHistory: [], customer: "Coastal Petrochem Industries", salesOrderRef: "SO-8841",
  },
  {
    id: "WO-1002", woNumber: "WO-1002", bomId: "BOM-A", qty: 25, priority: "High",
    plannedStart: daysFromNow(3), plannedEnd: daysFromNow(20),
    currentStage: "Material Prep", status: "Not Started",
    stageHistory: [], customer: "Gulf Coast Energy Solutions", salesOrderRef: "SO-8852",
  },
  {
    id: "WO-1003", woNumber: "WO-1003", bomId: "BOM-B", qty: 20, priority: "Critical",
    plannedStart: daysFromNow(4), plannedEnd: daysFromNow(24),
    currentStage: "Material Prep", status: "Not Started",
    stageHistory: [], customer: "Rajasthan Oil & Gas Corp", salesOrderRef: "SO-8860",
  },
  {
    id: "WO-1004", woNumber: "WO-1004", bomId: "BOM-E", qty: 15, priority: "Critical",
    plannedStart: daysFromNow(6), plannedEnd: daysFromNow(27),
    currentStage: "Material Prep", status: "Not Started",
    stageHistory: [], customer: "Rajasthan Oil & Gas Corp", salesOrderRef: "SO-8861",
  },
  {
    id: "WO-1005", woNumber: "WO-1005", bomId: "BOM-D", qty: 10, priority: "High",
    plannedStart: daysAgo(2), plannedEnd: daysFromNow(16),
    actualStart: daysAgo(2),
    currentStage: "Material Prep", status: "On Hold",
    delayReason: "Awaiting SS304 Flange DN100 (M18) — Tamil Nadu Flange Works delivery (PO-3004) running behind schedule; cutting stage cannot be released without confirmed flange availability.",
    stageHistory: [{ stage: "Material Prep", enteredAt: daysAgo(2), note: "Started, then paused pending flange availability." }],
    customer: "Western Ports Infrastructure Ltd", salesOrderRef: "SO-8835",
  },
  {
    id: "WO-1006", woNumber: "WO-1006", bomId: "BOM-A", qty: 18, priority: "Medium",
    plannedStart: daysAgo(6), plannedEnd: daysFromNow(9),
    actualStart: daysAgo(6),
    currentStage: "Welding", status: "In Progress",
    stageHistory: [
      { stage: "Material Prep", enteredAt: daysAgo(6), exitedAt: daysAgo(5) },
      { stage: "Cutting", enteredAt: daysAgo(5), exitedAt: daysAgo(3) },
      { stage: "Forming", enteredAt: daysAgo(3), exitedAt: daysAgo(2) },
      { stage: "Welding", enteredAt: daysAgo(2) },
    ],
    customer: "Chennai Refineries Ltd", salesOrderRef: "SO-8790",
  },
  {
    id: "WO-1007", woNumber: "WO-1007", bomId: "BOM-B", qty: 12, priority: "Medium",
    plannedStart: daysAgo(10), plannedEnd: daysFromNow(2),
    actualStart: daysAgo(10),
    currentStage: "Dimensional Inspection", status: "In Progress",
    stageHistory: [
      { stage: "Material Prep", enteredAt: daysAgo(10), exitedAt: daysAgo(9) },
      { stage: "Cutting", enteredAt: daysAgo(9), exitedAt: daysAgo(7) },
      { stage: "Forming", enteredAt: daysAgo(7), exitedAt: daysAgo(5) },
      { stage: "Welding", enteredAt: daysAgo(5), exitedAt: daysAgo(2) },
      { stage: "Assembly", enteredAt: daysAgo(2), exitedAt: daysAgo(1) },
      { stage: "Dimensional Inspection", enteredAt: daysAgo(1) },
    ],
    customer: "Deccan Petrochemicals", salesOrderRef: "SO-8761",
  },
  {
    id: "WO-1008", woNumber: "WO-1008", bomId: "BOM-C", qty: 8, priority: "Low",
    plannedStart: daysAgo(20), plannedEnd: daysAgo(2),
    actualStart: daysAgo(20), actualEnd: daysAgo(3),
    currentStage: "Completed", status: "Completed",
    stageHistory: [
      { stage: "Material Prep", enteredAt: daysAgo(20), exitedAt: daysAgo(19) },
      { stage: "Cutting", enteredAt: daysAgo(19), exitedAt: daysAgo(17) },
      { stage: "Forming", enteredAt: daysAgo(17), exitedAt: daysAgo(16) },
      { stage: "Welding", enteredAt: daysAgo(16), exitedAt: daysAgo(12) },
      { stage: "Assembly", enteredAt: daysAgo(12), exitedAt: daysAgo(9) },
      { stage: "Dimensional Inspection", enteredAt: daysAgo(9), exitedAt: daysAgo(7) },
      { stage: "Leak Test", enteredAt: daysAgo(7), exitedAt: daysAgo(5) },
      { stage: "Final QA", enteredAt: daysAgo(5), exitedAt: daysAgo(4) },
      { stage: "Packing", enteredAt: daysAgo(4), exitedAt: daysAgo(3) },
      { stage: "Completed", enteredAt: daysAgo(3) },
    ],
    customer: "Coastal Petrochem Industries", salesOrderRef: "SO-8640",
  },
  {
    id: "WO-1009", woNumber: "WO-1009", bomId: "BOM-E", qty: 6, priority: "Medium",
    plannedStart: daysAgo(8), plannedEnd: daysFromNow(1),
    actualStart: daysAgo(8),
    currentStage: "Leak Test", status: "In Progress",
    stageHistory: [
      { stage: "Material Prep", enteredAt: daysAgo(8), exitedAt: daysAgo(7) },
      { stage: "Cutting", enteredAt: daysAgo(7), exitedAt: daysAgo(6) },
      { stage: "Forming", enteredAt: daysAgo(6), exitedAt: daysAgo(4) },
      { stage: "Welding", enteredAt: daysAgo(4), exitedAt: daysAgo(2) },
      { stage: "Assembly", enteredAt: daysAgo(2), exitedAt: daysAgo(1) },
      { stage: "Dimensional Inspection", enteredAt: daysAgo(1), exitedAt: daysAgo(0) },
      { stage: "Leak Test", enteredAt: daysAgo(0) },
    ],
    customer: "Western Ports Infrastructure Ltd", salesOrderRef: "SO-8836",
  },
  {
    id: "WO-1010", woNumber: "WO-1010", bomId: "BOM-D", qty: 14, priority: "Low",
    plannedStart: daysFromNow(12), plannedEnd: daysFromNow(32),
    currentStage: "Material Prep", status: "Not Started",
    stageHistory: [], customer: "Gulf Coast Energy Solutions", salesOrderRef: "SO-8862",
  },
];

// -----------------------------------------------------------------------------
// Purchase Requisitions
// -----------------------------------------------------------------------------
export const requisitions: PurchaseRequisition[] = [
  {
    id: "PR-2001", prNumber: "PR-2001", title: "SS316 Coil top-up for Rajasthan O&G project",
    requestedBy: "Karthik Subramaniam", requestedByRole: "Purchase Officer",
    requestDate: daysAgo(2), status: "Pending Approval", priority: "Critical",
    lines: [{ id: "PRL-1", materialId: "M03", qty: 250, uom: "KG", neededByDate: daysFromNow(4) }],
    history: [
      { id: "H1", date: daysAgo(2), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "Created", comment: "MRP shows a net shortfall against WO-1003/WO-1004 even after PO-3002 lands." },
    ],
    justification: "Net MRP shortfall on SS316-COIL-0.3MM against WO-1003 and WO-1004 persists even after incoming PO-3002; raising additional top-up quantity to close the gap and rebuild safety stock.",
  },
  {
    id: "PR-2002", prNumber: "PR-2002", title: "Fastener Set M12 replenishment (auto-recommended)",
    requestedBy: "Priya Raman", requestedByRole: "Procurement Manager",
    requestDate: daysAgo(1), status: "Draft", priority: "Medium",
    lines: [{ id: "PRL-2", materialId: "M12", qty: 140, uom: "SET", neededByDate: daysFromNow(10) }],
    history: [
      { id: "H2", date: daysAgo(1), byUser: "Automation Engine", byRole: "Administrator", action: "Draft created by rule: Reorder Recommendation", comment: "Stock below reorder point with no open replenishment PO. Draft requires Procurement review before submission." },
    ],
    sourceRuleId: "reorder-recommendation",
    justification: "Automation Centre rule 'Reorder Recommendation' detected on-hand stock below the reorder point with no incoming purchase order. Draft quantity brings stock back to reorder point + safety stock. Review and submit for approval.",
  },
  {
    id: "PR-2003", prNumber: "PR-2003", title: "Welding wire ER316L additional cover",
    requestedBy: "Karthik Subramaniam", requestedByRole: "Purchase Officer",
    requestDate: daysAgo(5), status: "Approved", priority: "High",
    lines: [{ id: "PRL-3", materialId: "M10", qty: 40, uom: "KG", neededByDate: daysFromNow(7) }],
    history: [
      { id: "H3a", date: daysAgo(5), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "Created", comment: "25kg of the last receipt is quarantined pending mill certificate re-verification; raising cover in case the lot is rejected." },
      { id: "H3b", date: daysAgo(4), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Approved", comment: "Approved as a precaution; convert to PO once Quality confirms the quarantine outcome." },
    ],
    justification: "Precautionary cover in case the quarantined ER316L wire lot (LOT-013) is ultimately rejected by Quality.",
  },
  {
    id: "PR-2004", prNumber: "PR-2004", title: "Epoxy primer bulk purchase",
    requestedBy: "Karthik Subramaniam", requestedByRole: "Purchase Officer",
    requestDate: daysAgo(9), status: "Rejected", priority: "Low",
    lines: [{ id: "PRL-4", materialId: "M14", qty: 200, uom: "LTR", neededByDate: daysFromNow(30) }],
    history: [
      { id: "H4a", date: daysAgo(9), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "Created" },
      { id: "H4b", date: daysAgo(7), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Rejected", comment: "Quantity far exceeds ~90-day consumption at current production rate and ties up working capital. Resubmit at 60-80 LTR if needed sooner." },
    ],
    justification: "Bulk buy proposed to get a volume discount from SouthCoat Industrial Paints.",
  },
  {
    id: "PR-2005", prNumber: "PR-2005", title: "SS Flange DN100 replenishment",
    requestedBy: "Karthik Subramaniam", requestedByRole: "Purchase Officer",
    requestDate: daysAgo(19), status: "Converted", priority: "High",
    lines: [{ id: "PRL-5", materialId: "M18", qty: 40, uom: "NOS", neededByDate: daysFromNow(2) }],
    history: [
      { id: "H5a", date: daysAgo(19), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "Created" },
      { id: "H5b", date: daysAgo(18), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Approved" },
      { id: "H5c", date: daysAgo(18), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "Converted to Purchase Order", comment: "Converted to PO-3004." },
    ],
    linkedPoId: "PO-3004",
    justification: "Replenishment for WO-1005 and WO-1010 flange requirement raised ahead of need date.",
  },
  {
    id: "PR-2006", prNumber: "PR-2006", title: "SS304 sheet routine replenishment",
    requestedBy: "Karthik Subramaniam", requestedByRole: "Purchase Officer",
    requestDate: daysAgo(45), status: "Converted", priority: "Medium",
    lines: [{ id: "PRL-6", materialId: "M01", qty: 1200, uom: "KG", neededByDate: daysAgo(30) }],
    history: [
      { id: "H6a", date: daysAgo(45), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "Created" },
      { id: "H6b", date: daysAgo(44), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Approved" },
      { id: "H6c", date: daysAgo(44), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "Converted to Purchase Order", comment: "Converted to PO-3001." },
    ],
    linkedPoId: "PO-3001",
    justification: "Routine quarterly sheet stock replenishment.",
  },
];

// -----------------------------------------------------------------------------
// Purchase Orders
// -----------------------------------------------------------------------------
export const purchaseOrders: PurchaseOrder[] = [
  {
    id: "PO-3001", poNumber: "PO-3001", supplierId: "SUP-01", sourceRequisitionId: "PR-2006",
    status: "Closed", orderDate: daysAgo(44), expectedDeliveryDate: daysAgo(32),
    lines: [
      { id: "POL-3001-1", materialId: "M01", orderedQty: 1200, uom: "KG", unitPrice: 215, receivedQty: 1200, acceptedQty: 1200, rejectedQty: 0 },
      { id: "POL-3001-2", materialId: "M02", orderedQty: 650, uom: "KG", unitPrice: 265, receivedQty: 650, acceptedQty: 650, rejectedQty: 0 },
    ],
    grns: [{ id: "GRN-3001-1", grnNumber: "GRN-5001", date: daysAgo(33), lines: [{ poLineId: "POL-3001-1", qty: 1200, lotNumber: "CST-SS304-2401" }, { poLineId: "POL-3001-2", qty: 650, lotNumber: "CST-316L-2488" }], inspectionStatus: "passed", inspector: "Divya Lakshmi" }],
    history: [
      { id: "A1", date: daysAgo(44), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "PO Created" },
      { id: "A2", date: daysAgo(43), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Approved" },
      { id: "A3", date: daysAgo(33), byUser: "Suresh Babu", byRole: "Store/Inventory Manager", action: "Goods Received (GRN-5001)" },
      { id: "A4", date: daysAgo(32), byUser: "Divya Lakshmi", byRole: "Quality Inspector", action: "Inspection Passed" },
      { id: "A5", date: daysAgo(31), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Closed" },
    ],
  },
  {
    id: "PO-3002", poNumber: "PO-3002", supplierId: "SUP-01",
    status: "Ordered", orderDate: daysAgo(23), expectedDeliveryDate: daysAgo(5),
    lines: [{ id: "POL-3002-1", materialId: "M03", orderedQty: 350, uom: "KG", unitPrice: 310, receivedQty: 0, acceptedQty: 0, rejectedQty: 0 }],
    grns: [],
    history: [
      { id: "B1", date: daysAgo(23), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "PO Created" },
      { id: "B2", date: daysAgo(22), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Approved" },
      { id: "B3", date: daysAgo(22), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "Sent to Supplier" },
      { id: "B4", date: daysAgo(3), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "Follow-up call", comment: "Supplier cites rolling mill delay; revised ETA given as +6 days from today." },
    ],
  },
  {
    id: "PO-3018", poNumber: "PO-3018", supplierId: "SUP-01",
    status: "Closed", orderDate: daysAgo(100), expectedDeliveryDate: daysAgo(86),
    lines: [{ id: "POL-3018-1", materialId: "M02", orderedQty: 400, uom: "KG", unitPrice: 260, receivedQty: 400, acceptedQty: 400, rejectedQty: 0 }],
    grns: [{ id: "GRN-3018-1", grnNumber: "GRN-4320", date: daysAgo(87), lines: [{ poLineId: "POL-3018-1", qty: 400, lotNumber: "CST-316L-2301" }], inspectionStatus: "passed", inspector: "Divya Lakshmi" }],
    history: [
      { id: "R1", date: daysAgo(100), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "PO Created" },
      { id: "R2", date: daysAgo(99), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Approved" },
      { id: "R3", date: daysAgo(87), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Closed" },
    ],
  },
  {
    id: "PO-3003", poNumber: "PO-3003", supplierId: "SUP-02",
    status: "Ordered", orderDate: daysAgo(27), expectedDeliveryDate: daysAgo(7),
    lines: [{ id: "POL-3003-1", materialId: "M06", orderedQty: 80, uom: "NOS", unitPrice: 650, receivedQty: 0, acceptedQty: 0, rejectedQty: 0 }],
    grns: [],
    history: [
      { id: "C1", date: daysAgo(27), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "PO Created" },
      { id: "C2", date: daysAgo(26), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Approved" },
      { id: "C3", date: daysAgo(26), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "Sent to Supplier" },
      { id: "C4", date: daysAgo(2), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Escalation email sent", comment: "7 days overdue against WO-1002 need date; no firm new ETA received yet." },
    ],
  },
  {
    id: "PO-3004", poNumber: "PO-3004", supplierId: "SUP-02", sourceRequisitionId: "PR-2005",
    status: "Partially Received", orderDate: daysAgo(18), expectedDeliveryDate: daysAgo(2),
    lines: [{ id: "POL-3004-1", materialId: "M18", orderedQty: 40, uom: "NOS", unitPrice: 1850, receivedQty: 20, acceptedQty: 20, rejectedQty: 0 }],
    grns: [{ id: "GRN-3004-1", grnNumber: "GRN-5014", date: daysAgo(2), lines: [{ poLineId: "POL-3004-1", qty: 20, lotNumber: "TNFW-DN100-1102" }], inspectionStatus: "passed", inspector: "Divya Lakshmi", remarks: "First half of order received; balance 20 NOS still outstanding and now overdue." }],
    history: [
      { id: "D1", date: daysAgo(18), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "PO Created" },
      { id: "D2", date: daysAgo(17), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Approved" },
      { id: "D3", date: daysAgo(2), byUser: "Suresh Babu", byRole: "Store/Inventory Manager", action: "Goods Received (GRN-5014) — partial, 20 of 40" },
      { id: "D4", date: daysAgo(2), byUser: "Divya Lakshmi", byRole: "Quality Inspector", action: "Inspection Passed (partial receipt)" },
    ],
  },
  {
    id: "PO-3005", poNumber: "PO-3005", supplierId: "SUP-04",
    status: "Closed", orderDate: daysAgo(22), expectedDeliveryDate: daysAgo(15),
    lines: [
      { id: "POL-3005-1", materialId: "M08", orderedQty: 70, uom: "NOS", unitPrice: 4200, receivedQty: 70, acceptedQty: 70, rejectedQty: 0 },
      { id: "POL-3005-2", materialId: "M09", orderedQty: 26, uom: "NOS", unitPrice: 6800, receivedQty: 26, acceptedQty: 26, rejectedQty: 0 },
      { id: "POL-3005-3", materialId: "M15", orderedQty: 110, uom: "NOS", unitPrice: 890, receivedQty: 110, acceptedQty: 110, rejectedQty: 0 },
    ],
    grns: [{ id: "GRN-3005-1", grnNumber: "GRN-5007", date: daysAgo(15), lines: [{ poLineId: "POL-3005-1", qty: 70, lotNumber: "SSBC-DN50-0412" }, { poLineId: "POL-3005-2", qty: 26, lotNumber: "SSBC-DN80-0298" }, { poLineId: "POL-3005-3", qty: 110, lotNumber: "SSBC-ERING-0512" }], inspectionStatus: "passed", inspector: "Divya Lakshmi" }],
    history: [
      { id: "E1", date: daysAgo(22), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "PO Created" },
      { id: "E2", date: daysAgo(21), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Approved" },
      { id: "E3", date: daysAgo(15), byUser: "Suresh Babu", byRole: "Store/Inventory Manager", action: "Goods Received (GRN-5007)" },
      { id: "E4", date: daysAgo(14), byUser: "Divya Lakshmi", byRole: "Quality Inspector", action: "Inspection Passed" },
      { id: "E5", date: daysAgo(13), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Closed" },
    ],
  },
  {
    id: "PO-3006", poNumber: "PO-3006", supplierId: "SUP-06",
    status: "Closed", orderDate: daysAgo(27), expectedDeliveryDate: daysAgo(20),
    lines: [
      { id: "POL-3006-1", materialId: "M12", orderedQty: 220, uom: "SET", unitPrice: 185, receivedQty: 220, acceptedQty: 220, rejectedQty: 0 },
      { id: "POL-3006-2", materialId: "M13", orderedQty: 90, uom: "NOS", unitPrice: 420, receivedQty: 90, acceptedQty: 90, rejectedQty: 0 },
    ],
    grns: [{ id: "GRN-3006-1", grnNumber: "GRN-5003", date: daysAgo(20), lines: [{ poLineId: "POL-3006-1", qty: 220, lotNumber: "IFC-M12-3304" }, { poLineId: "POL-3006-2", qty: 90, lotNumber: "IFC-GSK-1187" }], inspectionStatus: "passed", inspector: "Divya Lakshmi" }],
    history: [
      { id: "F1", date: daysAgo(27), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "PO Created" },
      { id: "F2", date: daysAgo(26), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Approved" },
      { id: "F3", date: daysAgo(20), byUser: "Suresh Babu", byRole: "Store/Inventory Manager", action: "Goods Received (GRN-5003)" },
      { id: "F4", date: daysAgo(19), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Closed" },
    ],
  },
  {
    id: "PO-3007", poNumber: "PO-3007", supplierId: "SUP-05",
    status: "Received", orderDate: daysAgo(16), expectedDeliveryDate: daysAgo(6),
    lines: [
      { id: "POL-3007-1", materialId: "M10", orderedQty: 85, uom: "KG", unitPrice: 1650, receivedQty: 85, acceptedQty: 60, rejectedQty: 0 },
      { id: "POL-3007-2", materialId: "M11", orderedQty: 10, uom: "CYL", unitPrice: 1200, receivedQty: 10, acceptedQty: 10, rejectedQty: 0 },
    ],
    grns: [{ id: "GRN-3007-1", grnNumber: "GRN-5012", date: daysAgo(6), lines: [{ poLineId: "POL-3007-1", qty: 60, lotNumber: "WAC-ER316L-5510" }, { poLineId: "POL-3007-1", qty: 25, lotNumber: "WAC-ER316L-5511" }, { poLineId: "POL-3007-2", qty: 10, lotNumber: "WAC-AR-7701" }], inspectionStatus: "pending", inspector: "Divya Lakshmi", remarks: "Lot WAC-ER316L-5511 (25kg) quarantined — mill certificate markings illegible, pending supplier re-verification." }],
    history: [
      { id: "G1", date: daysAgo(16), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "PO Created" },
      { id: "G2", date: daysAgo(15), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Approved" },
      { id: "G3", date: daysAgo(6), byUser: "Suresh Babu", byRole: "Store/Inventory Manager", action: "Goods Received (GRN-5012)" },
      { id: "G4", date: daysAgo(6), byUser: "Divya Lakshmi", byRole: "Quality Inspector", action: "Partial Inspection Hold", comment: "25kg lot quarantined pending certificate re-verification; 60kg passed and released to stock." },
    ],
  },
  {
    id: "PO-3008", poNumber: "PO-3008", supplierId: "SUP-03",
    status: "Closed", orderDate: daysAgo(38), expectedDeliveryDate: daysAgo(23),
    lines: [
      { id: "POL-3008-1", materialId: "M04", orderedQty: 480, uom: "M", unitPrice: 980, receivedQty: 480, acceptedQty: 480, rejectedQty: 0 },
      { id: "POL-3008-2", materialId: "M05", orderedQty: 210, uom: "M", unitPrice: 1450, receivedQty: 210, acceptedQty: 210, rejectedQty: 0 },
    ],
    grns: [
      { id: "GRN-3008-1", grnNumber: "GRN-4988", date: daysAgo(30), lines: [{ poLineId: "POL-3008-1", qty: 280, lotNumber: "PTI-T50-1187" }, { poLineId: "POL-3008-2", qty: 210, lotNumber: "PTI-T76-0931" }], inspectionStatus: "passed", inspector: "Divya Lakshmi" },
      { id: "GRN-3008-2", grnNumber: "GRN-5010", date: daysAgo(25), lines: [{ poLineId: "POL-3008-1", qty: 200, lotNumber: "PTI-T50-1240" }], inspectionStatus: "passed", inspector: "Divya Lakshmi" },
    ],
    history: [
      { id: "H1a", date: daysAgo(38), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "PO Created" },
      { id: "H2a", date: daysAgo(37), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Approved" },
      { id: "H3c", date: daysAgo(23), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Closed" },
    ],
  },
  {
    id: "PO-3009", poNumber: "PO-3009", supplierId: "SUP-07",
    status: "Received", orderDate: daysAgo(19), expectedDeliveryDate: daysAgo(10),
    lines: [{ id: "POL-3009-1", materialId: "M14", orderedQty: 150, uom: "LTR", unitPrice: 310, receivedQty: 150, acceptedQty: 150, rejectedQty: 0 }],
    grns: [{ id: "GRN-3009-1", grnNumber: "GRN-5011", date: daysAgo(10), lines: [{ poLineId: "POL-3009-1", qty: 150, lotNumber: "SCIP-EPX-2241" }], inspectionStatus: "passed", inspector: "Divya Lakshmi" }],
    history: [
      { id: "I1", date: daysAgo(19), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "PO Created" },
      { id: "I2", date: daysAgo(18), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Approved" },
      { id: "I3", date: daysAgo(10), byUser: "Suresh Babu", byRole: "Store/Inventory Manager", action: "Goods Received (GRN-5011)" },
      { id: "I4", date: daysAgo(9), byUser: "Divya Lakshmi", byRole: "Quality Inspector", action: "Inspection Passed" },
    ],
  },
  {
    id: "PO-3010", poNumber: "PO-3010", supplierId: "SUP-02",
    status: "Closed", orderDate: daysAgo(85), expectedDeliveryDate: daysAgo(72),
    lines: [{ id: "POL-3010-1", materialId: "M06", orderedQty: 120, uom: "NOS", unitPrice: 630, receivedQty: 120, acceptedQty: 120, rejectedQty: 0 }],
    grns: [{ id: "GRN-3010-1", grnNumber: "GRN-4820", date: daysAgo(73), lines: [{ poLineId: "POL-3010-1", qty: 120, lotNumber: "TNFW-CS50-0771" }], inspectionStatus: "passed", inspector: "Divya Lakshmi" }],
    history: [
      { id: "J1", date: daysAgo(85), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "PO Created" },
      { id: "J2", date: daysAgo(84), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Approved" },
      { id: "J3", date: daysAgo(73), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Closed", comment: "Delivered a day ahead of the expected date." },
    ],
  },
  {
    id: "PO-3011", poNumber: "PO-3011", supplierId: "SUP-02",
    status: "Closed", orderDate: daysAgo(65), expectedDeliveryDate: daysAgo(55),
    lines: [{ id: "POL-3011-1", materialId: "M07", orderedQty: 100, uom: "NOS", unitPrice: 1220, receivedQty: 100, acceptedQty: 95, rejectedQty: 5 }],
    grns: [{ id: "GRN-3011-1", grnNumber: "GRN-4865", date: daysAgo(50), lines: [{ poLineId: "POL-3011-1", qty: 100, lotNumber: "TNFW-SS80-0845" }], inspectionStatus: "passed", inspector: "Divya Lakshmi", remarks: "5 NOS rejected for flange face surface defects." }],
    history: [
      { id: "K1", date: daysAgo(65), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "PO Created" },
      { id: "K2", date: daysAgo(64), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Approved" },
      { id: "K3", date: daysAgo(50), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Closed", comment: "Delivered 5 days after the expected date; 5 NOS rejected on inspection." },
    ],
  },
  {
    id: "PO-3012", poNumber: "PO-3012", supplierId: "SUP-02",
    status: "Closed", orderDate: daysAgo(50), expectedDeliveryDate: daysAgo(44),
    lines: [{ id: "POL-3012-1", materialId: "M17", orderedQty: 30, uom: "NOS", unitPrice: 1450, receivedQty: 30, acceptedQty: 30, rejectedQty: 0 }],
    grns: [{ id: "GRN-3012-1", grnNumber: "GRN-4903", date: daysAgo(35), lines: [{ poLineId: "POL-3012-1", qty: 30, lotNumber: "TNFW-HP50-0902" }], inspectionStatus: "passed", inspector: "Divya Lakshmi" }],
    history: [
      { id: "L1", date: daysAgo(50), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "PO Created" },
      { id: "L2", date: daysAgo(49), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Approved" },
      { id: "L3", date: daysAgo(35), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Closed", comment: "Delivered 9 days after the expected date." },
    ],
  },
  {
    id: "PO-3013", poNumber: "PO-3013", supplierId: "SUP-03",
    status: "Closed", orderDate: daysAgo(75), expectedDeliveryDate: daysAgo(60),
    lines: [{ id: "POL-3013-1", materialId: "M04", orderedQty: 150, uom: "M", unitPrice: 960, receivedQty: 150, acceptedQty: 150, rejectedQty: 0 }],
    grns: [{ id: "GRN-3013-1", grnNumber: "GRN-4760", date: daysAgo(60), lines: [{ poLineId: "POL-3013-1", qty: 150, lotNumber: "PTI-T50-0990" }], inspectionStatus: "passed", inspector: "Divya Lakshmi" }],
    history: [
      { id: "M1", date: daysAgo(75), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "PO Created" },
      { id: "M2", date: daysAgo(74), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Approved" },
      { id: "M3", date: daysAgo(60), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Closed" },
    ],
  },
  {
    id: "PO-3014", poNumber: "PO-3014", supplierId: "SUP-04",
    status: "Closed", orderDate: daysAgo(60), expectedDeliveryDate: daysAgo(45),
    lines: [{ id: "POL-3014-1", materialId: "M15", orderedQty: 80, uom: "NOS", unitPrice: 870, receivedQty: 80, acceptedQty: 80, rejectedQty: 0 }],
    grns: [{ id: "GRN-3014-1", grnNumber: "GRN-4700", date: daysAgo(45), lines: [{ poLineId: "POL-3014-1", qty: 80, lotNumber: "SSBC-ERING-0400" }], inspectionStatus: "passed", inspector: "Divya Lakshmi" }],
    history: [
      { id: "N1", date: daysAgo(60), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "PO Created" },
      { id: "N2", date: daysAgo(59), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Approved" },
      { id: "N3", date: daysAgo(45), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Closed" },
    ],
  },
  {
    id: "PO-3015", poNumber: "PO-3015", supplierId: "SUP-05",
    status: "Closed", orderDate: daysAgo(70), expectedDeliveryDate: daysAgo(60),
    lines: [{ id: "POL-3015-1", materialId: "M16", orderedQty: 10, uom: "SET", unitPrice: 2750, receivedQty: 10, acceptedQty: 10, rejectedQty: 0 }],
    grns: [{ id: "GRN-3015-1", grnNumber: "GRN-4620", date: daysAgo(60), lines: [{ poLineId: "POL-3015-1", qty: 10, lotNumber: "WAC-DPKIT-0050" }], inspectionStatus: "passed", inspector: "Divya Lakshmi" }],
    history: [
      { id: "O1", date: daysAgo(70), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "PO Created" },
      { id: "O2", date: daysAgo(69), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Approved" },
      { id: "O3", date: daysAgo(59), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Closed" },
    ],
  },
  {
    id: "PO-3016", poNumber: "PO-3016", supplierId: "SUP-06",
    status: "Closed", orderDate: daysAgo(75), expectedDeliveryDate: daysAgo(65),
    lines: [{ id: "POL-3016-1", materialId: "M12", orderedQty: 180, uom: "SET", unitPrice: 180, receivedQty: 180, acceptedQty: 180, rejectedQty: 0 }],
    grns: [{ id: "GRN-3016-1", grnNumber: "GRN-4580", date: daysAgo(65), lines: [{ poLineId: "POL-3016-1", qty: 180, lotNumber: "IFC-M12-3250" }], inspectionStatus: "passed", inspector: "Divya Lakshmi" }],
    history: [
      { id: "P1", date: daysAgo(75), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "PO Created" },
      { id: "P2", date: daysAgo(74), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Approved" },
      { id: "P3", date: daysAgo(65), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Closed" },
    ],
  },
  {
    id: "PO-3017", poNumber: "PO-3017", supplierId: "SUP-07",
    status: "Closed", orderDate: daysAgo(90), expectedDeliveryDate: daysAgo(81),
    lines: [{ id: "POL-3017-1", materialId: "M14", orderedQty: 100, uom: "LTR", unitPrice: 305, receivedQty: 100, acceptedQty: 100, rejectedQty: 0 }],
    grns: [{ id: "GRN-3017-1", grnNumber: "GRN-4400", date: daysAgo(81), lines: [{ poLineId: "POL-3017-1", qty: 100, lotNumber: "SCIP-EPX-2100" }], inspectionStatus: "passed", inspector: "Divya Lakshmi" }],
    history: [
      { id: "Q1", date: daysAgo(90), byUser: "Karthik Subramaniam", byRole: "Purchase Officer", action: "PO Created" },
      { id: "Q2", date: daysAgo(89), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Approved" },
      { id: "Q3", date: daysAgo(80), byUser: "Priya Raman", byRole: "Procurement Manager", action: "Closed" },
    ],
  },
];

// -----------------------------------------------------------------------------
// Pre-existing exceptions (not generated by automation rules) — these represent
// issues discovered through normal operational activity rather than a rule run.
// -----------------------------------------------------------------------------
export const seedExceptions: ExceptionItem[] = [
  {
    id: "EXC-9001", category: "Inventory", severity: "Medium",
    title: "Cycle count variance on SS304 Seamless Tube OD50x2mm",
    description: "Perpetual stock for M04 (SS304-TUBE-OD50) shows 480 M on hand, but the weekly cycle count on " + daysAgoLabel(3) + " physically counted 462 M in bin RM-B1 — an 18 M shortfall with no matching issue or GRN transaction.",
    recommendedAction: "Re-count bin RM-B1, check for un-logged issues to WIP, and post a stock adjustment once the variance is confirmed.",
    owner: "Store/Inventory Manager", status: "Open",
    createdAt: daysAgo(3), updatedAt: daysAgo(3),
    affectedEntity: { type: "material", id: "M04", label: "SS304-TUBE-OD50", href: "/materials/M04" },
    history: [{ id: "EH1", date: daysAgo(3), byUser: "Suresh Babu", byRole: "Store/Inventory Manager", action: "Logged from weekly cycle count", comment: "Flagged for investigation before posting any adjustment." }],
  },
  {
    id: "EXC-9002", category: "Quality", severity: "Medium",
    title: "Welding wire lot quarantined — certificate re-verification pending",
    description: "Lot WAC-ER316L-5511 (25 KG of M10 Welding Filler Wire ER316L) is quarantined: mill certificate markings on the spool label are illegible. The lot is blocked from allocation to any production order until Quality confirms traceability with the supplier.",
    recommendedAction: "Quality Inspector to obtain a re-issued certificate from Weldarc Consumables and either release or reject the lot.",
    owner: "Quality Inspector", status: "Acknowledged", statusReason: "Follow-up email sent to supplier; awaiting response.",
    createdAt: daysAgo(6), updatedAt: daysAgo(1),
    affectedEntity: { type: "lot", id: "LOT-013", label: "LOT-013 (WAC-ER316L-5511)", href: "/materials/M10" },
    history: [
      { id: "EH2a", date: daysAgo(6), byUser: "Divya Lakshmi", byRole: "Quality Inspector", action: "Logged from GRN-5012 inspection" },
      { id: "EH2b", date: daysAgo(1), byUser: "Divya Lakshmi", byRole: "Quality Inspector", action: "Acknowledged", comment: "Follow-up email sent to supplier; awaiting response." },
    ],
  },
];

function daysAgoLabel(n: number): string {
  // Small helper only used to produce a human-readable phrase inside a description string above.
  return new Date(Date.now() - n * 86400000).toLocaleDateString("en-IN", { month: "short", day: "2-digit" });
}
