export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 64 64" className="shrink-0">
        <rect width="64" height="64" rx="12" fill="#22262a" />
        <g fill="none" stroke="#5b8fb0" strokeWidth="4" strokeLinecap="round">
          <path d="M14 20 Q20 12 26 20 T38 20 T50 20" />
          <path d="M14 32 Q20 24 26 32 T38 32 T50 32" />
          <path d="M14 44 Q20 36 26 44 T38 44 T50 44" />
        </g>
      </svg>
      {!compact && (
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-wide text-graphite-900">MB METALLIC BELLOWS</div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-graphite-400">Operations Management System</div>
        </div>
      )}
    </div>
  );
}
