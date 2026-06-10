import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import PageLoader from "../components/PageLoader";

function Dashboard() {
  const { user } = useAuth();

  const [roster, setRoster] = useState(null);
  const [settings, setSettings] = useState(null);
  const [teamScores, setTeamScores] = useState([]);

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [playerScore, setPlayerScore] = useState(null);
  const [detailAnimationKey, setDetailAnimationKey] = useState(0);

  const [loadingRoster, setLoadingRoster] = useState(true);
  const [loadingScore, setLoadingScore] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [scoreError, setScoreError] = useState("");

  const tournamentDays = Number(settings?.tournamentDays || 6);

  const daysOptions = useMemo(() => {
    return Array.from({ length: tournamentDays }, (_, index) => index + 1);
  }, [tournamentDays]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (selectedPlayer) {
      setDetailAnimationKey((prev) => prev + 1);
      loadPlayerScore(selectedPlayer.playerId, selectedDay);
    }
  }, [selectedPlayer, selectedDay]);

  async function loadDashboardData() {
    try {
      setLoadingRoster(true);
      setDashboardError("");

      const [rosterResponse, scoresResponse] = await Promise.all([
        api.get("/rosters/me"),
        api.get("/scores/me"),
      ]);

      const loadedRoster = rosterResponse.data?.roster || null;

      setRoster(loadedRoster);
      setSettings(rosterResponse.data?.settings || null);
      setTeamScores(scoresResponse.data?.scores || []);

      if (loadedRoster?.players?.length) {
        setSelectedPlayer((current) => current || loadedRoster.players[0]);
      }
    } catch (err) {
      setDashboardError(
        err?.response?.data?.message ||
          "Errore durante il caricamento della dashboard"
      );
    } finally {
      setLoadingRoster(false);
    }
  }

  async function loadPlayerScore(playerId, day) {
    try {
      setLoadingScore(true);
      setScoreError("");
      setPlayerScore(null);

      const response = await api.get(`/scores/player/${playerId}/day/${day}`);

      if (response.data?.error) {
        setScoreError(
          response.data.message || "Errore durante il caricamento del punteggio"
        );
        return;
      }

      setPlayerScore(response.data?.player || null);
    } catch (err) {
      setScoreError(
        err?.response?.data?.message ||
          "Errore durante il caricamento del dettaglio giocatore"
      );
    } finally {
      setLoadingScore(false);
    }
  }

  function normalizePlayerId(value) {
    return String(value || "").trim().toUpperCase();
  }

  function isCaptain(playerId) {
    return (
      normalizePlayerId(playerId) === normalizePlayerId(roster?.captainPlayerId)
    );
  }

  function getTeamTotal() {
    return teamScores.reduce(
      (sum, dayScore) => sum + Number(dayScore.dayTotal || 0),
      0
    );
  }

  function getPlayerTournamentTotal(playerId) {
    return teamScores.reduce((sum, dayScore) => {
      const player = (dayScore.players || []).find(
        (item) =>
          normalizePlayerId(item.playerId) === normalizePlayerId(playerId)
      );

      return sum + Number(player?.totalScore || 0);
    }, 0);
  }

  function getPlayerDayTotal(playerId, day) {
    const dayScore = teamScores.find((item) => Number(item.day) === Number(day));

    const player = (dayScore?.players || []).find(
      (item) =>
        normalizePlayerId(item.playerId) === normalizePlayerId(playerId)
    );

    return Number(player?.totalScore || 0);
  }

  if (loadingRoster) {
    return <PageLoader text="Caricamento dashboard..." />;
  }

  return (
    <AppLayout>
      <div className="space-y-5 lg:space-y-6">
        <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_-45px_rgba(43,33,27,0.45)] ring-1 ring-[#F26A00]/10 sm:rounded-[34px]">
          <div className="relative bg-gradient-to-br from-[#F26A00] via-[#F97316] to-[#D95C00] px-4 py-6 text-white sm:px-7 sm:py-7 lg:px-8">
            <div className="absolute inset-0 opacity-15">
              <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full border-[55px] border-white" />
              <div className="absolute right-[-90px] top-8 h-72 w-72 rotate-45 rounded-[70px] bg-white" />
            </div>

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs font-black uppercase tracking-wide text-white ring-1 ring-white/20">
                  TDFantasy
                </div>

                <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                  Ciao {user?.fullName || "Utente"}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
                  Controlla i tuoi atleti, segui i punteggi giornata per
                  giornata e resta aggiornato sulla tua fantasquadra.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                  {user?.nationalTeam && (
                    <span className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#F26A00]">
                      {user.nationalTeam}
                    </span>
                  )}

                  <span className="rounded-2xl bg-[#2B211B]/20 px-4 py-3 text-sm font-black text-white ring-1 ring-white/20">
                    Totale squadra: {getTeamTotal()} punti
                  </span>
                </div>
              </div>

              <div className="w-full rounded-3xl bg-white/15 p-4 ring-1 ring-white/20 backdrop-blur-sm sm:w-[280px]">
                <label className="block text-sm font-black text-white/85">
                  Giornata
                </label>

                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                  className="mt-2 w-full rounded-2xl border-0 bg-white px-4 py-3 text-sm font-black text-[#2B211B] outline-none"
                >
                  {daysOptions.map((day) => (
                    <option key={day} value={day}>
                      Giornata {day}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {dashboardError && (
            <div className="border-t border-[#F26A00]/10 bg-[#FFF7F0] px-4 py-4 sm:px-7 lg:px-8">
              <div className="rounded-2xl border border-[#D6452F]/20 bg-[#D6452F]/10 px-4 py-3 text-sm font-semibold text-[#B42318]">
                {dashboardError}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-[28px] bg-white p-4 shadow-[0_30px_80px_-50px_rgba(43,33,27,0.45)] ring-1 ring-[#F26A00]/10 sm:rounded-[34px] sm:p-6 lg:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#F26A00]/20 bg-[#FFF7F0] px-4 py-2 text-sm font-bold text-[#F26A00]">
                <span className="h-2 w-2 rounded-full bg-[#F26A00]" />
                Rosa fantasy
              </div>

              <h2 className="mt-4 text-2xl font-black tracking-tight text-[#2B211B] sm:text-3xl">
                I tuoi atleti
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#6A5B52]">
                Tocca un atleta per vedere bonus, malus e punteggio della
                giornata scelta.
              </p>
            </div>

            {roster?.players?.length > 0 && (
              <Link
                to="/my-roster"
                className="inline-flex justify-center rounded-2xl border border-[#F26A00]/25 bg-white px-4 py-3 text-sm font-black text-[#F26A00] transition-all hover:bg-[#F26A00] hover:text-white"
              >
                Gestisci rosa
              </Link>
            )}
          </div>

          {!roster?.players?.length ? (
            <EmptyRosterBox />
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {roster.players.map((player) => {
                const isSelected = selectedPlayer?.playerId === player.playerId;
                const playerIsCaptain = isCaptain(player.playerId);

                return (
                  <PlayerCard
                    key={player.playerId}
                    player={player}
                    selectedDay={selectedDay}
                    isSelected={isSelected}
                    isCaptain={playerIsCaptain}
                    dayTotal={getPlayerDayTotal(player.playerId, selectedDay)}
                    tournamentTotal={getPlayerTournamentTotal(player.playerId)}
                    onClick={() => setSelectedPlayer(player)}
                  />
                );
              })}
            </div>
          )}
        </section>

        <PlayerScoreDetail
          key={detailAnimationKey}
          selectedPlayer={selectedPlayer}
          selectedDay={selectedDay}
          loadingScore={loadingScore}
          scoreError={scoreError}
          playerScore={playerScore}
          isCaptain={isCaptain(selectedPlayer?.playerId)}
        />
      </div>
    </AppLayout>
  );
}

function PlayerCard({
  player,
  selectedDay,
  isSelected,
  isCaptain,
  dayTotal,
  tournamentTotal,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-[24px] border p-4 transition-all active:scale-[0.99] sm:rounded-[28px] sm:p-5 ${
        isSelected
          ? "border-[#F26A00] bg-[#F26A00] text-white shadow-[0_24px_55px_-32px_rgba(242,106,0,0.95)]"
          : "border-[#E9E2DB] bg-white text-[#2B211B] hover:border-[#F26A00]/40 hover:bg-[#FFF7F0]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={`text-xs font-black uppercase tracking-wide ${
              isSelected ? "text-white/75" : "text-[#F26A00]"
            }`}
          >
            {player.playerId}
          </div>

          <div className="mt-2 line-clamp-2 text-lg font-black leading-tight">
            {player.name}
          </div>

          <div
            className={`mt-1 truncate text-sm font-semibold ${
              isSelected ? "text-white/75" : "text-[#6A5B52]"
            }`}
          >
            {player.team} · {player.price} crediti
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {isSelected && (
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-[#F26A00]">
              ATTIVO
            </span>
          )}

          {isCaptain && (
            <span
              className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${
                isSelected ? "bg-white text-[#F26A00]" : "bg-[#F26A00] text-white"
              }`}
            >
              x2
            </span>
          )}
        </div>
      </div>

      <div
        className={`mt-4 grid grid-cols-2 gap-2 border-t pt-3 ${
          isSelected ? "border-white/20" : "border-[#E9E2DB]"
        }`}
      >
        <MiniScore
          label={`Day ${selectedDay}`}
          value={dayTotal}
          active={isSelected}
        />

        <MiniScore
          label="Totale"
          value={tournamentTotal}
          active={isSelected}
        />
      </div>
    </button>
  );
}

function MiniScore({ label, value, active }) {
  return (
    <div
      className={`rounded-2xl px-3 py-3 ${
        active
          ? "bg-white/15 ring-1 ring-white/20"
          : "bg-[#FFF7F0] ring-1 ring-[#F26A00]/10"
      }`}
    >
      <div
        className={
          active
            ? "text-[11px] font-bold text-white/70"
            : "text-[11px] font-bold text-[#6A5B52]"
        }
      >
        {label}
      </div>

      <div
        className={
          active
            ? "text-2xl font-black text-white"
            : "text-2xl font-black text-[#F26A00]"
        }
      >
        {value}
      </div>
    </div>
  );
}

function EmptyRosterBox() {
  return (
    <div className="mt-5 rounded-2xl border border-[#F26A00]/20 bg-[#FFF7F0] p-5">
      <div className="font-black text-[#F26A00]">Nessuna rosa salvata</div>

      <p className="mt-2 text-sm text-[#6A5B52]">
        Non hai ancora selezionato i tuoi atleti.
      </p>

      <Link
        to="/my-roster"
        className="mt-4 inline-flex rounded-2xl bg-[#F26A00] px-5 py-3 font-black text-white shadow-[0_18px_35px_-22px_rgba(242,106,0,0.9)] transition-all hover:bg-[#FF7F1F] active:translate-y-[1px]"
      >
        Crea fantasquadra
      </Link>
    </div>
  );
}

function PlayerScoreDetail({
  selectedPlayer,
  selectedDay,
  loadingScore,
  scoreError,
  playerScore,
  isCaptain,
}) {
  if (!selectedPlayer) {
    return (
      <section className="rounded-[28px] bg-white p-5 text-[#6A5B52] shadow-[0_30px_80px_-50px_rgba(43,33,27,0.45)] ring-1 ring-[#F26A00]/10 sm:rounded-[34px] sm:p-6">
        Seleziona un atleta per visualizzare il dettaglio dei punteggi.
      </section>
    );
  }

  const baseScore = Number(
    playerScore?.baseScore ?? playerScore?.totalScore ?? 0
  );
  const multiplier = Number(playerScore?.multiplier || (isCaptain ? 2 : 1));
  const totalScore = Number(playerScore?.totalScore || 0);

  return (
    <section className="animate-[tdfDetailIn_0.35s_ease-out] rounded-[28px] bg-white p-4 shadow-[0_30px_80px_-50px_rgba(43,33,27,0.45)] ring-1 ring-[#F26A00]/10 sm:rounded-[34px] sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-[#F26A00] sm:text-sm">
            Dettaglio giornata {selectedDay}
          </div>

          <h3 className="mt-2 text-2xl font-black tracking-tight text-[#2B211B] sm:text-3xl">
            {selectedPlayer.name}
          </h3>

          <p className="mt-1 text-sm font-semibold text-[#6A5B52]">
            {selectedPlayer.team}
          </p>

          {isCaptain && (
            <div className="mt-3 inline-flex animate-[tdfPop_0.28s_ease-out] rounded-full bg-[#F26A00] px-4 py-2 text-xs font-black uppercase tracking-wide text-white">
              Capitano · punti x2
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:min-w-[320px]">
          <ScoreBox label="Punti base" value={baseScore} />
          <ScoreBox label="Totale day" value={totalScore} highlight />

          {multiplier > 1 && (
            <div className="col-span-2 animate-[tdfFadeUp_0.35s_ease-out] rounded-2xl border border-[#F26A00]/15 bg-[#FFF7F0] px-4 py-3 text-center text-xs font-black text-[#6A5B52]">
              {baseScore} punti base × {multiplier}
            </div>
          )}
        </div>
      </div>

      {loadingScore && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#E9E2DB] bg-[#FFF7F0] px-4 py-4 text-sm font-semibold text-[#6A5B52]">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-[#F26A00] border-r-transparent" />
          Caricamento bonus/malus...
        </div>
      )}

      {scoreError && (
        <div className="mt-5 rounded-2xl border border-[#D6452F]/20 bg-[#D6452F]/10 px-4 py-3 text-sm font-semibold text-[#B42318]">
          {scoreError}
        </div>
      )}

      {!loadingScore && !scoreError && playerScore?.events?.length === 0 && (
        <div className="mt-5 animate-[tdfFadeUp_0.35s_ease-out] rounded-2xl border border-[#E9E2DB] bg-[#FFF7F0] px-4 py-4 text-sm font-semibold text-[#6A5B52]">
          Nessun bonus/malus caricato per questa giornata.
        </div>
      )}

      {!loadingScore && playerScore?.events?.length > 0 && (
        <>
          <div className="mt-5 space-y-3 md:hidden">
            {playerScore.events.map((event, index) => (
              <EventMobileCard
                key={index}
                event={event}
                delay={index * 55}
              />
            ))}
          </div>

          <div className="mt-5 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="bg-[#F26A00] text-white">
                  <th className="rounded-l-2xl px-4 py-3 text-left">Evento</th>
                  <th className="px-4 py-3 text-right">QTA</th>
                  <th className="px-4 py-3 text-right">Valore</th>
                  <th className="rounded-r-2xl px-4 py-3 text-right">
                    Totale
                  </th>
                </tr>
              </thead>

              <tbody>
                {playerScore.events.map((event, index) => (
                  <tr
                    key={index}
                    className="animate-[tdfFadeUp_0.35s_ease-out_both] border-b border-[#E9E2DB]"
                    style={{ animationDelay: `${index * 45}ms` }}
                  >
                    <td className="px-4 py-4">
                      <div className="font-black text-[#2B211B]">
                        {event.event}
                      </div>

                      {event.note && (
                        <div className="mt-1 text-xs text-[#6A5B52]">
                          {event.note}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right font-semibold text-[#6A5B52]">
                      {event.quantity}
                    </td>

                    <td className="px-4 py-4 text-right font-semibold text-[#6A5B52]">
                      {event.unitValue}
                    </td>

                    <td
                      className={`px-4 py-4 text-right font-black ${
                        Number(event.total) < 0
                          ? "text-[#D6452F]"
                          : "text-[#3FAE5A]"
                      }`}
                    >
                      {event.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function ScoreBox({ label, value, highlight = false }) {
  return (
    <div
      className={`rounded-3xl px-4 py-4 ${
        highlight
          ? "bg-[#F26A00] text-white"
          : "border border-[#F26A00]/20 bg-[#FFF7F0] text-[#2B211B]"
      }`}
    >
      <div
        className={`text-[10px] font-black uppercase tracking-[0.14em] ${
          highlight ? "text-white/75" : "text-[#6A5B52]"
        }`}
      >
        {label}
      </div>

      <div
        className={`mt-1 text-3xl font-black ${
          highlight ? "text-white" : "text-[#F26A00]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function EventMobileCard({ event, delay = 0 }) {
  const isNegative = Number(event.total) < 0;

  return (
    <div
      className="animate-[tdfFadeUp_0.35s_ease-out_both] rounded-2xl border border-[#E9E2DB] bg-white p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-black text-[#2B211B]">{event.event}</div>

          {event.note && (
            <div className="mt-1 text-xs font-semibold text-[#6A5B52]">
              {event.note}
            </div>
          )}
        </div>

        <div
          className={`shrink-0 animate-[tdfPop_0.28s_ease-out_both] rounded-full px-3 py-1 text-sm font-black ${
            isNegative
              ? "bg-[#D6452F]/10 text-[#B42318]"
              : "bg-[#3FAE5A]/10 text-[#247A3A]"
          }`}
          style={{ animationDelay: `${delay + 80}ms` }}
        >
          {event.total}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#E9E2DB] pt-3">
        <SmallInfo label="QTA" value={event.quantity} />
        <SmallInfo label="Valore" value={event.unitValue} />
      </div>
    </div>
  );
}

function SmallInfo({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#FFF7F0] px-3 py-3">
      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#6A5B52]">
        {label}
      </div>

      <div className="mt-1 text-lg font-black text-[#F26A00]">{value}</div>
    </div>
  );
}

export default Dashboard;