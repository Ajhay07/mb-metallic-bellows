# MB Metallic Bellows — Operations Management System (Demo)

A client-facing **demo** of an internal Operations Management System for **MB Metallic
Bellows Pvt. Ltd.**, an industrial manufacturer of metallic bellows / expansion joints
based in SIPCOT Industrial Growth Centre, Oragadam, Tamil Nadu.

> **This is DEMO DATA MODE.** Every record in this app — materials, suppliers,
> purchase orders, production orders, exceptions — is synthetic seed data generated
> for this demo. The app is **not** connected to any real ERP system. This is labelled
> throughout the UI (sidebar badge, ERP Integration Centre) and is never implied
> otherwise.

## What's built (Phase 1)

This is a deliberately scoped **Phase 1** slice of a much larger enterprise spec:
fewer modules than a full 3-phase rollout, but each one real, interconnected and
functional — no placeholder screens, no dead buttons, no invented numbers.

| Module | What it does |
|---|---|
| **Operations Command Centre** (`/`) | KPIs computed live from the dataset (active production orders, open POs, materials below reorder point, critical shortages, overdue deliveries, at-risk production orders, pending inspections/approvals, on-time delivery %, schedule attainment), a compact production schedule, a critical-shortages panel, a supplier delivery tracker, and a prioritized exception/action queue. Every card links to the real filtered list. |
| **Materials & Inventory** (`/materials`) | 18 materials (SS sheets/coils, tubes, bought-out bellows elements, flanges, welding consumables, fasteners, gaskets, paint, QA consumables) with on-hand/reserved/available/incoming, reorder point, safety stock, warehouse/bin, lot/batch tracking, inspection status, a stock movement ledger, and a manual adjustment tool. |
| **Supplier Directory** (`/suppliers`) | 7 suppliers with profile pages: materials supplied, lead times, full PO history, on-time % (all-time and recent), rejection history, open overdue orders, and a clearly-labelled **demo risk score** with every input shown and its formula spelled out. |
| **Procurement** (`/procurement/requisitions`, `/procurement/purchase-orders`) | A real state machine: Draft → Pending Approval → Approved → (→ Ordered for POs) → Partially Received → Received → Closed, with Rejected/Cancelled as terminal states. Transitions are validated **server-side** — a Rejected requisition can never become Approved no matter what the client sends. Includes create forms, approve/reject with an audit trail, PR→PO conversion, goods receipt (GRN), and per-lot inspection (pass/fail). |
| **BOM + MRP** (`/boms`, `/mrp`) | 5 finished-product BOMs (components, qty-per-unit, scrap %, revision, consuming stage). The MRP screen computes gross requirement (Σ order qty × qty-per-unit × (1+scrap%) across open production orders), net requirement (gross − available − confirmed incoming), and a suggested purchase quantity — with a drill-down from shortage → BOM line → production order → stock → PO. |
| **Production** (`/production`) | 10 production orders across 5 products, with a 10-stage routing (Material Prep → Cutting → Forming → Welding → Assembly → Dimensional Inspection → Leak Test → Final QA → Packing → Completed), a material-readiness gate that blocks "start" when a required material is short or quarantined, delay-reason tracking, hold/resume, and full stage history. |
| **Exceptions Inbox** (`/exceptions`) | A unified queue across Procurement/Inventory/Production/Supplier/Quality, ranked by a transparent rule (severity, then deadline proximity, then age — not an opaque AI score), with status workflow (Open → Acknowledged → Resolved / Dismissed-with-reason) and full audit history. |
| **Automation Centre** (`/automation`) | 5 deterministic, server-side rule evaluators (see below) runnable on demand via **Run Checks Now**, with full run history and results feeding directly into the Exceptions Inbox. |
| **ERP Integration Centre** (`/integration`) | Connection status explicitly reads "Demo Data Mode (Not Connected)". A real (if simplified) CSV import pipeline — upload → preview/validate → commit — that updates existing materials' reorder point, safety stock, cost and lead time. Import history table. A clearly labelled "Planned" list for what a real ERP adapter would need. |
| **Reports** (`/reports`) | Purchase Register, Material Shortage Report, Production Status Report, Supplier Performance Report — real tables from the live dataset, each with CSV export and a print-friendly view (`window.print()` with print-only CSS). |

