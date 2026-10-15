"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

interface SearchResult {
  type: string;
  id: string;
  label: string;
  sublabel: string;
  href: string;
}

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isShortcut = (e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/";
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (isShortcut && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data) => {
          setResults(data.results ?? []);
          setOpen(true);
        })
        .catch(() => setResults([]));
    }, 180);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (results.length > 0) {
      setOpen(false);
      router.push(results[0].href);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={onSubmit} className="relative">
        <button
          type="submit"
          aria-label="Search"
          className="absolute left-0 top-0 flex h-full w-9 items-center justify-center text-graphite-400 hover:text-orange-600 disabled:cursor-default disabled:hover:text-graphite-400"
          disabled={results.length === 0}
        >
          <Search className="h-4 w-4" />
        </button>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search materials, suppliers, POs, PRs, work orders…"
          className="input pl-9 pr-8"
        />
        {query ? (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-graphite-400 hover:text-graphite-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-[color:var(--border)] bg-[color:var(--surface-raised)] px-1.5 py-0.5 text-[10px] font-medium text-graphite-400 sm:inline-flex">
            ⌘K
          </kbd>
        )}
      </form>
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-graphite-200 bg-[color:var(--surface-raised)] shadow-lg">
          {results.map((r) => (
            <button
              key={`${r.type}-${r.id}`}
              onClick={() => {
                setOpen(false);
                setQuery("");
                router.push(r.href);
              }}
              className="flex w-full flex-col items-start gap-0.5 border-b border-graphite-100 px-3 py-2 text-left text-sm last:border-0 hover:bg-graphite-50"
            >
              <span className="flex items-center gap-2">
                <span className="rounded border border-graphite-200 bg-graphite-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-graphite-500">{r.type}</span>
                <span className="font-medium text-graphite-900">{r.label}</span>
              </span>
              <span className="text-xs text-graphite-500">{r.sublabel}</span>
            </button>
          ))}
        </div>
      )}
      {open && results.length === 0 && query.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-graphite-200 bg-[color:var(--surface-raised)] px-3 py-2 text-sm text-graphite-500 shadow-lg">No matches for &ldquo;{query}&rdquo;.</div>
      )}
    </div>
  );
}
