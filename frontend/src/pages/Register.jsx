import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosClient";
import PasswordInput from "../components/PasswordInput";
import AuthLayout from "../components/AuthLayout";
import AuthLoader from "../components/AuthLoader";

const LEGAL_VERSION = "2026-06-10";

function Register() {
  const [fullName, setFullName] = useState("");
  const [nationalTeam, setNationalTeam] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [acceptedLegal, setAcceptedLegal] = useState(false);

  const [teamNames, setTeamNames] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadAvailableTeamNames();
  }, []);

  async function loadAvailableTeamNames() {
    try {
      setLoadingTeams(true);
      setError("");

      const response = await api.get("/teams/available");

      if (!response.data?.error) {
        setTeamNames(response.data?.teamNames || []);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Errore durante il caricamento dei nomi squadra disponibili"
      );
    } finally {
      setLoadingTeams(false);
    }
  }

  function isPasswordValid(value) {
    return (
      value.length >= 8 &&
      /[a-z]/.test(value) &&
      /[A-Z]/.test(value) &&
      /\d/.test(value) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(value)
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!fullName.trim()) {
      setError("Inserisci il nome");
      return;
    }

    if (!nationalTeam) {
      setError("Seleziona il nome della tua squadra");
      return;
    }

    if (!email.trim()) {
      setError("Inserisci la tua email");
      return;
    }

    if (!password) {
      setError("Inserisci una password");
      return;
    }

    if (!isPasswordValid(password)) {
      setError(
        "La password deve avere almeno 8 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale"
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Le password non coincidono");
      return;
    }

    if (!acceptedLegal) {
      setError(
        "Devi accettare il Regolamento e prendere visione della Privacy Policy e della Cookie Policy."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/create-account", {
        fullName,
        nationalTeam,
        email,
        password,
        acceptedLegal: true,
        legalVersion: LEGAL_VERSION,
      });

      if (!response.data?.error) {
        setSuccess(true);

        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 900);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Si è verificato un errore durante la registrazione"
      );

      await loadAvailableTeamNames();
      setLoading(false);
    }
  }

  if (loadingTeams) {
    return <AuthLoader text="Caricamento città disponibili..." />;
  }

  if (loading) {
    return <AuthLoader text="Creazione squadra in corso..." />;
  }

  return (
    <AuthLayout
      leftTitle="Scegli il nome della tua squadra."
      leftSubtitle="Seleziona una città disponibile: una volta scelta, non potrà più essere usata dagli altri partecipanti."
    >
      <div className="mb-6">
        <h2 className="mt-5 text-3xl font-black tracking-tight text-[#2B211B] sm:text-4xl">
          Crea account
        </h2>

        <p className="mt-2 leading-relaxed text-[#4F433C]">
          Registrati, scegli la città della tua fantasquadra e inizia a
          costruire la rosa per il TDFantasy.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <InputShell icon="👤">
            <input
              type="text"
              placeholder="Nome"
              autoComplete="name"
              className="w-full bg-transparent text-sm font-semibold text-[#2B211B] outline-none placeholder:text-[#8A7D73]"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading || success}
            />
          </InputShell>

          <InputShell icon="🌍">
            <select
              value={nationalTeam}
              onChange={(e) => setNationalTeam(e.target.value)}
              disabled={loading || success || loadingTeams}
              className="w-full bg-transparent text-sm font-semibold text-[#2B211B] outline-none"
            >
              <option value="">Seleziona città</option>

              {teamNames.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </InputShell>
        </div>

        <InputShell icon="✉️">
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            className="w-full bg-transparent text-sm font-semibold text-[#2B211B] outline-none placeholder:text-[#8A7D73]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || success}
          />
        </InputShell>

        <div className="space-y-3">
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            disabled={loading || success}
            showStrength
            autoComplete="new-password"
          />

          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Conferma password"
            disabled={loading || success}
            autoComplete="new-password"
          />
        </div>

        <LegalConsentBox
          checked={acceptedLegal}
          onChange={setAcceptedLegal}
          disabled={loading || success}
        />

        {error && (
          <div className="rounded-2xl border border-[#D6452F]/20 bg-[#D6452F]/10 px-4 py-3 text-sm font-semibold text-[#B42318]">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-[#3FAE5A]/20 bg-[#3FAE5A]/10 px-4 py-3 text-sm font-semibold text-[#247A3A]">
            <div>Registrazione completata</div>
            <div className="mt-1 text-xs font-semibold text-[#247A3A]/80">
              Reindirizzamento alla dashboard...
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || success || loadingTeams}
          className={`w-full rounded-2xl bg-[#F26A00] py-3 text-lg font-black text-white
            shadow-[0_18px_35px_-22px_rgba(242,106,0,0.9)] transition-all
            ${
              loading || success || loadingTeams
                ? "cursor-not-allowed opacity-70"
                : "hover:bg-[#FF7F1F] active:translate-y-[1px]"
            }
          `}
        >
          {success ? "Squadra creata" : "Crea squadra"}
        </button>

        <div className="flex items-center justify-center pt-1 text-sm">
          <p className="text-[#5E5148]">
            Sei già registrato?{" "}
            <Link
              to="/login"
              className="font-black text-[#C95A00] underline decoration-[#C95A00]/40 underline-offset-4 hover:text-[#A84700]"
            >
              Accedi
            </Link>
          </p>
        </div>

        <LegalLinks />

        <div className="border-t border-[#DDD3CA] pt-4 text-xs leading-relaxed text-[#5E5148]">
          Creando un account confermi l’accettazione del Regolamento e la presa
          visione della Privacy Policy e della Cookie Policy.
        </div>
      </form>
    </AuthLayout>
  );
}

function LegalConsentBox({ checked, onChange, disabled }) {
  return (
    <label
      className={`flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold leading-relaxed transition ${
        checked
          ? "border-[#F26A00]/35 bg-[#FFF1E6]"
          : "border-[#F26A00]/15 bg-[#FFF7F0]"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-[#F26A00]"
      />

      <span className="text-[#5E5148]">
        Ho letto e accetto il{" "}
        <Link
          to="/regolamento"
          target="_blank"
          rel="noreferrer"
          className="font-black text-[#C95A00] underline decoration-[#C95A00]/40 underline-offset-4 hover:text-[#A84700]"
        >
          Regolamento
        </Link>{" "}
        e dichiaro di aver preso visione della{" "}
        <Link
          to="/privacy"
          target="_blank"
          rel="noreferrer"
          className="font-black text-[#C95A00] underline decoration-[#C95A00]/40 underline-offset-4 hover:text-[#A84700]"
        >
          Privacy Policy
        </Link>{" "}
        e della{" "}
        <Link
          to="/cookie-policy"
          target="_blank"
          rel="noreferrer"
          className="font-black text-[#C95A00] underline decoration-[#C95A00]/40 underline-offset-4 hover:text-[#A84700]"
        >
          Cookie Policy
        </Link>
        .
      </span>
    </label>
  );
}

function LegalLinks() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl bg-[#FFF7F0] px-4 py-3 text-xs font-black text-[#6A5B52] ring-1 ring-[#F26A00]/10">
      <Link to="/privacy" className="transition hover:text-[#F26A00]">
        Privacy Policy
      </Link>

      <Link to="/cookie-policy" className="transition hover:text-[#F26A00]">
        Cookie Policy
      </Link>

      <Link to="/regolamento" className="transition hover:text-[#F26A00]">
        Regolamento
      </Link>
    </div>
  );
}

function InputShell({ icon, children }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#DDD3CA] bg-white px-4 py-3 shadow-[0_12px_30px_-24px_rgba(43,33,27,0.5)] focus-within:border-[#F26A00]">
      <span className="select-none text-[#F26A00]">{icon}</span>
      {children}
    </div>
  );
}

export default Register;