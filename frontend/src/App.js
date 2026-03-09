import "@/App.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import ApplicationReviewPage from "@/pages/ApplicationReviewPage";
import ApplicationSubmittedPage from "@/pages/ApplicationSubmittedPage";
import ArchitecturePage from "@/pages/ArchitecturePage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import OnboardingPage from "@/pages/OnboardingPage";
import RulesManagementPage from "@/pages/RulesManagementPage";

function App() {
  return (
    <div className="min-h-screen app-shell">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<OnboardingPage />} />
          <Route path="/submitted/:applicationId" element={<ApplicationSubmittedPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="dashboard" element={<Navigate to="/admin" replace />} />
              <Route path="applications/:applicationId" element={<ApplicationReviewPage />} />
              <Route path="rules" element={<RulesManagementPage />} />
              <Route path="architecture" element={<ArchitecturePage adminView />} />
            </Route>
          </Route>
        </Routes>
        <Toaster data-testid="global-toast" position="top-right" richColors />
      </BrowserRouter>
    </div>
  );
}

export default App;
