import { Home, LayoutList, LogOut, Settings2 } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { clearAuthToken } from "@/lib/api";

const navClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-all duration-200 ${
    isActive
      ? "bg-slate-800 text-white shadow-sm"
      : "text-slate-200 hover:bg-slate-800/70 hover:text-white"
  }`;

export const AdminLayout = () => {
  const navigate = useNavigate();

  const logout = () => {
    clearAuthToken();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen grid md:grid-cols-[260px_1fr]" data-testid="admin-layout-root">
      <aside
        className="bg-slate-950 border-r border-slate-800 p-6 md:p-8"
        data-testid="admin-sidebar"
      >
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400" data-testid="admin-brand-label">
            LendFlow Admin
          </p>
          <h2 className="text-2xl font-semibold text-slate-100" data-testid="admin-brand-heading">
            Underwriting Hub
          </h2>
        </div>

        <nav className="space-y-3" data-testid="admin-sidebar-nav">
          <NavLink to="/admin" end className={navClass} data-testid="admin-nav-dashboard-link">
            <Home size={16} /> Dashboard
          </NavLink>
          <NavLink to="/admin/rules" className={navClass} data-testid="admin-nav-rules-link">
            <Settings2 size={16} /> Rules
          </NavLink>
          <NavLink
            to="/admin/architecture"
            className={navClass}
            data-testid="admin-nav-architecture-link"
          >
            <LayoutList size={16} /> Architecture
          </NavLink>
        </nav>

        <Button
          variant="outline"
          className="w-full mt-12 bg-transparent text-slate-100 border-slate-600 hover:bg-slate-800"
          onClick={logout}
          data-testid="admin-logout-button"
        >
          <LogOut size={15} /> Logout
        </Button>
      </aside>

      <main className="p-6 md:p-10 lg:p-14" data-testid="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
};
