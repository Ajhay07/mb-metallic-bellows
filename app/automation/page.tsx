"use client";
import { useCallback, useEffect, useState } from "react";
import { Play, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader, LoadingState, ErrorState } from "@/components/States";
import { SeverityBadge } from "@/components/Badges";
import { formatDateTimeShort } from "@/lib/format";
import { useRole } from "@/lib/client/RoleContext";
import { roleHasPermission } from "@/lib/auth/roles";
import type { AutomationRuleDefinition, AutomationRunRecord } from "@/lib/types";

export default function AutomationPage() {
  const { role } = useRole();
  const [rules, setRules] = useState<AutomationRuleDefinition[] | null>(null);
  const [runs, setRuns] = useState<AutomationRunRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const load = useCallback(() => {
    Promise.all([fetch("/api/automation/rules").then((r) => r.json()), fetch("/api/automation/history").then((r) => r.json())])
      .then(([r, h]) => {
        setRules(r.rules);
        setRuns(h.runs);
      })
      .catch(() => setError("Could not load Automation Centre."));
  }, []);
  useEffect(() => load(), [load]);

  async function runNow() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/automation/run", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setRunning(false);
    }
  }

  if (error) return <ErrorState message={error} />;
  if (!rules || !runs) return <LoadingState label="Loading Automation Centre…" />;

  const canRun = roleHasPermission(role, "automation.run");
  const lastRun = runs[0];

  return (
    <div>
      <PageHeader
        breadcrumb={["Automation Centre"]}
        title="Automation Centre"
        description="Deterministic, server-side rule evaluators run against the current dataset. Nothing here uses machine learning or opaque scoring — every rule's condition and action is listed below and reflected exactly in its results."
        actions={canRun ? (
          <button onClick={runNow} disabled={running} className="btn-primary"><Play className="h-4 w-4" />{running ? "Running…" : "Run Checks Now"}</button>
        ) : (
          <span className="text-xs text-graphite-500">Role &ldquo;{role}&rdquo; cannot run automation checks.</span>
        )}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {rules.map((rule) => {
          const lastResult = lastRun?.results.find((r) => r.ruleId === rule.id);
          return (
            <div key={rule.id} className="panel p-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <h2 className="font-semibold text-graphite-900">{rule.name}</h2>
                <span className={`badge ${rule.enabled ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-graphite-300 bg-graphite-100 text-graphite-500"}`}>
                  {rule.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p className="mb-2 text-sm text-graphite-600">{rule.description}</p>
              <dl className="space-y-1 text-xs">
                <div><dt className="inline font-medium text-graphite-500">Trigger: </dt><dd className="inline">{rule.trigger}</dd></div>
                <div><dt className="inline font-medium text-graphite-500">Condition: </dt><dd className="inline font-mono">{rule.conditionSummary}</dd></div>
                <div><dt className="inline font-medium text-graphite-500">Action: </dt><dd className="inline">{rule.actionSummary}</dd></div>
              </dl>
              {lastResult && (
                <div className="mt-3 rounded-md border border-graphite-200 bg-graphite-50 p-2 text-xs">
                  <div className="font-medium text-graphite-700">Last run: {lastResult.findingsCount} finding(s), {lastResult.newExceptions} new, {lastResult.updatedExceptions} updated</div>
                  {lastResult.messages.length > 0 && (
                    <ul className="mt-1 list-inside list-disc text-graphite-500">
                      {lastResult.messages.slice(0, 5).map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 panel p-4">
        <h2 className="mb-3 text-sm font-semibold text-graphite-800">Run History</h2>
        {runs.length === 0 ? (
          <p className="text-sm text-graphite-400">No runs yet.</p>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <div key={run.id} className="rounded-md border border-graphite-200 p-3">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-graphite-900">Run {run.id} — {formatDateTimeShort(run.runAt)}</span>
                  <span className="text-xs text-graphite-500">By {run.runBy} · {run.totalNew} new, {run.totalUpdated} updated</span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {run.results.map((r) => (
                    <div key={r.ruleId} className="rounded border border-graphite-100 bg-graphite-50 p-2 text-xs">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium">{r.ruleName}</span>
                        {r.findingsCount > 0 ? <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" /> : <XCircle className="h-3.5 w-3.5 text-graphite-300" />}
                      </div>
                      <SeverityBadge severity={r.severity} />
                      <span className="ml-2 text-graphite-500">{r.findingsCount} finding(s)</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
