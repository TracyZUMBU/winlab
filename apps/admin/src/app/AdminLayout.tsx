import { Outlet } from "react-router-dom";
import { useState } from "react";
import { useAdminAuthUser } from "../features/auth";
import { getSupabaseClient } from "../lib/supabase";
import { AdminSidebar } from "./AdminSidebar";

/** Sidebar, zone de contenu (`<Outlet />`). */
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
      <AdminSidebar
        sessionEmail={sessionEmail}
        isSigningOut={isSigningOut}
        onSignOut={handleSignOut}
      />
      <div className="admin-layout__content">
        <main className="admin-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