A demo **role switcher** (top-right) lets you view the app as any of 7 roles:
Administrator, Procurement Manager, Purchase Officer, Production Planner,
Store/Inventory Manager, Quality Inspector, and Management (read-only). This is a
cookie-based convenience for demoing the UI, **not real authentication** — but every
mutating API route re-checks the role's permission server-side (see
`lib/auth/roles.ts` and `lib/api/helpers.ts`), so switching roles genuinely changes
what you're allowed to do, not just what buttons are visible.

## The seeded scenarios

The dataset in `lib/data/seed.ts` is hand-built so every number agrees with every
other number (BOM math, MRP math, PO quantities, dates). It deliberately contains:

1. A **critical SS316 coil shortage** (`SS316-COIL-0.3MM`) affecting two production
   orders (`WO-1003`, `WO-1004`) that both hydroform bellows elements from it.
2. An **overdue supplier delivery** (`PO-3003`, carbon-steel flanges from Tamil Nadu
   Flange Works) threatening `WO-1002`'s deadline.
3. A **requisition pending approval** beyond its SLA (`PR-2001`).
4. A **partially-received purchase order** (`PO-3004`, 20 of 40 flanges received).
5. A **quarantined lot** (`LOT-013`, welding wire held pending a mill-certificate
   re-check) that is excluded from availability everywhere it's checked.
6. A **production order delayed by missing components** (`WO-1005`, on hold,
   waiting on `SS-FLANGE-DN100`).
7. A **supplier with declining on-time performance** (Tamil Nadu Flange Works:
   historically on time → now 20% all-time / 0% on its last 3 orders, 2 currently
   overdue, demo risk score 85/High).
8. A **reorder recommendation** that drafts (but never submits) a requisition
   (`FASTENER-SET-M12`, below reorder point with no open PO).
9. A **fully materially-ready production order** (`WO-1001`).
10. An **inventory discrepancy** flagged for human review (a cycle-count variance
    on `SS304-TUBE-OD50`).

## Automation rules implemented

All five run as plain, auditable functions in `lib/automation/rules.ts` — no ML,
no opaque scoring. "Run Checks Now" evaluates all five against the current data and
upserts matching rows into the Exceptions Inbox (idempotent — re-running updates
existing open exceptions instead of duplicating them).

1. **Predictive Material Shortage Alerts** — runs the MRP net-requirement
   calculation for every material and raises an alert for every one with
   `netRequirement > 0`, severity scaled by how soon it's needed.
2. **Reorder Recommendations** — flags materials below `reorderPoint` (on-hand +
   incoming) and **drafts** (never auto-submits) a requisition sized to
   `reorderPoint + safetyStock`.
3. **Supplier Delay Detection** — flags open purchase orders whose expected
   delivery date has passed, severity scaled by days overdue.
4. **Production Readiness Checks** — flags Not Started / On Hold production
   orders that can't start cleanly (material short or quarantined), severity
   scaled by order priority and how soon it's due to start.
5. **Approval Escalation (SLA Breach)** — flags requisitions/POs sitting in
   Pending Approval beyond a 24h/48h SLA.

## Tech stack & architecture

- **Next.js 14 (App Router) + TypeScript + Tailwind CSS + lucide-react.**
- **Palette:** graphite/steel-grey/white with a single muted steel-blue accent —
  intentionally industrial, not a generic AI-SaaS gradient/glassmorphism look.
  See `tailwind.config.ts` (`graphite` / `steel` color scales).
