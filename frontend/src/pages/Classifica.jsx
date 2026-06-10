import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axiosClient";
import AppLayout from "../components/AppLayout";
import PageLoader from "../components/PageLoader";

const PAGE_SIZE = 20;

function Classifica() {
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [dayLeaderboard, setDayLeaderboard] = useState([]);
  const [winner, setWinner] = useState(null);

  const [globalUserEntry, setGlobalUserEntry] = useState(null);
  const [dayUserEntry, setDayUserEntry] = useState(null);

  const [settings, setSettings] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1);

  const [globalPage, setGlobalPage] = useState(0);
  const [dayPage, setDayPage] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadingDay, setLoadingDay] = useState(false);
  const [error, setError] = useState("");

  const tournamentDays = Number(settings?.tournamentDays || 6);

  const daysOptions = useMemo(() => {
    return Array.from({ length: tournamentDays }, (_, index) => index + 1);
  }, [tournamentDays]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    setDayPage(0);
    loadDayLeaderboard(selectedDay);
  }, [selectedDay]);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError("");

      const [settingsResponse, globalResponse] = await Promise.all([
        api.get("/fantasy-settings"),
        api.get("/leaderboard"),
      ]);

      setSettings(settingsResponse.data?.settings || null);
      setGlobalLeaderboard(globalResponse.data?.leaderboard || []);
      setGlobalUserEntry(globalResponse.data?.currentUserEntry || null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Errore durante il caricamento della classifica"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadDayLeaderboard(day) {
    try {
      setLoadingDay(true);
      setError("");

      const response = await api.get(`/leaderboard/day/${day}`);

      setDayLeaderboard(response.data?.leaderboard || []);
      setWinner(response.data?.winner || null);
      setDayUserEntry(response.data?.currentUserEntry || null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Errore durante il caricamento della classifica di giornata"
      );
    } finally {
      setLoadingDay(false);
    }
  }

  if (loading) {
    return <PageLoader text="Caricamento classifica..." />;
  }

  return (
    <AppLayout>
      <div className="space-y-5 sm:space-y-6">
        <section className="overflow-hidden rounded-[26px] bg-white shadow-[0_24px_70px_-45px_rgba(43,33,27,0.45)] ring-1 ring-[#F26A00]/10 sm:rounded-[34px]">
          <div className="relative bg-gradient-to-br from-[#F26A00] via-[#F97316] to-[#D95C00] px-4 py-6 text-white sm:px-7 sm:py-7 lg:px-8">
            <div className="absolute inset-0 opacity-15">
              <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full border-[55px] border-white" />
              <div className="absolute right-[-120px] top-10 h-64 w-64 rotate-45 rounded-[70px] bg-white sm:right-[-90px] sm:h-72 sm:w-72" />
            </div>

            <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
              <div>
                <h1 className="max-w-[320px] text-3xl font-black leading-tight tracking-tight sm:max-w-none sm:text-5xl">
                  Classifica TDFantasy
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
                  Consulta la classifica generale e quella di giornata. La tua
                  squadra viene evidenziata automaticamente.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <WinnerBox winner={winner} selectedDay={selectedDay} />

                  <div className="rounded-[24px] bg-white/15 p-4 ring-1 ring-white/20 backdrop-blur-sm sm:rounded-3xl">
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

              <div className="rounded-[24px] bg-white px-4 py-4 text-[#2B211B] shadow-[0_18px_35px_-28px_rgba(43,33,27,0.65)] sm:rounded-3xl sm:px-5 sm:py-5">
                <div className="text-xs font-black uppercase tracking-[0.14em] text-[#F26A00]">
                  Riepilogo
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <SummaryMiniBox
                    label="Generale"
                    value={globalLeaderboard.length}
                  />

                  <SummaryMiniBox
                    label={`Giornata ${selectedDay}`}
                    value={dayLeaderboard.length}
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="border-t border-[#F26A00]/10 bg-[#FFF7F0] px-4 py-4 sm:px-7 lg:px-8">
              <div className="rounded-2xl border border-[#D6452F]/20 bg-[#D6452F]/10 px-4 py-3 text-sm font-semibold text-[#B42318]">
                {error}
              </div>
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
          <LeaderboardPanel
            title="Classifica generale"
            subtitle="Mostra 20 squadre per volta"
            loading={false}
          >
            <LeaderboardBlock
              leaderboard={globalLeaderboard}
              userEntry={globalUserEntry}
              page={globalPage}
              setPage={setGlobalPage}
              scoreKey="totalScore"
              scoreLabel="Totale"
              emptyText="Classifica generale non ancora disponibile."
            />
          </LeaderboardPanel>

          <LeaderboardPanel
            title={`Classifica giornata ${selectedDay}`}
            subtitle="Mostra 20 squadre per volta"
            loading={loadingDay}
          >
            <LeaderboardBlock
              leaderboard={dayLeaderboard}
              userEntry={dayUserEntry}
              page={dayPage}
              setPage={setDayPage}
              scoreKey="dayTotal"
              scoreLabel="Punti"
              emptyText="Classifica giornata non ancora disponibile."
            />
          </LeaderboardPanel>
        </section>
      </div>
    </AppLayout>
  );
}

