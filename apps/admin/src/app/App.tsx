import { Navigate, Route, Routes } from "react-router-dom";
import { AdminAuthGate } from "../features/auth";
import { LotteriesPage, LotteryDetailFromRouteRedirect } from "../features/lotteries";
import { MissionDetailFromRouteRedirect, MissionsPage } from "../features/missions";
import { PushAdminMvpPage } from "../features/push-admin-mvp";
import { AdminLayout } from "./AdminLayout";

/** Routes sous garde : authentification Supabase + `profiles.is_admin` (pas « tout utilisateur connecté »). */
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
          <Route path="missions" element={<MissionsPage />} />
          <Route
            path="missions/:missionId"
            element={<MissionDetailFromRouteRedirect />}
          />
          <Route path="push-mvp" element={<PushAdminMvpPage />} />
        </Route>
      </Routes>
    </AdminAuthGate>
  );
}
