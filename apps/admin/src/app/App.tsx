import { AdminLayout } from "./AdminLayout";
import { LotteriesPage } from "../pages/LotteriesPage";

/** Point d’entrée UI : layout + page courante (router plus tard si besoin). */
export function App() {
  return (
    <AdminLayout>
      <LotteriesPage />
    </AdminLayout>
  );
}
