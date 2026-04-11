import type { User } from "@supabase/supabase-js";
import { createContext, type ReactNode, useContext } from "react";

/** Utilisateur admin autorisé (rempli uniquement sous `AdminAuthGate` après `profiles.is_admin`). */
export const AdminAuthContext = createContext<User | null>(null);

export function AdminAuthProvider({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  return (
    <AdminAuthContext.Provider value={user}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuthUser(): User {
  const user = useContext(AdminAuthContext);
  if (!user) {
    throw new Error("useAdminAuthUser doit être utilisé sous AdminAuthProvider.");
  }
  return user;
}