function LeaderboardBlock({
  leaderboard,
  userEntry,
  page,
  setPage,
  scoreKey,
  scoreLabel,
  emptyText,
}) {
  const items = leaderboard || [];

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);

  const startIndex = safePage * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const visibleItems = items.slice(startIndex, endIndex);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage, setPage]);

  if (!items.length) {
    return <EmptyTable text={emptyText} />;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {userEntry && (
        <CurrentUserBox
          entry={userEntry}
          scoreKey={scoreKey}
          onGoToUser={() => {
            const userIndex = items.findIndex((item) => item.isCurrentUser);

            if (userIndex >= 0) {
              setPage(Math.floor(userIndex / PAGE_SIZE));
            }
          }}
        />
      )}

      <LeaderboardSlider
        page={safePage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={Math.min(endIndex, items.length)}
        totalItems={items.length}
        setPage={setPage}
      />

      <div className="grid gap-3 sm:hidden">
        {visibleItems.map((item, index) => (
          <LeaderboardMobileCard
            key={item._id || item.userId || `${safePage}-mobile-${index}`}
            item={item}
            fallbackPosition={startIndex + index + 1}
            scoreKey={scoreKey}
            scoreLabel={scoreLabel}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="bg-[#F26A00] text-white">
              <th className="rounded-l-2xl px-4 py-3 text-left">Pos</th>
              <th className="px-4 py-3 text-left">Squadra</th>
              <th className="rounded-r-2xl px-4 py-3 text-right">
                {scoreLabel}
              </th>
            </tr>
          </thead>

          <tbody>
            {visibleItems.map((item, index) => (
              <LeaderboardRow
                key={item._id || item.userId || `${safePage}-${index}`}
                item={item}
                fallbackPosition={startIndex + index + 1}
                scoreKey={scoreKey}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeaderboardMobileCard({
  item,
  fallbackPosition,
  scoreKey,
  scoreLabel,
}) {
  const isCurrentUser = Boolean(item.isCurrentUser);
  const position = item.position || fallbackPosition;

  return (
    <article
      className={`rounded-[24px] border p-4 ${
        isCurrentUser
          ? "border-[#F26A00]/30 bg-[#FFF1E6]"
          : "border-[#E9E2DB] bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <PositionBadge position={position} active={isCurrentUser} />

          <div className="min-w-0">
            <div
              className={`break-words text-base font-black leading-tight ${
                isCurrentUser ? "text-[#F26A00]" : "text-[#2B211B]"
              }`}
            >
              {item.fantasyTeamName || item.nationalTeam}

              {isCurrentUser && (
                <span className="ml-2 inline-flex rounded-full bg-[#F26A00] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                  Tu
                </span>
              )}
            </div>

            {item.nationalTeam && item.fantasyTeamName && (
              <div className="mt-1 text-xs font-semibold text-[#6A5B52]">
                {item.nationalTeam}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 rounded-2xl bg-[#F26A00] px-3 py-2 text-right text-white">
          <div className="text-[9px] font-black uppercase tracking-[0.12em] text-white/75">
            {scoreLabel}
          </div>

          <div className="text-xl font-black">{item[scoreKey] ?? 0}</div>
        </div>
      </div>
    </article>
  );
}

function LeaderboardRow({ item, fallbackPosition, scoreKey }) {
  const isCurrentUser = Boolean(item.isCurrentUser);

  return (
    <tr
      className={`border-b ${
        isCurrentUser
          ? "border-[#F26A00]/30 bg-[#FFF1E6]"
          : "border-[#E9E2DB] bg-white"
      }`}
    >
      <td className="px-4 py-4 align-top">
        <PositionBadge
          position={item.position || fallbackPosition}
          active={isCurrentUser}
        />
      </td>

      <td className="px-4 py-4">
        <div
          className={`font-black ${
            isCurrentUser ? "text-[#F26A00]" : "text-[#2B211B]"
          }`}
        >
          {item.fantasyTeamName || item.nationalTeam}

          {isCurrentUser && (
            <span className="ml-2 rounded-full bg-[#F26A00] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">
              Tu
            </span>
          )}
        </div>

        {item.nationalTeam && item.fantasyTeamName && (
          <div className="mt-1 text-xs font-semibold text-[#6A5B52]">
            {item.nationalTeam}
          </div>
        )}
      </td>

      <td className="px-4 py-4 text-right text-xl font-black text-[#F26A00]">
        {item[scoreKey] ?? 0}
      </td>
    </tr>
  );
}

function CurrentUserBox({ entry, scoreKey, onGoToUser }) {
  return (
    <div className="rounded-[24px] border border-[#F26A00]/25 bg-[#FFF7F0] p-4 sm:rounded-3xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-[#F26A00]">
            La tua squadra
          </div>

          <div className="mt-1 break-words text-xl font-black leading-tight text-[#2B211B]">
            {entry.fantasyTeamName || entry.nationalTeam}
          </div>

          <p className="mt-1 text-sm font-semibold text-[#6A5B52]">
            Posizione {entry.position || "-"}
          </p>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3 sm:flex sm:items-center">
          <div className="rounded-2xl bg-[#F26A00] px-4 py-3 text-right text-white">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-white/75">
              Punti
            </div>

            <div className="text-2xl font-black">{entry[scoreKey] ?? 0}</div>
          </div>

          <button
            type="button"
            onClick={onGoToUser}
            className="rounded-2xl border border-[#F26A00]/25 bg-white px-4 py-3 text-sm font-black text-[#F26A00] transition-all hover:bg-[#F26A00] hover:text-white"
          >
            Vai
          </button>
        </div>
      </div>
    </div>
  );
}

function LeaderboardSlider({
  page,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  setPage,
}) {
  if (totalPages <= 1) {
    return (
      <div className="rounded-2xl border border-[#E9E2DB] bg-[#FFF7F0] px-4 py-3 text-sm font-semibold text-[#6A5B52]">
        Visualizzazione 1-{totalItems} di {totalItems}
      </div>
    );
  }

  const canGoPrev = page > 0;
  const canGoNext = page < totalPages - 1;

  return (
    <div className="rounded-[22px] border border-[#E9E2DB] bg-[#FFF7F0] p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="text-sm font-black text-[#2B211B]">
          Posizioni {startIndex + 1}-{endIndex} di {totalItems}
        </div>

        <div className="text-sm font-black text-[#F26A00]">
          Pagina {page + 1}/{totalPages}
        </div>
      </div>

      <input
        type="range"
        min="0"
        max={totalPages - 1}
        value={page}
        onChange={(e) => setPage(Number(e.target.value))}
        className="mt-4 w-full accent-[#F26A00]"
      />

      <div className="mt-4 grid grid-cols-2 gap-3 sm:hidden">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => setPage((current) => Math.max(0, current - 1))}
          className="rounded-2xl border border-[#F26A00]/20 bg-white px-4 py-3 text-sm font-black text-[#F26A00] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Prec.
        </button>

        <button
          type="button"
          disabled={!canGoNext}
          onClick={() =>
            setPage((current) => Math.min(totalPages - 1, current + 1))
          }
          className="rounded-2xl bg-[#F26A00] px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Succ.
        </button>
      </div>
    </div>
  );
}

function WinnerBox({ winner, selectedDay }) {
  if (!winner) {
    return (
      <div className="rounded-[24px] bg-white/15 p-4 ring-1 ring-white/20 backdrop-blur-sm sm:rounded-3xl">
        <div className="text-sm font-black text-white/85">
          🏆 Vincitore giornata {selectedDay}
        </div>

        <div className="mt-3 rounded-2xl bg-white/10 px-4 py-4 text-sm font-semibold text-white/75 ring-1 ring-white/15">
          Non ancora disponibile
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] bg-white p-4 text-[#2B211B] shadow-[0_18px_35px_-28px_rgba(43,33,27,0.65)] sm:rounded-3xl">
      <div className="text-sm font-black text-[#F26A00]">
        🏆 Vincitore giornata {selectedDay}
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="break-words text-2xl font-black leading-tight text-[#2B211B]">
            {winner.fantasyTeamName || winner.nationalTeam}
          </div>

          {winner.nationalTeam && winner.fantasyTeamName && (
            <div className="mt-1 text-xs font-semibold text-[#6A5B52]">
              {winner.nationalTeam}
            </div>
          )}
        </div>

        <div className="w-full rounded-2xl bg-[#F26A00] px-4 py-3 text-right text-white sm:w-auto">
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-white/75">
            Punti
          </div>

          <div className="text-2xl font-black">{winner.dayTotal}</div>
        </div>
      </div>
    </div>
  );
}

function SummaryMiniBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#F26A00]/15 bg-[#FFF7F0] px-3 py-3 sm:px-4">
      <div className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6A5B52] sm:text-xs">
        {label}
      </div>

      <div className="mt-1 text-2xl font-black text-[#F26A00]">{value}</div>
    </div>
  );
}

function LeaderboardPanel({ title, subtitle, loading, children }) {
  return (
    <section className="rounded-[26px] bg-white p-4 shadow-[0_24px_70px_-50px_rgba(43,33,27,0.45)] ring-1 ring-[#F26A00]/10 sm:rounded-[34px] sm:p-6 lg:p-8">
      <div>
        <h2 className="text-2xl font-black leading-tight text-[#2B211B] sm:text-3xl">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-relaxed text-[#6A5B52]">
          {subtitle}
        </p>
      </div>

      {loading ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#E9E2DB] bg-[#FFF7F0] p-5 text-sm font-semibold text-[#6A5B52]">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-[#F26A00] border-r-transparent" />
          Caricamento giornata...
        </div>
      ) : (
        <div className="mt-5">{children}</div>
      )}
    </section>
  );
}

function PositionBadge({ position, active = false }) {
  const isPodium = Number(position) <= 3;

  return (
    <span
      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-black ${
        active
          ? "bg-[#F26A00] text-white"
          : isPodium
          ? "bg-[#F26A00] text-white"
          : "bg-[#FFF7F0] text-[#F26A00] ring-1 ring-[#F26A00]/15"
      }`}
    >
      {position}
    </span>
  );
}

function EmptyTable({ text }) {
  return (
    <div className="rounded-2xl border border-[#E9E2DB] bg-[#FFF7F0] p-6 text-center text-sm font-semibold text-[#6A5B52]">
      {text}
    </div>
  );
}

export default Classifica;