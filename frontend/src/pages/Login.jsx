import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosClient";
import PasswordInput from "../components/PasswordInput";
import AuthLayout from "../components/AuthLayout";
import AuthLoader from "../components/AuthLoader";
import { useAuth } from "../context/AuthContext";

const ADMIN_ROLE = "admCorradoadm";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Inserisci la tua email");
      return;
    }

    if (!password) {
      setError("Inserisci la password");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email,
        password,
      });

      if (!response.data?.error) {
        const loggedUser = response.data.user;

        setUser(loggedUser);

        if (loggedUser?.role === ADMIN_ROLE) {
          navigate("/admin", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Si è verificato un errore durante il login"
      );
      setLoading(false);
    }
  }

  if (loading) {
    return <AuthLoader text="Accesso in corso..." />;
  }

  return (
    <AuthLayout
      leftTitle="Vivi il TDF da protagonista."
      leftSubtitle="Gestisci la tua fantasquadra, segui bonus e malus in tempo reale e prova a scalare la classifica del torneo."
    >
      <div className="mb-7">
        <h2 className="mt-6 text-3xl font-black tracking-tight text-[#2B211B] sm:text-4xl">
          Bentornato al TDFantasy!
        </h2>

        <p className="mt-2 leading-relaxed text-[#4F433C]">
          Accedi per consultare la tua rosa, vedere i punteggi aggiornati e
          seguire la classifica del torneo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          disabled={loading}
          autoComplete="current-password"
        />

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
          Accedi a TDFantasy
        </button>

        <div className="flex flex-col gap-3 pt-1 text-sm sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/forgot-password"
            className="font-black text-[#C95A00] underline decoration-[#C95A00]/40 underline-offset-4 hover:text-[#A84700]"
          >
            Password dimenticata?
          </Link>

          <Link
            to="/register"
            className="font-black text-[#C95A00] underline decoration-[#C95A00]/40 underline-offset-4 hover:text-[#A84700]"
          >
            Crea account
          </Link>
        </div>

        <LegalLinks />

        <div className="border-t border-[#DDD3CA] pt-4 text-xs leading-relaxed text-[#5E5148]">
          Accedendo a TDFantasy puoi consultare in qualsiasi momento
          Regolamento, Privacy Policy e Cookie Policy dai link presenti in
          questa pagina.
        </div>
      </form>
    </AuthLayout>
  );
}

function LegalLinks() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl bg-[#FFF7F0] px-4 py-3 text-xs font-black text-[#6A5B52] ring-1 ring-[#F26A00]/10">
      <Link
        to="/privacy"
        className="transition hover:text-[#F26A00]"
      >
        Privacy Policy
      </Link>

      <Link
        to="/cookie-policy"
        className="transition hover:text-[#F26A00]"
      >
        Cookie Policy
      </Link>

      <Link
        to="/regolamento"
        className="transition hover:text-[#F26A00]"
      >
        Regolamento
      </Link>
    </div>
  );
}

export default Login;