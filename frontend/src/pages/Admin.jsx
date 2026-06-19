import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import PageLoader from "../components/PageLoader";

function Admin() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState("");

  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");

  const [rosterSize, setRosterSize] = useState(4);
  const [budgetCap, setBudgetCap] = useState(100);
  const [tournamentDays, setTournamentDays] = useState(6);
  const [rosterLockAt, setRosterLockAt] = useState("");
  const [allowSharedPlayers, setAllowSharedPlayers] = useState(true);
  const [isRosterEditEnabled, setIsRosterEditEnabled] = useState(true);

  const [selectedImportDay, setSelectedImportDay] = useState(1);
  const [scoreImportResult, setScoreImportResult] = useState(null);
  const [scoreImportError, setScoreImportError] = useState("");

  const [dayStatus, setDayStatus] = useState(null);
  const [dayStatusLoading, setDayStatusLoading] = useState(false);
  const [liveActionLoading, setLiveActionLoading] = useState("");
  const [liveError, setLiveError] = useState("");
  const [liveSuccess, setLiveSuccess] = useState("");

  const daysOptions = useMemo(() => {
    const days = Number(tournamentDays) > 0 ? Number(tournamentDays) : 6;
    return Array.from({ length: days }, (_, index) => index + 1);
  }, [tournamentDays]);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    loadDayStatus(selectedImportDay);
  }, [selectedImportDay]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadDayStatus(selectedImportDay, { silent: true });
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedImportDay]);

  async function loadSettings() {
    try {
      setSettingsLoading(true);
      setSettingsError("");

      const response = await api.get("/fantasy-settings");
      const settings = response.data?.settings;

      if (settings) {
        setRosterSize(settings.rosterSize ?? 4);
        setBudgetCap(settings.budgetCap ?? 100);
        setTournamentDays(settings.tournamentDays ?? 6);
        setRosterLockAt(settings.rosterLockAtFormatted || "");
        setAllowSharedPlayers(Boolean(settings.allowSharedPlayers));
        setIsRosterEditEnabled(Boolean(settings.isRosterEditEnabled));

        if (
          settings.tournamentDays &&
          selectedImportDay > settings.tournamentDays
        ) {
          setSelectedImportDay(1);
        }
      }
    } catch (err) {
      setSettingsError(
        err?.response?.data?.message ||
          "Errore durante il caricamento delle impostazioni"
      );
    } finally {
      setSettingsLoading(false);
    }
  }

  async function loadDayStatus(day, options = {}) {
    try {
      if (!options.silent) {
        setDayStatusLoading(true);
      }

      const response = await api.get(`/admin/live/status/${day}`);

      if (!response.data?.error) {
        setDayStatus(response.data?.status || null);
      }
    } catch (err) {
      if (!options.silent) {
        setLiveError(
          err?.response?.data?.message ||
            "Errore durante il caricamento dello stato giornata"
        );
      }
    } finally {
      if (!options.silent) {
        setDayStatusLoading(false);
      }
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault();

    setSettingsError("");
    setSettingsSuccess("");

    if (!rosterSize || Number(rosterSize) < 1) {
      setSettingsError("Inserisci un numero giocatori valido");
      return;
    }

    if (!budgetCap || Number(budgetCap) < 1) {
      setSettingsError("Inserisci un budget valido");
      return;
    }

    if (!tournamentDays || Number(tournamentDays) < 1) {
      setSettingsError("Inserisci un numero giornate valido");
      return;
    }

    if (!rosterLockAt.trim()) {
      setSettingsError("Inserisci la data limite");
      return;
    }

    const dateRegex =
      /^([0-2]\d|3[01])\/(0\d|1[0-2])\/(\d{4})\s+([01]\d|2[0-3]):([0-5]\d)$/;

    if (!dateRegex.test(rosterLockAt.trim())) {
      setSettingsError("Formato data non valido. Usa DD/MM/YYYY HH:mm");
      return;
    }

    try {
      setSettingsSaving(true);

      const response = await api.put("/fantasy-settings", {
        rosterSize: Number(rosterSize),
        budgetCap: Number(budgetCap),
        tournamentDays: Number(tournamentDays),
        rosterLockAt: rosterLockAt.trim(),
        allowSharedPlayers,
        isRosterEditEnabled,
      });

      if (response.data?.error) {
        setSettingsError(
          response.data.message || "Errore durante il salvataggio"
        );
        return;
      }

      const updatedSettings = response.data?.settings;

      if (updatedSettings) {
        setRosterSize(updatedSettings.rosterSize ?? rosterSize);
        setBudgetCap(updatedSettings.budgetCap ?? budgetCap);
        setTournamentDays(updatedSettings.tournamentDays ?? tournamentDays);
        setRosterLockAt(updatedSettings.rosterLockAtFormatted || rosterLockAt);
        setAllowSharedPlayers(Boolean(updatedSettings.allowSharedPlayers));
        setIsRosterEditEnabled(Boolean(updatedSettings.isRosterEditEnabled));
      }

      setSettingsSuccess("Impostazioni aggiornate correttamente");
    } catch (err) {
      setSettingsError(
        err?.response?.data?.message ||
          "Errore durante il salvataggio delle impostazioni"
      );
    } finally {
      setSettingsSaving(false);
    }
  }

  async function handleSyncPlayers() {
    setSyncing(true);
    setSyncResult(null);
    setSyncError("");

    try {
      const response = await api.post("/admin/sync/players");

      if (response.data?.error) {
        setSyncError(
          response.data.message || "Errore durante la sincronizzazione"
        );
        return;
      }

      setSyncResult(response.data);
    } catch (err) {
      setSyncError(
        err?.response?.data?.message ||
          "Errore durante la sincronizzazione dei giocatori"
      );
    } finally {
      setSyncing(false);
    }
  }

  async function handleStartLive() {
    await runLiveAction({
      action: "start",
      loadingKey: "start",
      successMessage: `Live giornata ${selectedImportDay} attivato`,
    });
  }

  async function handleImportNow() {
    await runLiveAction({
      action: "import-now",
      loadingKey: "import-now",
      successMessage: `Giornata ${selectedImportDay} aggiornata`,
    });
  }

  async function handleCloseDay() {
    const confirmed = window.confirm(
      `Vuoi chiudere la giornata ${selectedImportDay}? Verrà eseguito un ultimo aggiornamento dei punteggi e il live sarà interrotto.`
    );

    if (!confirmed) return;

    await runLiveAction({
      action: "close",
      loadingKey: "close",
      successMessage: `Giornata ${selectedImportDay} chiusa`,
    });
  }

  async function runLiveAction({ action, loadingKey, successMessage }) {
    const day = Number(selectedImportDay);

    if (!day || day < 1) {
      setLiveError("Seleziona una giornata valida");
      return;
    }

    try {
      setLiveActionLoading(loadingKey);
      setLiveError("");
      setLiveSuccess("");
      setScoreImportError("");
      setScoreImportResult(null);

      const response = await api.post(`/admin/live/day/${day}/${action}`);

      if (response.data?.error) {
        setLiveError(response.data.message || "Operazione non riuscita");
        return;
      }

      setLiveSuccess(response.data?.message || successMessage);
      setDayStatus(response.data?.status || null);

      if (response.data?.importResult) {
        setScoreImportResult(response.data.importResult);
      }

      await loadDayStatus(day, { silent: true });
    } catch (err) {
      setLiveError(
        err?.response?.data?.message || "Errore durante l'operazione live"
      );
    } finally {
      setLiveActionLoading("");
    }
  }

  const isLive = dayStatus?.status === "live" || dayStatus?.isLive;
  const isClosed = dayStatus?.status === "closed" || dayStatus?.isClosed;

  if (settingsLoading) {
    return <PageLoader text="Caricamento pannello admin..." />;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[34px] bg-white shadow-[0_30px_80px_-45px_rgba(43,33,27,0.45)] ring-1 ring-[#F26A00]/10">
          <div className="relative bg-gradient-to-br from-[#F26A00] via-[#F97316] to-[#D95C00] px-5 py-7 text-white sm:px-7 lg:px-8">
            <div className="absolute inset-0 opacity-15">
              <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full border-[55px] border-white" />
              <div className="absolute right-[-90px] top-8 h-72 w-72 rotate-45 rounded-[70px] bg-white" />
            </div>

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                  Pannello Admin
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/85 sm:text-base">
                  Gestisci impostazioni fantasy, sincronizza i giocatori dal
                  Google Fogli e importa i punteggi giornalieri dal referto.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[520px]">
                <HeroStat label="Atleti" value={rosterSize} />
                <HeroStat label="Budget" value={budgetCap} />
                <HeroStat label="Giornate" value={tournamentDays} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 border-t border-[#F26A00]/10 bg-white md:grid-cols-3">
            <SummaryCell
              label="Modifiche rosa"
              value={isRosterEditEnabled ? "Abilitate" : "Disabilitate"}
            />

            <SummaryCell
              label="Giocatori condivisi"
              value={allowSharedPlayers ? "Sì" : "No"}
            />

            <SummaryCell label="Deadline" value={rosterLockAt || "-"} />
          </div>
        </section>

        <section className="rounded-[34px] bg-white p-5 shadow-[0_30px_80px_-50px_rgba(43,33,27,0.45)] ring-1 ring-[#F26A00]/10 sm:p-6 lg:p-8">
          <SectionHeader
            title="Impostazioni fantasy"
            text="Modifica numero di atleti, budget massimo, durata del torneo e data limite per la scelta della rosa."
          />

          <form onSubmit={handleSaveSettings} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FieldWrapper
                label="Numero atleti"
                help="Numero esatto di giocatori che ogni utente deve selezionare."
              >
                <input
                  type="number"
                  min="1"
                  value={rosterSize}
                  onChange={(e) => setRosterSize(e.target.value)}
                  className="tdf-input"
                />
              </FieldWrapper>

              <FieldWrapper
                label="Budget massimo"
                help="Credito massimo disponibile per comporre la fantasquadra."
              >
                <input
                  type="number"
                  min="1"
                  value={budgetCap}
                  onChange={(e) => setBudgetCap(e.target.value)}
                  className="tdf-input"
                />
              </FieldWrapper>

              <FieldWrapper
                label="Numero giornate torneo"
                help="Valore parametrico. Per ora il torneo dura 6 giornate."
              >
                <input
                  type="number"
                  min="1"
                  value={tournamentDays}
                  onChange={(e) => {
                    setTournamentDays(e.target.value);

                    const nextValue = Number(e.target.value);
                    if (
                      nextValue > 0 &&
                      Number(selectedImportDay) > nextValue
                    ) {
                      setSelectedImportDay(1);
                    }
                  }}
                  className="tdf-input"
                />
              </FieldWrapper>

              <FieldWrapper
                label="Data limite scelta rosa"
                help="Formato obbligatorio: DD/MM/YYYY HH:mm. Esempio: 10/08/2026 18:00"
              >
                <input
                  type="text"
                  value={rosterLockAt}
                  onChange={(e) => setRosterLockAt(e.target.value)}
                  placeholder="DD/MM/YYYY HH:mm"
                  className="tdf-input"
                />
              </FieldWrapper>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ToggleCard
                checked={isRosterEditEnabled}
                onChange={(value) => setIsRosterEditEnabled(value)}
                title="Modifiche abilitate"
                text="Se disattivato, nessun utente può modificare la rosa, anche prima della data limite."
              />

              <ToggleCard
                checked={allowSharedPlayers}
                onChange={(value) => setAllowSharedPlayers(value)}
                title="Giocatori condivisi"
                text="Se attivo, più utenti possono scegliere lo stesso atleta."
              />
            </div>

            {settingsError && <ErrorBox text={settingsError} />}
            {settingsSuccess && <SuccessBox text={settingsSuccess} />}

            <button
              type="submit"
              disabled={settingsSaving}
              className={`rounded-2xl bg-[#F26A00] px-6 py-3 font-black text-white shadow-[0_18px_35px_-22px_rgba(242,106,0,0.9)] transition-all ${
                settingsSaving
                  ? "cursor-not-allowed opacity-70"
                  : "hover:bg-[#FF7F1F] active:translate-y-[1px]"
              }`}
            >
              {settingsSaving
                ? "Salvataggio..."
                : "Salva impostazioni fantasy"}
            </button>
          </form>
        </section>

        <section className="rounded-[34px] bg-white p-5 shadow-[0_30px_80px_-50px_rgba(43,33,27,0.45)] ring-1 ring-[#F26A00]/10 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              <SectionHeader
                title="Sincronizza giocatori"
                text="Aggiorna il tab PLAYERS nel Google Fogli, poi sincronizza i giocatori nel database."
              />

              <button
                onClick={handleSyncPlayers}
                disabled={syncing}
                className={`mt-6 rounded-2xl bg-[#F26A00] px-6 py-3 font-black text-white shadow-[0_18px_35px_-22px_rgba(242,106,0,0.9)] transition-all ${
                  syncing
                    ? "cursor-not-allowed opacity-70"
                    : "hover:bg-[#FF7F1F] active:translate-y-[1px]"
                }`}
              >
                {syncing ? "Sincronizzazione..." : "Sincronizza giocatori"}
              </button>

              {syncError && (
                <div className="mt-5">
                  <ErrorBox text={syncError} />
                </div>
              )}
            </div>

            <ResultPanel title="Risultato sincronizzazione">
              {!syncResult ? (
                <EmptyResult text="Nessuna sincronizzazione eseguita in questa sessione." />
              ) : (
                <>
                  <p className="text-sm font-semibold text-[#6A5B52]">
                    {syncResult.message}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <StatCard
                      label="Lette"
                      value={syncResult.stats?.read ?? 0}
                    />
                    <StatCard
                      label="Creati"
                      value={syncResult.stats?.created ?? 0}
                    />
                    <StatCard
                      label="Aggiornati"
                      value={syncResult.stats?.updated ?? 0}
                    />
                    <StatCard
                      label="Saltati"
                      value={syncResult.stats?.skipped ?? 0}
                    />
                  </div>

                  {syncResult.stats?.errors?.length > 0 && (
                    <ErrorsList errors={syncResult.stats.errors} />
                  )}
                </>
              )}
            </ResultPanel>
          </div>
        </section>

        <section className="rounded-[34px] bg-white p-5 shadow-[0_30px_80px_-50px_rgba(43,33,27,0.45)] ring-1 ring-[#F26A00]/10 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
            <div>
              <SectionHeader
                title="Live giornata"
                text="Attiva il live per aggiornare automaticamente i punteggi dal REF_REPORT ogni 2 minuti. Alla chiusura viene eseguito un ultimo import e la giornata diventa ufficiale."
              />

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[260px_1fr] md:items-end">
                <FieldWrapper
                  label="Giornata da gestire"
                  help={`Sono disponibili ${tournamentDays || 6} giornate.`}
                >
                  <select
                    value={selectedImportDay}
                    onChange={(e) =>
                      setSelectedImportDay(Number(e.target.value))
                    }
                    className="tdf-input"
                  >
                    {daysOptions.map((day) => (
                      <option key={day} value={day}>
                        Giornata {day}
                      </option>
                    ))}
                  </select>
                </FieldWrapper>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    onClick={handleStartLive}
                    disabled={Boolean(liveActionLoading) || isLive || isClosed}
                    className={`rounded-2xl bg-[#F26A00] px-6 py-3 font-black text-white shadow-[0_18px_35px_-22px_rgba(242,106,0,0.9)] transition-all ${
                      Boolean(liveActionLoading) || isLive || isClosed
                        ? "cursor-not-allowed opacity-60"
                        : "hover:bg-[#FF7F1F] active:translate-y-[1px]"
                    }`}
                  >
                    {liveActionLoading === "start"
                      ? "Attivazione..."
                      : isLive
                      ? "Live attivo"
                      : "Attiva live"}
                  </button>

                  <button
                    onClick={handleImportNow}
                    disabled={Boolean(liveActionLoading)}
                    className={`rounded-2xl border border-[#F26A00]/25 bg-[#FFF7F0] px-6 py-3 font-black text-[#F26A00] transition-all ${
                      Boolean(liveActionLoading)
                        ? "cursor-not-allowed opacity-60"
                        : "hover:bg-[#F26A00] hover:text-white active:translate-y-[1px]"
                    }`}
                  >
                    {liveActionLoading === "import-now"
                      ? "Aggiornamento..."
                      : "Aggiorna ora"}
                  </button>

                  <button
                    onClick={handleCloseDay}
                    disabled={Boolean(liveActionLoading) || isClosed}
                    className={`rounded-2xl border border-[#D6452F]/25 bg-[#D6452F]/10 px-6 py-3 font-black text-[#B42318] transition-all ${
                      Boolean(liveActionLoading) || isClosed
                        ? "cursor-not-allowed opacity-60"
                        : "hover:bg-[#D6452F] hover:text-white active:translate-y-[1px]"
                    }`}
                  >
                    {liveActionLoading === "close"
                      ? "Chiusura..."
                      : isClosed
                      ? "Giornata chiusa"
                      : "Chiudi giornata"}
                  </button>
                </div>
              </div>

              {dayStatusLoading && (
                <div className="mt-5 rounded-2xl border border-[#E9E2DB] bg-[#FFF7F0] p-4 text-sm font-semibold text-[#6A5B52]">
                  Caricamento stato live...
                </div>
              )}

              {liveError && (
                <div className="mt-5">
                  <ErrorBox text={liveError} />
                </div>
              )}

              {liveSuccess && (
                <div className="mt-5">
                  <SuccessBox text={liveSuccess} />
                </div>
              )}

              {scoreImportError && (
                <div className="mt-5">
                  <ErrorBox text={scoreImportError} />
                </div>
              )}
            </div>

            <ResultPanel title="Stato live">
              <DayStatusPanel
                status={dayStatus}
                selectedDay={selectedImportDay}
              />
            </ResultPanel>
          </div>
        </section>

        <section className="rounded-[34px] bg-white p-5 shadow-[0_30px_80px_-50px_rgba(43,33,27,0.45)] ring-1 ring-[#F26A00]/10 sm:p-6 lg:p-8">
          <SectionHeader
            title="Come usarlo"
            text="Flusso consigliato per gestire il torneo in modo ordinato."
          />

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <InfoCard
              title="1. Regole"
              text="Imposta numero giocatori, budget, giornate e data limite nel formato richiesto."
            />

            <InfoCard
              title="2. PLAYERS"
              text="Inserisci o modifica i giocatori nel tab PLAYERS e sincronizzali., per poterli caricare nell'app"
            />

            <InfoCard
              title="3. Live giornata"
              text="Attiva il live, lascia aggiornare i punteggi ogni 2 minuti e chiudi la giornata quando i risultati sono definitivi."
            />
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function DayStatusPanel({ status, selectedDay }) {
  if (!status) {
    return (
      <EmptyResult
        text={`Nessuno stato disponibile per la giornata ${selectedDay}.`}
      />
    );
  }

  console.log("DAY STATUS", status);

  const isLive = status.status === "live" || status.isLive;
  const isClosed = status.status === "closed" || status.isClosed;

  return (
    <div className="space-y-4">
      <div
        className={`rounded-2xl px-4 py-4 ${
          isLive
            ? "bg-[#F26A00] text-white"
            : isClosed
            ? "bg-[#2B211B] text-white"
            : "border border-[#F26A00]/15 bg-white text-[#2B211B]"
        }`}
      >
        <div className="text-xs font-black uppercase tracking-[0.14em] opacity-75">
          Stato corrente
        </div>

        <div className="mt-1 text-2xl font-black">
          {isLive
            ? "Live attivo"
            : isClosed
            ? "Giornata chiusa"
            : "Non attiva"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Eventi" value={status.eventsImported ?? 0} />
        <StatCard label="Giocatori" value={status.playersScored ?? 0} />
        <StatCard label="Squadre" value={status.teamsCalculated ?? 0} />
        <StatCard label="Giornata" value={status.day ?? selectedDay} />
      </div>

      <div className="rounded-2xl border border-[#F26A00]/15 bg-white p-4">
        <InfoLine
          label="Ultimo aggiornamento"
          value={formatDateTime(status.lastImportAt)}
        />
        <InfoLine
          label="Prossimo aggiornamento"
          value={isLive ? formatDateTime(status.nextImportAt) : "-"}
        />
        <InfoLine label="Avvio live" value={formatDateTime(status.startedAt)} />
        <InfoLine label="Chiusura" value={formatDateTime(status.closedAt)} />
      </div>

      {status.dayWinner && (
        <div className="rounded-2xl bg-[#F26A00] px-4 py-4 text-white">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-white/75">
            {isClosed ? "Vincitore ufficiale" : "Vincitore provvisorio"}
          </div>

          <div className="mt-1 text-xl font-black">{status.dayWinner}</div>

          <p className="mt-1 text-sm font-semibold text-white/75">
            {status.dayWinnerScore ?? 0} punti
          </p>
        </div>
      )}

      {status.lastMessage && (
        <div className="rounded-2xl border border-[#E9E2DB] bg-white px-4 py-4 text-sm font-semibold text-[#6A5B52]">
          {status.lastMessage}
        </div>
      )}

      {status.errors?.length > 0 && <ErrorsList errors={status.errors} />}
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#E9E2DB] py-3 first:pt-0 last:border-b-0 last:pb-0">
      <span className="text-sm font-semibold text-[#6A5B52]">{label}</span>
      <span className="text-right text-sm font-black text-[#2B211B]">
        {value || "-"}
      </span>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("it-IT");
}

function HeroStat({ label, value }) {
  return (
    <div className="rounded-3xl bg-white/15 px-4 py-4 ring-1 ring-white/20 backdrop-blur-sm">
      <div className="text-xs font-black uppercase tracking-[0.14em] text-white/75">
        {label}
      </div>

      <div className="mt-1 text-2xl font-black text-white">{value}</div>
    </div>
  );
}

function SummaryCell({ label, value }) {
  return (
    <div className="border-b border-[#F26A00]/10 px-5 py-4 md:border-b-0 md:border-r last:md:border-r-0">
      <div className="text-xs font-black uppercase tracking-[0.14em] text-[#F26A00]">
        {label}
      </div>

      <div className="mt-1 text-sm font-bold text-[#2B211B]">{value}</div>
    </div>
  );
}

function SectionHeader({ title, text }) {
  return (
    <div>
      <h2 className="text-2xl font-black tracking-tight text-[#2B211B] sm:text-3xl">
        {title}
      </h2>

      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#6A5B52]">
        {text}
      </p>
    </div>
  );
}

function FieldWrapper({ label, help, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-[#2B211B]">
        {label}
      </label>

      {children}

      {help && (
        <p className="mt-2 text-xs font-semibold leading-relaxed text-[#6A5B52]">
          {help}
        </p>
      )}
    </div>
  );
}

function ToggleCard({ checked, onChange, title, text }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-4 rounded-3xl border p-5 transition-all ${
        checked
          ? "border-[#F26A00] bg-[#F26A00] text-white"
          : "border-[#E9E2DB] bg-[#FFF7F0] text-[#2B211B] hover:border-[#F26A00]/40"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 accent-[#F26A00]"
      />

      <div>
        <div className={checked ? "font-black text-white" : "font-black"}>
          {title}
        </div>

        <p
          className={`mt-1 text-sm font-semibold leading-relaxed ${
            checked ? "text-white/75" : "text-[#6A5B52]"
          }`}
        >
          {text}
        </p>
      </div>
    </label>
  );
}

function ResultPanel({ title, children }) {
  return (
    <aside className="rounded-[30px] border border-[#F26A00]/15 bg-[#FFF7F0] p-5">
      <h3 className="text-xl font-black text-[#2B211B]">{title}</h3>
      <div className="mt-4">{children}</div>
    </aside>
  );
}

function EmptyResult({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#F26A00]/25 bg-white px-4 py-5 text-sm font-semibold text-[#6A5B52]">
      {text}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#F26A00]/15 bg-white p-4">
      <div className="text-3xl font-black text-[#F26A00]">{value}</div>
      <div className="mt-1 text-sm font-semibold text-[#6A5B52]">{label}</div>
    </div>
  );
}

function InfoCard({ title, text }) {
  return (
    <div className="rounded-3xl border border-[#F26A00]/15 bg-[#FFF7F0] p-5">
      <div className="font-black text-[#F26A00]">{title}</div>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-[#6A5B52]">
        {text}
      </p>
    </div>
  );
}

function ErrorBox({ text }) {
  return (
    <div className="rounded-2xl border border-[#D6452F]/20 bg-[#D6452F]/10 px-4 py-3 text-sm font-semibold text-[#B42318]">
      {text}
    </div>
  );
}

function SuccessBox({ text }) {
  return (
    <div className="rounded-2xl border border-[#3FAE5A]/20 bg-[#3FAE5A]/10 px-4 py-3 text-sm font-semibold text-[#247A3A]">
      {text}
    </div>
  );
}

function ErrorsList({ errors }) {
  return (
    <div className="mt-4 rounded-2xl border border-[#D6452F]/20 bg-[#D6452F]/10 p-4">
      <div className="mb-2 font-black text-[#B42318]">Errori trovati:</div>

      <ul className="space-y-1 text-sm font-semibold text-[#B42318]">
        {errors.map((item, index) => (
          <li key={index}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

export default Admin;