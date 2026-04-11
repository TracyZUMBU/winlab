import { Navigate, Route, Routes } from "react-router-dom";
import { AdminAuthGate } from "../features/auth";
import { LotteriesPage, LotteryDetailFromRouteRedirect } from "../features/lotteries";
import { AdminLayout } from "./AdminLayout";

/** Routes sous garde auth + `profiles.is_admin`. */
export function App() {
  return (
    <AdminAuthGate>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate to="/lotteries" replace />} />
          <Route path="lotteries" element={<LotteriesPage />} />
          <Route
            path="lotteries/:lotteryId"
            element={<LotteryDetailFromRouteRedirect />}
          />
        </Route>
      </Routes>
    </AdminAuthGate>
  );
}
