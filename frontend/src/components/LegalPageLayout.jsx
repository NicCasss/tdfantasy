import React from "react";
import { Link } from "react-router-dom";

function LegalPageLayout({ title, updatedAt = "10 giugno 2026", children }) {
  return (
    <main className="min-h-screen bg-[#FFF7F0] px-4 py-8 text-[#2B211B] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[28px] bg-white p-5 shadow-[0_24px_70px_-45px_rgba(43,33,27,0.45)] ring-1 ring-[#F26A00]/10 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/login"
            className="inline-flex rounded-2xl bg-[#FFF1E6] px-4 py-2 text-sm font-black text-[#F26A00] ring-1 ring-[#F26A00]/15 transition hover:bg-[#F26A00] hover:text-white"
          >
            Torna al login
          </Link>

          <Link
            to="/"
            className="inline-flex rounded-2xl border border-[#F26A00]/20 bg-white px-4 py-2 text-sm font-black text-[#F26A00] transition hover:bg-[#FFF1E6]"
          >
            TDFantasy
          </Link>
        </div>

        <header className="mt-8 border-b border-[#E9E2DB] pb-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F26A00]">
            Documenti legali
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            {title}
          </h1>

          <p className="mt-2 text-sm font-semibold text-[#6A5B52]">
            Ultimo aggiornamento: {updatedAt}
          </p>
        </header>

        <article className="mt-8 space-y-7 text-sm leading-relaxed text-[#3D3028] sm:text-base">
          {children}
        </article>

        <footer className="mt-10 border-t border-[#E9E2DB] pt-5">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-[#6A5B52]">
            <Link to="/privacy" className="hover:text-[#F26A00]">
              Privacy Policy
            </Link>

            <Link to="/cookie-policy" className="hover:text-[#F26A00]">
              Cookie Policy
            </Link>

            <Link to="/regolamento" className="hover:text-[#F26A00]">
              Regolamento
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

function LegalSection({ title, children }) {
  return (
    <section>
      <h2 className="text-xl font-black text-[#2B211B]">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function LegalList({ children }) {
  return (
    <ul className="ml-5 list-disc space-y-2 text-[#3D3028]">
      {children}
    </ul>
  );
}

export { LegalPageLayout, LegalSection, LegalList };