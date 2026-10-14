// Runs the automation engine once per server process so the Exceptions inbox
// and Automation Centre have a realistic run history as soon as the demo
// loads, rather than starting completely empty. Importing this module (for
// its side effect) is idempotent — see the guard below.
import { store } from "@/lib/data/store";
import { runAllRules } from "./rules";

const globalFlag = globalThis as unknown as { __mbAutomationBootstrapped?: boolean };

function seedAutomationRun() {
  const record = runAllRules("Arun Selvaraj");
  // Backdate the seed run slightly so the dashboard reads "a few hours ago"
  // instead of "just now" on first load.
  record.runAt = new Date(Date.now() - 3 * 3600000).toISOString();
  store.automationRuns[0] = record;
}

if (!globalFlag.__mbAutomationBootstrapped) {
  globalFlag.__mbAutomationBootstrapped = true;
  seedAutomationRun();
}

// Exposed for the demo "Reset Demo Data" action (app/api/admin/reset) — after
// resetStore() wipes the in-memory data back to seed.ts, this regenerates the
// same seed automation run / exceptions the server produces on first boot, so
// a reset looks identical to a fresh server start rather than leaving the
// Automation Centre and Exceptions Inbox empty until someone clicks "Run
// Checks Now".
export function reseedAutomationAfterReset() {
  seedAutomationRun();
}
