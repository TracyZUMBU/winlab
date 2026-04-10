import type { User } from "@supabase/supabase-js";
import { useState } from "react";
import { getSupabaseClient } from "../../../lib/supabase";

type AdminAccessDeniedPageProps = {
  user: User;
};

/** Compte valide mais sans droit admin (ni `profiles.is_admin`, ni allowlist de transition). */
export function AdminAccessDeniedPage({ user }: AdminAccessDeniedPageProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await getSupabaseClient().auth.signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="auth-login">
      <div className="auth-login__card">
        <h1 className="auth-login__title">Accès non autorisé</h1>
        <p className="auth-login__subtitle">
          Le compte <strong>{user.email ?? "—"}</strong> n’a pas le rôle administrateur
          requis pour cet outil. Contactez un administrateur si vous pensez qu’il s’agit
          d’une erreur.
        </p>
        <button
          className="auth-login__submit"
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? "Déconnexion…" : "Se déconnecter"}
        </button>
      </div>
    </div>
  );
}
