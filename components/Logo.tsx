export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 64 64" className="shrink-0">
        <rect width="64" height="64" rx="12" fill="#172033" />
        <g fill="none" stroke="#8cb3cb" strokeWidth="4" strokeLinecap="round">
          <path d="M14 18 Q20 10 26 18 T38 18 T50 18" />
          <path d="M14 32 Q20 24 26 32 T38 32 T50 32" />
        </g>
        <path d="M14 46 Q20 38 26 46 T38 46 T50 46" fill="none" stroke="#f45116" strokeWidth="4" strokeLinecap="round" />
      </svg>
      {!compact && (
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-wide text-graphite-900">MB METALLIC BELLOWS</div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-[color:var(--muted-foreground)]">Operations Management System</div>
        </div>
      )}
    </div>
  );
}

/**
 * Low-contrast corrugated-bellows line art for empty surface corners
 * (sidebar footer, dashboard header). Inline SVG geometry only — no
 * sourced photography exists in this project, and this keeps the motif
 * consistent with the Logo mark instead of introducing stock imagery.
 */
export function BellowsMotif({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 160" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.9">
        <path d="M-10 20 Q10 0 30 20 T70 20 T110 20 T150 20 T190 20 T230 20 T270 20" />
        <path d="M-10 50 Q10 30 30 50 T70 50 T110 50 T150 50 T190 50 T230 50 T270 50" />
        <path d="M-10 80 Q10 60 30 80 T70 80 T110 80 T150 80 T190 80 T230 80 T270 80" />
        <path d="M-10 110 Q10 90 30 110 T70 110 T110 110 T150 110 T190 110 T230 110 T270 110" />
        <path d="M-10 140 Q10 120 30 140 T70 140 T110 140 T150 140 T190 140 T230 140 T270 140" />
      </g>
    </svg>
  );
}
