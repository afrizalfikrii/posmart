import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AdminRoute, ProtectedRoute } from "@/components/ProtectedRoute";
import { ToastContainer } from "@/components/Toast";
import { AppLayout } from "@/layouts/AppLayout";
import { DasborPage } from "@/pages/DasborPage";
import { KasirPage } from "@/pages/KasirPage";
import { LaporanPage } from "@/pages/LaporanPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PengaturanPage } from "@/pages/PengaturanPage";
import { ProdukPage } from "@/pages/ProdukPage";
import { RiwayatPage } from "@/pages/RiwayatPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/kasir" replace />} />
            <Route path="/kasir" element={<KasirPage />} />
            <Route path="/produk" element={<ProdukPage />} />
            <Route path="/riwayat" element={<RiwayatPage />} />
            <Route element={<AdminRoute />}>
              <Route path="/dasbor" element={<DasborPage />} />
              <Route path="/laporan" element={<LaporanPage />} />
              <Route path="/pengaturan" element={<PengaturanPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}
