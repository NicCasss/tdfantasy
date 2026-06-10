import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosClient";
import AuthLayout from "../components/AuthLayout";
import AuthLoader from "../components/AuthLoader";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleForgotPassword(e) {
    e.preventDefault();

    setError("");
    setSuccess(false);

    if (!isValidEmail(email)) {
      setError("Inserisci un'email valida");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/forgot-password", {
        email,
      });

      setSuccess(true);
      setEmail("");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Si è verificato un errore. Riprova."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <AuthLoader text="Stiamo inviando il link di recupero password..." />;
  }

  return (
    <AuthLayout compact>
      {!success ? (
        <>
          <div className="mb-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F26A00]/20 bg-[#FFF7F0] px-4 py-2 text-sm font-black text-[#C95A00]">
              <span className="h-2 w-2 rounded-full bg-[#F26A00]" />
              Recupero accesso
            </div>

            <h2 className="mt-6 text-3xl font-black tracking-tight text-[#2B211B] sm:text-4xl">
              Password dimenticata?
            </h2>

            <p className="mt-2 leading-relaxed text-[#4F433C]">
              Inserisci l’email usata per TDFantasy: ti invieremo il link per
              reimpostare la password e tornare in gioco.
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-[#DDD3CA] bg-white px-4 py-3 shadow-[0_12px_30px_-24px_rgba(43,33,27,0.5)] focus-within:border-[#F26A00]">
              <span className="select-none text-[#F26A00]">✉️</span>

              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                className="w-full bg-transparent text-sm font-semibold text-[#2B211B] outline-none placeholder:text-[#8A7D73]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-[#D6452F]/20 bg-[#D6452F]/10 px-4 py-3 text-sm font-semibold text-[#B42318]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-2xl bg-[#F26A00] py-3 text-lg font-black text-white
                shadow-[0_18px_35px_-22px_rgba(242,106,0,0.9)] transition-all
                ${
                  loading
                    ? "cursor-not-allowed opacity-70"
                    : "hover:bg-[#FF7F1F] active:translate-y-[1px]"
                }
              `}
            >
              Inviami il link
            </button>

            <div className="pt-2 text-center text-sm">
              <Link
                to="/login"
                className="font-black text-[#C95A00] underline decoration-[#C95A00]/40 underline-offset-4 hover:text-[#A84700]"
              >
                Torna al login
              </Link>
            </div>
          </form>
        </>
      ) : (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#F26A00]/20 bg-[#FFF7F0] text-3xl">
            📧
          </div>

          <h2 className="text-3xl font-black tracking-tight text-[#2B211B]">
            Email inviata!
          </h2>

          <p className="mt-2 mb-6 leading-relaxed text-[#4F433C]">
            Se l’email è registrata, riceverai il link per reimpostare la
            password e rientrare in TDFantasy.
          </p>

          <button
            onClick={() => setSuccess(false)}
            className="w-full rounded-2xl bg-[#F26A00] py-3 font-black text-white shadow-[0_18px_35px_-22px_rgba(242,106,0,0.9)] transition-all hover:bg-[#FF7F1F] active:translate-y-[1px]"
          >
            Invia un'altra email
          </button>

          <div className="mt-4 text-sm">
            <Link
              to="/login"
              className="font-black text-[#C95A00] underline decoration-[#C95A00]/40 underline-offset-4 hover:text-[#A84700]"
            >
              Torna al login
            </Link>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}

export default ForgotPassword;