import type { ReactNode } from "react";
import { isAdminUser } from "../../lib/auth/isAdminUser";
import { isSupabaseConfigured } from "../../lib/supabase";
import { AdminAccessDeniedPage } from "./AdminAccessDeniedPage";
import { AdminAuthProvider } from "./AdminAuthContext";
import { LoginPage } from "./LoginPage";
import { useCurrentUser } from "./useCurrentUser";

type AdminAuthGateProps = {
  children: ReactNode;
};

/**
 * Garde globale : config → session → allowlist → application.
 */
export function AdminAuthGate({ children }: AdminAuthGateProps) {
  const authState = useCurrentUser();

  if (!isSupabaseConfigured) {
    return (
      <div className="auth-login">
        <div className="auth-login__card">
          <h1 className="auth-login__title">Configuration manquante</h1>
          <p className="auth-login__subtitle">
            Définir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans{" "}
            <code className="page-lottery-detail__code">apps/admin/.env</code>.
          </p>
        </div>
      </div>
    );
  }

  if (authState.status === "loading") {
    return (
      <div className="auth-login">
        <div className="auth-login__card">
          <p className="auth-login__subtitle" role="status">
            Vérification de la session…
          </p>
        </div>
      </div>
    );
  }

  if (!authState.user) {
    return <LoginPage />;
  }

  if (!isAdminUser(authState.user)) {
    return <AdminAccessDeniedPage user={authState.user} />;
  }

  return <AdminAuthProvider user={authState.user}>{children}</AdminAuthProvider>;
}
