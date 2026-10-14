import { store } from "@/lib/data/store";
import type { ExceptionItem, ExceptionSeverity } from "@/lib/types";

const SEVERITY_RANK: Record<ExceptionSeverity, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };

// Transparent, explainable ranking: severity first, then how close the
// deadline is (items with no deadline rank behind items that have one, all
// else equal), then oldest-first so nothing silently ages out of view.
export function rankExceptions(items: ExceptionItem[]): ExceptionItem[] {
  const now = Date.now();
  return [...items].sort((a, b) => {
    const sevDiff = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    if (sevDiff !== 0) return sevDiff;

    const aDeadline = a.deadline ? new Date(a.deadline).getTime() - now : Number.POSITIVE_INFINITY;
    const bDeadline = b.deadline ? new Date(b.deadline).getTime() - now : Number.POSITIVE_INFINITY;
    if (aDeadline !== bDeadline) return aDeadline - bDeadline;

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function getAllExceptionsRanked(): ExceptionItem[] {
  return rankExceptions(store.exceptions);
}
