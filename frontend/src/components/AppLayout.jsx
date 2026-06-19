import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import api from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import logoTdf from "../assets/logo.svg";

const ADMIN_ROLE = "admCorradoadm";

function AppLayout({ children }) {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

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

            {/* LOGO */}
            <Link
              to="/dashboard"
              className="flex shrink-0 items-center gap-3 !text-white"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-1.5 shadow-[0_10px_30px_-18px_rgba(43,33,27,0.6)]">
                <img src={logoTdf} alt="Logo TDF" className="h-full w-full object-contain" />
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

            {/* DESKTOP MENU (UNCHANGED) */}
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

              {/* HAMBURGER */}
              <button
                className="md:hidden rounded-xl border border-white/40 px-3 py-2 text-white"
                onClick={() => setMobileOpen(true)}
              >
                ☰
              </button>

              <button
                onClick={handleLogout}
                className="hidden md:block rounded-2xl border border-white/40 px-4 py-2 text-sm font-black !text-white transition-all hover:bg-white hover:!text-[#F26A00]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER ONLY (NEW STYLE) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />

          <div className="absolute right-0 top-0 h-full w-72 bg-white p-5 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="font-black text-black">Menu</p>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-xl font-black"
              >
                ✕
              </button>
            </div>

            <MobileDrawerLink to="/dashboard" onClick={() => setMobileOpen(false)}>
              Dashboard
            </MobileDrawerLink>

            <MobileDrawerLink to="/my-roster" onClick={() => setMobileOpen(false)}>
              Gestisci rosa
            </MobileDrawerLink>

            <MobileDrawerLink to="/classifica" onClick={() => setMobileOpen(false)}>
              Classifica
            </MobileDrawerLink>

            {user?.role === ADMIN_ROLE && (
              <MobileDrawerLink to="/admin" onClick={() => setMobileOpen(false)}>
                Admin
              </MobileDrawerLink>
            )}

            <button
              onClick={() => {
                setMobileOpen(false);
                handleLogout();
              }}
              className="mt-auto rounded-xl bg-[#F26A00] py-2 font-black text-white"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}

/* DESKTOP — IDENTICO AL TUO ORIGINALE */
function MenuLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-2xl px-4 py-2 text-sm font-black transition-all
        ${isActive
          ? "bg-white text-[#F26A00]"
          : "text-white hover:bg-white/15 hover:text-white"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

/* MOBILE DRAWER (NUOVO STILE COME VOLEVI) */
function MobileDrawerLink({ to, children, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `rounded-xl px-4 py-3 font-black transition ${
          isActive
            ? "bg-[#F26A00] text-white"
            : "bg-[#FFF7F0] text-black hover:bg-[#F26A00]/10"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default AppLayout;