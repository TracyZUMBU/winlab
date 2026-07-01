import { NavLink, useLocation } from "react-router-dom";

import { adminDocEntries } from "../features/docs";

function navLinkClassName(isActive: boolean): string {
  return isActive
    ? "admin-sidebar__link admin-sidebar__link--active"
    : "admin-sidebar__link";
}

function subNavLinkClassName(isActive: boolean): string {
  return isActive
    ? "admin-sidebar__sublink admin-sidebar__sublink--active"
    : "admin-sidebar__sublink";
}

type AdminSidebarProps = {
  sessionEmail: string | null;
  isSigningOut: boolean;
  onSignOut: () => void;
};

export function AdminSidebar({
  sessionEmail,
  isSigningOut,
  onSignOut,
}: AdminSidebarProps) {
  const location = useLocation();
  const isDocsActive = location.pathname.startsWith("/docs");

  return (
    <aside className="admin-sidebar" aria-label="Navigation principale">
      <div className="admin-sidebar__brand">
        <NavLink to="/" className="admin-sidebar__brand-link">
          Wintix Admin
        </NavLink>
      </div>

      <nav className="admin-sidebar__nav">
        <NavLink
          to="/lotteries"
          className={({ isActive }) => navLinkClassName(isActive)}
        >
          Lotteries
        </NavLink>
        <NavLink
          to="/missions"
          className={({ isActive }) => navLinkClassName(isActive)}
        >
          Missions
        </NavLink>
        <NavLink
          to="/push-mvp"
          className={({ isActive }) => navLinkClassName(isActive)}
        >
          Push (MVP)
        </NavLink>

        <div
          className={
            isDocsActive
              ? "admin-sidebar__section admin-sidebar__section--active"
              : "admin-sidebar__section"
          }
        >
          <span className="admin-sidebar__section-label">Docs</span>
          <ul className="admin-sidebar__subnav" aria-label="Mémos">
            {adminDocEntries.map((entry) => (
              <li key={entry.slug}>
                <NavLink
                  to={`/docs/${entry.slug}`}
                  className={({ isActive }) => subNavLinkClassName(isActive)}
                >
                  {entry.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="admin-sidebar__footer">
        {sessionEmail && (
          <span className="admin-sidebar__session" title={sessionEmail}>
            {sessionEmail}
          </span>
        )}
        <button
          type="button"
          className="admin-sidebar__logout"
          onClick={onSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? "Déconnexion…" : "Se déconnecter"}
        </button>
      </div>
    </aside>
  );
}
