import React from "react";
import logoTdf from "../assets/logo.svg";

export function TdfBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-40 h-[360px] w-[360px] rounded-full bg-[#F26A00]/10 blur-3xl" />
      <div className="absolute bottom-[-160px] right-[-120px] h-[420px] w-[420px] rounded-full bg-[#FF7F1F]/10 blur-3xl" />
    </div>
  );
}

function AuthLayout({
  children,
  leftTitle = "TDFantasy",
  leftSubtitle = "Il fantacalcio del TDF.",
  compact = false,
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FFF7F0] text-[#2B211B]">
      <TdfBackground />

      <div className="absolute inset-x-0 top-0 h-[280px] bg-gradient-to-br from-[#F26A00] via-[#F97316] to-[#D95C00]">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute -left-20 top-[-120px] h-[360px] w-[360px] rounded-full border-[70px] border-white" />
          <div className="absolute right-[-120px] top-20 h-[340px] w-[340px] rotate-45 rounded-[70px] bg-white" />
          <div className="absolute left-1/3 top-8 h-[420px] w-[180px] rotate-12 rounded-[80px] border-[28px] border-white" />
        </div>
      </div>

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div
          className={`w-full ${
            compact ? "max-w-xl" : "max-w-5xl"
          } rounded-[34px] bg-white shadow-[0_30px_80px_-35px_rgba(43,33,27,0.45)] ring-1 ring-[#F26A00]/10 overflow-hidden`}
        >
          <div
            className={`grid ${
              compact ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]"
            }`}
          >
            {!compact && (
              <section className="relative hidden min-h-[640px] overflow-hidden bg-gradient-to-br from-[#F26A00] via-[#F97316] to-[#D95C00] p-10 text-white lg:flex lg:flex-col lg:justify-between">
                <div className="absolute inset-0 opacity-15">
                  <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full border-[52px] border-white" />
                  <div className="absolute bottom-[-80px] right-[-60px] h-72 w-72 rotate-45 rounded-[60px] bg-white" />
                  <div className="absolute left-20 bottom-16 h-[360px] w-[130px] rotate-12 rounded-[70px] border-[22px] border-white" />
                </div>

                <div className="relative">
                  <div className="inline-flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 ring-1 ring-white/20 backdrop-blur-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-1.5 shadow-[0_10px_30px_-18px_rgba(43,33,27,0.6)]">
                      <img
                        src={logoTdf}
                        alt="Logo TDF"
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.25em] text-white/70">
                        Memorial
                      </div>
                      <div className="text-2xl font-black tracking-tight">
                        TDFantasy
                      </div>
                    </div>
                  </div>

                  <h1 className="mt-14 max-w-md text-5xl font-black leading-tight tracking-tight">
                    {leftTitle}
                  </h1>

                  <p className="mt-5 max-w-md text-lg leading-relaxed text-white/85">
                    {leftSubtitle}
                  </p>
                </div>


              </section>
            )}

            <section className="p-6 sm:p-8 lg:p-10">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-1.5 shadow-[0_10px_30px_-18px_rgba(43,33,27,0.6)]">
                      <img
                        src={logoTdf}
                        alt="Logo TDF"
                        className="h-full w-full object-contain"
                      />
                    </div>

                  <div>
                    <div className="text-2xl font-black tracking-tight text-[#2B211B]">
                      TDFantasy
                    </div>
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#F26A00]">
                      Il fantasy del TDF
                    </div>
                  </div>
                </div>
              </div>

              {children}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AuthLayout;