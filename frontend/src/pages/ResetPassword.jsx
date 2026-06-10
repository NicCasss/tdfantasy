import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axiosClient";
import PasswordInput from "../components/PasswordInput";
import AuthLayout from "../components/AuthLayout";
import AuthLoader from "../components/AuthLoader";

function ResetPassword() {
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isValidating, setIsValidating] = useState(true);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const tokenParam = searchParams.get("token");

    if (emailParam) setEmail(emailParam);
    if (tokenParam) setToken(tokenParam);

    if (!emailParam || !tokenParam) {
      setError("Link non valido o scaduto");
    }

    setIsValidating(false);
  }, [searchParams]);

  function isPasswordValid(value) {
    return (
      value.length >= 8 &&
      /[a-z]/.test(value) &&
      /[A-Z]/.test(value) &&
      /\d/.test(value)
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!newPassword) {
      setError("Inserisci la nuova password");
      return;
    }

    if (!isPasswordValid(newPassword)) {
      setError(
        "La password deve avere almeno 8 caratteri, una maiuscola, una minuscola e un numero"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Le password non coincidono");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/reset-password", {
        email,
        token,
        newPassword,
      });

      if (!response.data?.error) {
        setSuccess(true);

        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 1400);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Si è verificato un errore durante il reset"
      );
      setLoading(false);
    }
  }

  if (isValidating) {
    return <AuthLoader text="Stiamo controllando il link per il reset..." />;
  }

  if (loading) {
    return <AuthLoader text="Aggiornamento password in corso..." />;
  }

  if (error && (!email || !token)) {
    return (
      <AuthLayout compact>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#D6452F]/20 bg-[#D6452F]/10 text-3xl">
            ⚠️
          </div>

          <h2 className="text-3xl font-black tracking-tight text-[#2B211B]">
            Link non valido
          </h2>

          <p className="mt-2 mb-6 leading-relaxed text-[#4F433C]">{error}</p>

          <Link
            to="/forgot-password"
            className="block w-full rounded-2xl bg-[#F26A00] py-3 text-center text-lg font-black text-white
              shadow-[0_18px_35px_-22px_rgba(242,106,0,0.9)]
              transition-all hover:bg-[#FF7F1F] active:translate-y-[1px]"
          >
            Richiedi nuovo reset
          </Link>

          <div className="mt-4 text-sm">
            <Link
              to="/login"
              className="font-black text-[#C95A00] underline decoration-[#C95A00]/40 underline-offset-4 hover:text-[#A84700]"
            >
              Torna al login
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout compact>
      <div className="mb-7">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#F26A00]/20 bg-[#FFF7F0] px-4 py-2 text-sm font-black text-[#C95A00]">
          <span className="h-2 w-2 rounded-full bg-[#F26A00]" />
          Nuova password
        </div>

        <h2 className="mt-6 text-3xl font-black tracking-tight text-[#2B211B] sm:text-4xl">
          Reimposta password
        </h2>

        <p className="mt-2 leading-relaxed text-[#4F433C]">
          Inserisci una nuova password sicura per rientrare in TDFantasy.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-black text-[#2B211B]">
            Email
          </label>

          <input
            type="email"
            value={email}
            readOnly
            className="w-full cursor-not-allowed rounded-2xl border border-[#DDD3CA] bg-[#FFF7F0] px-4 py-3 text-sm font-semibold text-[#5E5148] outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-black text-[#2B211B]">
            Nuova password
          </label>

          <PasswordInput
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nuova password"
            disabled={loading || success}
            showStrength
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-black text-[#2B211B]">
            Conferma password
          </label>

          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Conferma password"
            disabled={loading || success}
            autoComplete="new-password"
          />
        </div>

        {error && email && token && (
          <div className="rounded-2xl border border-[#D6452F]/20 bg-[#D6452F]/10 px-4 py-3 text-sm font-semibold text-[#B42318]">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-[#3FAE5A]/20 bg-[#3FAE5A]/10 px-4 py-3 text-sm font-semibold text-[#247A3A]">
            <div>Password reimpostata con successo!</div>

            <div className="mt-1 text-xs font-semibold text-[#247A3A]/80">
              Reindirizzamento al login...
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || success}
          className={`w-full rounded-2xl bg-[#F26A00] py-3 text-lg font-black text-white
            shadow-[0_18px_35px_-22px_rgba(242,106,0,0.9)]
            transition-all
            ${
              loading || success
                ? "cursor-not-allowed opacity-70"
                : "hover:bg-[#FF7F1F] active:translate-y-[1px]"
            }
          `}
        >
          {success ? "Completato" : "Reimposta password"}
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
    </AuthLayout>
  );
}

export default ResetPassword;