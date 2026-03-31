import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";
import { LotteryDetailPage } from "../pages/LotteryDetailPage";
import { LotteriesPage } from "../pages/LotteriesPage";

/** Routes minimales : `/` → liste, `/lotteries`, `/lotteries/:lotteryId`. */
export function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Navigate to="/lotteries" replace />} />
        <Route path="lotteries" element={<LotteriesPage />} />
        <Route path="lotteries/:lotteryId" element={<LotteryDetailPage />} />
      </Route>
    </Routes>
  );
}
