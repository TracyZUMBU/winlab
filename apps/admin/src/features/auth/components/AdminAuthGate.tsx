import type { ReactNode } from "react";
import { isSupabaseConfigured } from "../../../lib/supabase";
import { AdminAuthProvider } from "../context/AdminAuthContext";
import { useAdminAuthorization } from "../hooks/useAdminAuthorization";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { AdminAccessDeniedPage } from "../pages/AdminAccessDeniedPage";
import { LoginPage } from "../pages/LoginPage";

type AdminAuthGateProps = {
  children: ReactNode;
};

/**
 * Garde globale : config Supabase → session Auth → `profiles.is_admin === true` → application.
 * Seuls les comptes marqués administrateur en base accèdent au dashboard (aligné sur les RPC admin).
 */
export function AdminAuthGate({ children }: AdminAuthGateProps) {
  const authState = useCurrentUser();
  const adminAuth = useAdminAuthorization(authState.status === "ready" ? authState.user : null);

  if (!isSupabaseConfigured()) {
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

  if (adminAuth.status === "loading" || adminAuth.status === "idle") {
    return (
      <div className="auth-login">
        <div className="auth-login__card">
          <p className="auth-login__subtitle" role="status">
            Vérification des droits administrateur…
          </p>
        </div>
      </div>
    );
  }

  if (!adminAuth.allowed) {
    return <AdminAccessDeniedPage user={authState.user} />;
  }

  return <AdminAuthProvider user={authState.user}>{children}</AdminAuthProvider>;
}
