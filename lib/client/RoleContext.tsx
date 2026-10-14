"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Role } from "@/lib/types";

interface RoleContextValue {
  role: Role;
  user: string;
  roles: Role[];
  loading: boolean;
  setRole: (role: Role) => Promise<void>;
}

const RoleContext = createContext<RoleContextValue>({
  role: "Administrator",
  user: "Arun Selvaraj",
  roles: ["Administrator"],
  loading: true,
  setRole: async () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("Administrator");
  const [user, setUser] = useState("Arun Selvaraj");
  const [roles, setRoles] = useState<Role[]>(["Administrator"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/session/role")
      .then((r) => r.json())
      .then((data) => {
        setRoleState(data.role);
        setUser(data.user);
        setRoles(data.roles);
      })
      .finally(() => setLoading(false));
  }, []);

  const setRole = useCallback(async (next: Role) => {
    const res = await fetch("/api/session/role", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: next }) });
    const data = await res.json();
    setRoleState(data.role);
    setUser(data.user);
  }, []);

  return <RoleContext.Provider value={{ role, user, roles, loading, setRole }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  return useContext(RoleContext);
}
