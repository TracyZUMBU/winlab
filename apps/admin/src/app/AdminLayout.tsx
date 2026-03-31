import { Link, Outlet } from "react-router-dom";

/** En-tête, navigation minimale, zone de contenu (`<Outlet />`). */
export function AdminLayout() {
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
          </nav>
        </div>
      </header>
      <main className="admin-layout__main">
        <Outlet />
      </main>
    </div>
  );
}
