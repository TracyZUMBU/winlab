import type { ReactNode } from "react";

type AdminLayoutProps = {
  children: ReactNode;
};

/** En-tête fixe « Winlab Admin » + zone de contenu pour les pages. */
export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="admin-layout">
      <header className="admin-layout__header">
        <h1 className="admin-layout__title">Winlab Admin</h1>
      </header>
      <main className="admin-layout__main">{children}</main>
    </div>
  );
}