- **Data layer (current, documented here deliberately):** a typed, in-memory data
  module (`lib/data/seed.ts` + `lib/data/store.ts`) loaded server-side and mutated
  only through Next.js Route Handlers (`app/api/**`), which implement the real
  business logic — stock availability math (`lib/domain/stock.ts`), MRP netting
  (`lib/domain/mrp.ts`), procurement/production state machines
  (`lib/domain/workflow.ts`, `lib/domain/production.ts`), supplier performance and
  the demo risk score (`lib/domain/supplier.ts`), and the automation rule engine
  (`lib/automation/rules.ts`). Nothing is computed or stored only in the browser.
  **This is a deliberate placeholder for a real database** — swapping
  `lib/data/store.ts` for a Postgres/Prisma-backed module would not require any
  change to the route handlers or domain logic, since they already treat the store
  as the single source of truth and never reach into component state.
- State resets to the seed dataset whenever the server process restarts (there is
  no persistent volume in this demo).

## Running it

```bash
npm install
npm run dev
# open http://localhost:3000
```

Production build / checks used during development:

```bash
npm run build   # next build — type-checks the whole project
npm run lint    # next lint
```

## Demo role-switching

Click the user menu in the top bar (shows the current demo user and role) to
switch between the 7 roles. The sidebar/buttons update to match what that role can
do, and the underlying API routes enforce the same permission matrix
(`lib/auth/roles.ts`) — e.g. switching to **Quality Inspector** and trying to
approve a purchase order will be rejected by the server with a 403, not just hidden
in the UI.

## What's demo-only vs. planned

**Demo-only / simplified (by design, documented in code comments where relevant):**
- Authentication is a cookie-based role switcher, not a real login system.
- `reservedQty` on a material is a simplified aggregate "committed elsewhere"
  figure rather than a full per-order reservation ledger.
- Per-order production readiness checks each order's full remaining BOM demand
  against **current available stock**, independently of other orders — it does
  not perform the same cross-order netting that the MRP screen does. This means
  MRP (which nets across *all* open orders) can show a small shortage on a
  material that every individual order's readiness check still passes — that's
  the intended difference between a simple stock gate and full MRP, and it's one
  more thing the Automation Centre's predictive-shortage rule exists to catch.
- The demo supplier **risk score** is an illustrative, fully transparent formula
  over observable PO history — not a real credit/compliance risk product.
- The CSV importer only **updates existing** material codes (reorder point, safety
  stock, cost, lead time) — it does not create new materials or import other
  record types yet.

**Planned / not implemented (clearly labelled "Planned" in the ERP Integration
Centre, never implied as working):**
- A real ERP API adapter (SAP / Oracle / Tally, etc.) for materials, suppliers,
  POs and GRNs.
- Scheduled/incremental sync with conflict resolution.
- Two-way sync (pushing PO status and GRN confirmations back to the source ERP).
- A field-mapping UI between a source ERP schema and this system's data model.
- RFQ (request-for-quotation) management ahead of PO creation — the procurement
  flow currently goes straight from an approved requisition to a purchase order.
- A persistent database (see "Tech stack & architecture" above).

## What a real ERP integration would require

To turn the ERP Integration Centre from a demo stub into a real integration:
1. An authenticated API adapter per source system (REST/OData for SAP or Oracle,
   or a scheduled flat-file/DB export for Tally-style systems), with credentials
   stored outside the app (secrets manager, not source control).
2. A durable database (Postgres via Prisma is the natural fit given the existing
   typed domain models in `lib/types.ts`) so imported/synced data survives
   restarts and scales past a single Node process.
3. A field-mapping layer so each source system's schema can be mapped to this
   app's material/supplier/PO/GRN shapes without code changes per customer.
4. A sync scheduler with conflict resolution (last-write-wins is not enough once
   two systems can both change the same purchase order).
5. Write-back support so actions taken here (GRN posting, inspection results,
   PO status) can flow back to the source ERP, not just read from it.

## Branding note

"MB METALLIC BELLOWS" is rendered here as a simple geometric wordmark and mark
(three corrugated/accordion strokes, evoking a bellows convolution) in a
temporary graphite/steel palette chosen for this demo. **This is not an official
company logo or brand palette** — it exists purely so the demo doesn't look
unbranded, and should be replaced with real brand assets before any external use.
