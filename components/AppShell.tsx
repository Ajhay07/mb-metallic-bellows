"use client";
import { RoleProvider } from "@/lib/client/RoleContext";
import { Sidebar } from "./Sidebar";
import { SearchBox } from "./SearchBox";
import { RoleSwitcher } from "./RoleSwitcher";
import { NotificationsBell } from "./NotificationsBell";
import { Logo } from "./Logo";
import { EntryScreen } from "./EntryScreen";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <EntryScreen />
      <div className="flex min-h-screen bg-graphite-50">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center gap-4 border-b border-graphite-200 bg-white px-4 no-print">
            <div className="md:hidden">
              <Logo compact />
            </div>
            <div className="flex-1">
              <SearchBox />
            </div>
            <span className="hidden items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 lg:inline-flex">
              DEMO DATA MODE
            </span>
            <NotificationsBell />
            <RoleSwitcher />
          </header>
          <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </RoleProvider>
  );
}
