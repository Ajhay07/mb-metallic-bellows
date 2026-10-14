"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Printer } from "lucide-react";
import { PageHeader, LoadingState, ErrorState, EmptyState } from "@/components/States";

export interface ReportColumn {
  key: string;
  label: string;
  align?: "left" | "right";
}

export function ReportView({ title, description, apiUrl, columns }: { title: string; description: string; apiUrl: string; columns: ReportColumn[] }) {
  const [rows, setRows] = useState<Record<string, string | number>[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl)
      .then((r) => r.json())
      .then((d) => setRows(d.rows))
      .catch(() => setError("Could not load report."));
  }, [apiUrl]);

  if (error) return <ErrorState message={error} />;
  if (!rows) return <LoadingState label="Loading report…" />;

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex gap-2 no-print">
            <a href={`${apiUrl}?format=csv`} download className="btn-secondary"><Download className="h-4 w-4" /> Export CSV</a>
            <button onClick={() => window.print()} className="btn-secondary"><Printer className="h-4 w-4" /> Print</button>
            <Link href="/reports" className="btn-secondary">All reports</Link>
          </div>
        }
      />
      {rows.length === 0 ? (
        <EmptyState title="No rows for this report right now" description="This reflects the current dataset — try again after running automation checks or making changes." />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>{columns.map((c) => <th key={c.key} className={c.align === "right" ? "text-right" : ""}>{c.label}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {columns.map((c) => <td key={c.key} className={c.align === "right" ? "text-right" : ""}>{row[c.key]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
