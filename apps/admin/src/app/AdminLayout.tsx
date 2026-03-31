import { Link, Outlet } from "react-router-dom";
import { useState } from "react";
import { useAdminAuthUser } from "../features/auth/AdminAuthContext";
import { getSupabaseClient } from "../lib/supabase";

/** En-tête, navigation minimale, déconnexion, zone de contenu (`<Outlet />`). */
export function AdminLayout() {
  const adminUser = useAdminAuthUser();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const sessionEmail = adminUser.email ?? null;

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await getSupabaseClient().auth.signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="admin-layout">
      <header className="admin-layout__header">
        <div className="admin-layout__header-row">
          <h1 className="admin-layout__title">
            <Link to="/" className="admin-layout__brand-link">
              Winlab Admin
            </Link>
          </h1>
          <nav className="admin-layout__nav" aria-label="Navigation principale">
            <Link to="/lotteries" className="admin-layout__nav-link">
              Lotteries
            </Link>
            {sessionEmail && (
              <span className="admin-layout__session" title={sessionEmail}>
                {sessionEmail}
              </span>
            )}
            <button
              type="button"
              className="admin-layout__logout"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? "Déconnexion…" : "Se déconnecter"}
            </button>
          </nav>
        </div>
      </header>
      <main className="admin-layout__main">
        <Outlet />
      </main>
    </div>
  );
}
