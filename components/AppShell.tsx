"use client";
import { RoleProvider } from "@/lib/client/RoleContext";
import { Sidebar } from "./Sidebar";
import { SearchBox } from "./SearchBox";
import { RoleSwitcher } from "./RoleSwitcher";
import { NotificationsBell } from "./NotificationsBell";
import { PlantSelector } from "./PlantSelector";
import { Logo } from "./Logo";
import { EntryScreen } from "./EntryScreen";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <EntryScreen />
      <div className="flex min-h-screen bg-[color:var(--surface-app)]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[color:var(--border)] bg-[color:var(--surface-raised)] px-4 shadow-panel no-print">
            <div className="md:hidden">
              <Logo compact />
            </div>
            <div className="flex-1">
              <SearchBox />
            </div>
            <span className="badge hidden border-amber-300 bg-amber-50 text-amber-800 lg:inline-flex">
              Demo Data Mode
            </span>
            <PlantSelector />
            <div className="h-6 w-px shrink-0 bg-[color:var(--border)]" />
            <NotificationsBell />
            <RoleSwitcher />
          </header>
          <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </RoleProvider>
  );
}
