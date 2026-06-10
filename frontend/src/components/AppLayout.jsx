import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import api from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import logoTdf from "../assets/logo.svg";

const ADMIN_ROLE = "admCorradoadm";

function AppLayout({ children }) {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Errore logout:", err);
    } finally {
      setUser(null);
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF7F0] text-[#2B211B]">
      <header className="sticky top-0 z-30 bg-[#F26A00] shadow-[0_18px_40px_-28px_rgba(242,106,0,0.85)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[72px] items-center justify-between gap-4">
            <Link
              to="/dashboard"
              className="flex shrink-0 items-center gap-3 !text-white"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-1.5 shadow-[0_10px_30px_-18px_rgba(43,33,27,0.6)]">
                <img
                  src={logoTdf}
                  alt="Logo TDF"
                  className="h-full w-full object-contain"
                />
              </div>

              <div>
                <div className="text-2xl font-black leading-none tracking-tight !text-white">
                  TDFantasy
                </div>

                <div className="mt-1 hidden text-[11px] font-black uppercase tracking-[0.18em] !text-white/70 sm:block">
                  Memorial
                </div>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 md:flex">
              <MenuLink to="/dashboard">Dashboard</MenuLink>
              <MenuLink to="/my-roster">Gestisci rosa</MenuLink>
              <MenuLink to="/classifica">Classifica</MenuLink>
            </nav>

            <div className="flex items-center gap-2">
              {user?.role === ADMIN_ROLE && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-2 text-sm font-black transition-all active:translate-y-[1px] ${
                      isActive
                        ? "bg-white !text-[#F26A00]"
                        : "border border-white/40 bg-transparent !text-white hover:bg-white hover:!text-[#F26A00]"
                    }`
                  }
                >
                  Admin
                </NavLink>
              )}

              <button
                onClick={handleLogout}
                className="rounded-2xl border border-white/40 px-4 py-2 text-sm font-black !text-white transition-all hover:bg-white hover:!text-[#F26A00] active:translate-y-[1px]"
              >
                Logout
              </button>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto border-t border-white/15 py-3 md:hidden">
            <MobileMenuLink to="/dashboard">Dashboard</MobileMenuLink>
            <MobileMenuLink to="/my-roster">Gestisci rosa</MobileMenuLink>
            <MobileMenuLink to="/classifica">Classifica</MobileMenuLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}

function MenuLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-2xl px-4 py-2 text-sm font-black transition-all ${
          isActive
            ? "bg-white !text-[#F26A00] shadow-[0_10px_26px_-18px_rgba(43,33,27,0.7)]"
            : "!text-white hover:bg-white/15 hover:!text-white"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function MobileMenuLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `shrink-0 rounded-2xl px-4 py-2 text-sm font-black transition-all ${
          isActive
            ? "bg-white !text-[#F26A00]"
            : "bg-white/10 !text-white hover:bg-white/15 hover:!text-white"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default AppLayout;