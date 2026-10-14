// DEMO-ONLY role model. There is no real authentication here: the "signed in" role
// is chosen via a cookie-based switcher (see app/api/session/role) purely to show how
// the UI and API-level permission checks would behave per role in a real system.
import type { Role } from "@/lib/types";

export const ROLES: Role[] = [
  "Administrator",
  "Procurement Manager",
  "Purchase Officer",
  "Production Planner",
  "Store/Inventory Manager",
  "Quality Inspector",
  "Management",
];

export const ROLE_COOKIE = "mb_demo_role";
export const USER_COOKIE = "mb_demo_user";

export const DEMO_USERS: Record<Role, string> = {
  Administrator: "Arun Selvaraj",
  "Procurement Manager": "Priya Raman",
  "Purchase Officer": "Karthik Subramaniam",
  "Production Planner": "Meena Krishnan",
  "Store/Inventory Manager": "Suresh Babu",
  "Quality Inspector": "Divya Lakshmi",
  Management: "Rajendran Pillai",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  Administrator: "Full access across all modules, including automation rule configuration.",
  "Procurement Manager": "Approves requisitions and purchase orders, manages supplier relationships.",
  "Purchase Officer": "Raises requisitions and purchase orders, tracks deliveries and GRNs.",
  "Production Planner": "Manages BOMs, MRP, production orders and the production schedule.",
  "Store/Inventory Manager": "Manages stock, lots, GRNs, quarantine and inventory adjustments.",
  "Quality Inspector": "Records inspection results for incoming materials and in-process QA.",
  Management: "Read-only visibility across the entire operation for oversight and review.",
};

export type Permission =
  | "pr.create"
  | "pr.approve"
  | "po.create"
  | "po.approve"
  | "po.receive"
  | "inspection.record"
  | "inventory.adjust"
  | "production.manage"
  | "exceptions.manage"
  | "automation.run"
  | "automation.configure"
  | "import.run"
  | "demo.reset";

const MATRIX: Record<Role, Permission[]> = {
  Administrator: [
    "pr.create",
    "pr.approve",
    "po.create",
    "po.approve",
    "po.receive",
    "inspection.record",
    "inventory.adjust",
    "production.manage",
    "exceptions.manage",
    "automation.run",
    "automation.configure",
    "import.run",
    "demo.reset",
  ],
  "Procurement Manager": [
    "pr.create",
    "pr.approve",
    "po.create",
    "po.approve",
    "exceptions.manage",
    "automation.run",
    "import.run",
  ],
  "Purchase Officer": ["pr.create", "po.create", "exceptions.manage"],
  "Production Planner": ["production.manage", "exceptions.manage", "automation.run"],
  "Store/Inventory Manager": [
    "po.receive",
    "inventory.adjust",
    "exceptions.manage",
    "automation.run",
    "import.run",
  ],
  "Quality Inspector": ["inspection.record", "exceptions.manage"],
  Management: [],
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return MATRIX[role]?.includes(permission) ?? false;
}

export function isValidRole(value: string | undefined | null): value is Role {
  return !!value && (ROLES as string[]).includes(value);
}
