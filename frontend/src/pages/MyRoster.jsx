import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axiosClient";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import PageLoader from "../components/PageLoader";

function MyRoster() {
  const [settings, setSettings] = useState(null);
  const [locked, setLocked] = useState(false);

  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [captainPlayerId, setCaptainPlayerId] = useState("");

  const [existingRoster, setExistingRoster] = useState(null);

  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const rosterResponse = await api.get("/rosters/me");
      const playersResponse = await api.get("/players", {
        params: {
          active: "true",
          sort: "price_desc",
        },
      });

      const roster = rosterResponse.data?.roster;
      const settingsData = rosterResponse.data?.settings;

      setExistingRoster(roster || null);
      setSettings(settingsData || null);
      setLocked(Boolean(rosterResponse.data?.locked));

      setAllPlayers(playersResponse.data?.players || []);

      if (roster?.players?.length) {
        const loadedIds = roster.players.map((player) =>
          String(player.playerId).toUpperCase()
        );

        setSelectedIds(loadedIds);
        setCaptainPlayerId(
          roster.captainPlayerId
            ? String(roster.captainPlayerId).toUpperCase()
            : ""
        );
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Errore durante il caricamento della rosa"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedPlayers = useMemo(() => {
    return selectedIds
      .map((playerId) =>
        allPlayers.find(
          (player) => String(player.playerId).toUpperCase() === playerId
        )
      )
      .filter(Boolean);
  }, [selectedIds, allPlayers]);

  const totalCost = useMemo(() => {
    return selectedPlayers.reduce(
      (sum, player) => sum + Number(player.price || 0),
      0
    );
  }, [selectedPlayers]);

  const budgetCap = Number(settings?.budgetCap || 0);
  const rosterSize = Number(settings?.rosterSize || 4);
  const remainingBudget = budgetCap - totalCost;
  const remainingSlots = rosterSize - selectedIds.length;

  const selectedCaptainName =
    selectedPlayers.find(
      (player) => String(player.playerId).toUpperCase() === captainPlayerId
    )?.name || "-";

  const teams = useMemo(() => {
    return [...new Set(allPlayers.map((player) => player.team).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  }, [allPlayers]);

  const visiblePlayers = useMemo(() => {
    return allPlayers.filter((player) => {
      const playerId = String(player.playerId).toUpperCase();
      const isSelected = selectedIds.includes(playerId);

      const playerName = String(player.name || "").toLowerCase();
      const playerTeam = String(player.team || "").toLowerCase();
      const normalizedPlayerId = String(player.playerId || "").toLowerCase();
      const normalizedSearch = search.trim().toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        playerName.includes(normalizedSearch) ||
        playerTeam.includes(normalizedSearch) ||
        normalizedPlayerId.includes(normalizedSearch);

      const matchesTeam = !teamFilter || player.team === teamFilter;

      if (!matchesSearch || !matchesTeam) return false;

      if (isSelected) return true;

      if (selectedIds.length >= rosterSize) return false;

      return canCompleteRosterAfterBuying(player, {
        allPlayers,
        selectedIds,
        remainingBudget,
        remainingSlots,
      });
    });
  }, [
    allPlayers,
    selectedIds,
    search,
    teamFilter,
    remainingBudget,
    remainingSlots,
    rosterSize,
  ]);

  function togglePlayer(player) {
    setError("");
    setSuccess("");

    if (locked) {
      setError("La scelta dei giocatori è chiusa");
      return;
    }

    const playerId = String(player.playerId).toUpperCase();
    const isSelected = selectedIds.includes(playerId);

    if (isSelected) {
      setSelectedIds((prev) => prev.filter((id) => id !== playerId));

      if (captainPlayerId === playerId) {
        setCaptainPlayerId("");
      }

      return;
    }

    if (selectedIds.length >= rosterSize) {
      setError(`Puoi selezionare massimo ${rosterSize} giocatori`);
      return;
    }

    const canBuy = canCompleteRosterAfterBuying(player, {
      allPlayers,
      selectedIds,
      remainingBudget,
      remainingSlots,
    });

    if (!canBuy) {
      setError(
        "Questo atleta non è acquistabile: scegliendolo non riusciresti a completare la rosa con il budget restante"
      );
      return;
    }

    setSelectedIds((prev) => {
      const next = [...prev, playerId];

      if (!captainPlayerId && next.length === 1) {
        setCaptainPlayerId(playerId);
      }

      return next;
    });
  }

  function handleSelectCaptain(playerId) {
    setError("");
    setSuccess("");

    if (locked) {
      setError("La scelta dei giocatori è chiusa");
      return;
    }

    const normalizedPlayerId = String(playerId).toUpperCase();

    if (!selectedIds.includes(normalizedPlayerId)) {
      setError("Il capitano deve essere uno dei giocatori selezionati");
      return;
    }

    setCaptainPlayerId(normalizedPlayerId);
  }

  async function handleSaveRoster() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (selectedIds.length !== rosterSize) {
        setError(`Devi selezionare esattamente ${rosterSize} giocatori`);
        return;
      }

      if (totalCost > budgetCap) {
        setError("Budget superato");
        return;
      }

      if (!captainPlayerId) {
        setError("Devi selezionare un capitano");
        return;
      }

      if (!selectedIds.includes(String(captainPlayerId).toUpperCase())) {
        setError("Il capitano deve essere uno dei giocatori selezionati");
        return;
      }

      const response = await api.post("/rosters/me", {
        playerIds: selectedIds,
        captainPlayerId,
      });

      setSuccess(response.data?.message || "Fantasquadra salvata");
      setExistingRoster(response.data?.roster || null);
      setCaptainPlayerId(
        response.data?.roster?.captainPlayerId
          ? String(response.data.roster.captainPlayerId).toUpperCase()
          : captainPlayerId
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Errore durante il salvataggio della fantasquadra"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PageLoader text="Caricamento rosa..." />;
  }

  return (
    <AppLayout>
      <div className="space-y-5 pb-28 lg:space-y-6 lg:pb-0">
        <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_-45px_rgba(43,33,27,0.45)] ring-1 ring-[#F26A00]/10 sm:rounded-[34px]">
          <div className="relative bg-gradient-to-br from-[#F26A00] via-[#F97316] to-[#D95C00] px-4 py-6 text-white sm:px-7 sm:py-7 lg:px-8">
            <div className="absolute inset-0 opacity-15">
              <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full border-[55px] border-white" />
              <div className="absolute right-[-90px] top-8 h-72 w-72 rotate-45 rounded-[70px] bg-white" />
            </div>

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                  La tua fantasquadra
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
                  Seleziona {rosterSize} atleti rispettando il budget. Scegli
                  anche un capitano: i suoi punti valgono doppio.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[520px]">
                <HeroStat label="Budget" value={budgetCap} />
                <HeroStat label="Speso" value={totalCost} />
                <HeroStat label="Restante" value={remainingBudget} />
                <HeroStat
                  label="Atleti"
                  value={`${selectedIds.length}/${rosterSize}`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-[#F26A00]/10 bg-white md:grid-cols-4">
            <SummaryCell
              label="Stato"
              value={locked ? "Chiuso" : "Aperto"}
            />

            <SummaryCell label="Capitano" value={selectedCaptainName} />

            <SummaryCell
              label="Deadline"
              value={
                settings?.rosterLockAt
                  ? new Date(settings.rosterLockAt).toLocaleString("it-IT")
                  : "-"
              }
            />

            <SummaryCell
              label="Aggiornato"
              value={
                existingRoster?.lastUpdatedAt
                  ? new Date(existingRoster.lastUpdatedAt).toLocaleString(
                      "it-IT"
                    )
                  : "-"
              }
            />
          </div>
        </section>

        {(error || success) && (
          <section className="space-y-3">
            {error && (
              <div className="rounded-2xl border border-[#D6452F]/20 bg-[#D6452F]/10 px-4 py-3 text-sm font-semibold text-[#B42318]">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-2xl border border-[#3FAE5A]/20 bg-[#3FAE5A]/10 px-4 py-3 text-sm font-semibold text-[#247A3A]">
                {success}
              </div>
            )}
          </section>
        )}

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr] lg:gap-6">
          <aside className="h-fit rounded-[28px] bg-white p-4 shadow-[0_30px_80px_-50px_rgba(43,33,27,0.45)] ring-1 ring-[#F26A00]/10 sm:rounded-[34px] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-[#2B211B]">
                  Rosa scelta
                </h2>

                <p className="mt-1 text-sm leading-relaxed text-[#6A5B52]">
                  Imposta il capitano o rimuovi un atleta.
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-[#FFF7F0] px-3 py-1 text-sm font-black text-[#F26A00] ring-1 ring-[#F26A00]/15">
                {selectedIds.length}/{rosterSize}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {selectedPlayers.length > 0 ? (
                selectedPlayers.map((player) => {
                  const playerId = String(player.playerId).toUpperCase();
                  const isCaptain = captainPlayerId === playerId;

                  return (
                    <SelectedPlayerCard
                      key={player.playerId}
                      player={player}
                      isCaptain={isCaptain}
                      locked={locked}
                      onSelectCaptain={() =>
                        handleSelectCaptain(player.playerId)
                      }
                      onRemove={() => togglePlayer(player)}
                    />
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-[#F26A00]/25 bg-[#FFF7F0] px-4 py-6 text-center text-sm font-semibold text-[#6A5B52]">
                  Nessun atleta selezionato.
                </div>
              )}
            </div>

            <div className="mt-5 rounded-3xl border border-[#E9E2DB] bg-white p-4">
              <InfoRow label="Budget massimo" value={budgetCap} />
              <InfoRow label="Speso" value={totalCost} />
              <InfoRow label="Restante" value={remainingBudget} />
              <InfoRow label="Slot liberi" value={remainingSlots} />
              <InfoRow label="Capitano" value={selectedCaptainName} />
            </div>

            <button
              onClick={handleSaveRoster}
              disabled={saving || locked}
              className={`mt-5 hidden w-full rounded-2xl bg-[#F26A00] py-3 text-lg font-black text-white
                shadow-[0_18px_35px_-22px_rgba(242,106,0,0.9)] transition-all lg:block
                ${
                  saving || locked
                    ? "cursor-not-allowed opacity-70"
                    : "hover:bg-[#FF7F1F] active:translate-y-[1px]"
                }
              `}
            >
              {saving ? "Salvataggio..." : "Salva fantasquadra"}
            </button>

            <Link
              to="/dashboard"
              className="mt-3 hidden w-full justify-center rounded-2xl border border-[#F26A00]/25 bg-white px-5 py-3 font-black text-[#F26A00] transition-all hover:bg-[#F26A00] hover:text-white lg:inline-flex"
            >
              Torna alla dashboard
            </Link>
          </aside>

          <section className="rounded-[28px] bg-white p-4 shadow-[0_30px_80px_-50px_rgba(43,33,27,0.45)] ring-1 ring-[#F26A00]/10 sm:rounded-[34px] sm:p-6 lg:p-8">
            <div>
              <h2 className="text-2xl font-black text-[#2B211B] sm:text-3xl">
                Atleti disponibili
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#6A5B52]">
                La lista mostra solo gli atleti acquistabili senza bloccare il
                completamento della rosa.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_240px]">
              <div className="flex items-center gap-3 rounded-2xl border border-[#E9E2DB] bg-white px-4 py-3 shadow-[0_12px_30px_-24px_rgba(43,33,27,0.5)] focus-within:border-[#F26A00]">
                <span className="text-[#F26A00]">🔎</span>

                <input
                  type="text"
                  placeholder="Cerca atleta o squadra..."
                  className="w-full bg-transparent text-sm font-semibold text-[#2B211B] outline-none placeholder:text-[#8A7D73]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-[#E9E2DB] bg-white px-4 py-3 shadow-[0_12px_30px_-24px_rgba(43,33,27,0.5)] focus-within:border-[#F26A00]">
                <span className="text-[#F26A00]">🌍</span>

                <select
                  className="w-full bg-transparent text-sm font-semibold text-[#2B211B] outline-none"
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                >
                  <option value="">Tutte le squadre</option>
                  {teams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-[#FFF7F0] px-4 py-3 text-sm font-semibold text-[#6A5B52] ring-1 ring-[#F26A00]/10">
              <span>{visiblePlayers.length} atleti visibili</span>
              <span>{remainingBudget} crediti rimasti</span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visiblePlayers.map((player) => {
                const playerId = String(player.playerId).toUpperCase();
                const isSelected = selectedIds.includes(playerId);
                const isCaptain = captainPlayerId === playerId;

                return (
                  <AvailablePlayerCard
                    key={player.playerId}
                    player={player}
                    isSelected={isSelected}
                    isCaptain={isCaptain}
                    locked={locked}
                    onClick={() => togglePlayer(player)}
                  />
                );
              })}
            </div>

            {visiblePlayers.length === 0 && (
              <div className="mt-8 rounded-2xl border border-[#E9E2DB] bg-[#FFF7F0] p-6 text-center text-sm font-semibold text-[#6A5B52]">
                Nessun atleta acquistabile: con il budget restante non è
                possibile completare la rosa.
              </div>
            )}
          </section>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#F26A00]/15 bg-white/95 px-4 py-3 shadow-[0_-20px_50px_-35px_rgba(43,33,27,0.65)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <Link
              to="/dashboard"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#F26A00]/25 bg-white text-xl font-black text-[#F26A00]"
              aria-label="Torna alla dashboard"
            >
              ←
            </Link>

            <button
              onClick={handleSaveRoster}
              disabled={saving || locked}
              className={`h-12 flex-1 rounded-2xl bg-[#F26A00] px-4 text-sm font-black text-white shadow-[0_18px_35px_-22px_rgba(242,106,0,0.9)] transition-all ${
                saving || locked
                  ? "cursor-not-allowed opacity-70"
                  : "active:translate-y-[1px]"
              }`}
            >
              {saving
                ? "Salvataggio..."
                : `Salva rosa · ${selectedIds.length}/${rosterSize}`}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function SelectedPlayerCard({
  player,
  isCaptain,
  locked,
  onSelectCaptain,
  onRemove,
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 shadow-[0_18px_35px_-24px_rgba(242,106,0,0.9)] ${
        isCaptain
          ? "border-[#F26A00] bg-[#F26A00] text-white"
          : "border-[#E9E2DB] bg-white text-[#2B211B]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={`truncate font-black ${
              isCaptain ? "text-white" : "text-[#2B211B]"
            }`}
          >
            {player.name}
          </div>

          <div
            className={`mt-1 truncate text-sm font-semibold ${
              isCaptain ? "text-white/75" : "text-[#6A5B52]"
            }`}
          >
            {player.team}
          </div>
        </div>

        <div
          className={`shrink-0 rounded-full px-3 py-1 text-sm font-black ${
            isCaptain
              ? "bg-white text-[#F26A00]"
              : "bg-[#FFF7F0] text-[#F26A00] ring-1 ring-[#F26A00]/15"
          }`}
        >
          {player.price}
        </div>
      </div>

      <div
        className={`mt-4 grid grid-cols-2 gap-2 border-t pt-3 ${
          isCaptain ? "border-white/20" : "border-[#E9E2DB]"
        }`}
      >
        <button
          type="button"
          onClick={onSelectCaptain}
          disabled={locked}
          className={`rounded-2xl px-3 py-3 text-xs font-black transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
            isCaptain
              ? "bg-white text-[#F26A00]"
              : "bg-[#F26A00] text-white hover:bg-[#FF7F1F]"
          }`}
        >
          {isCaptain ? "Capitano x2" : "Capitano"}
        </button>

        <button
          type="button"
          onClick={onRemove}
          disabled={locked}
          className={`rounded-2xl px-3 py-3 text-xs font-black transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
            isCaptain
              ? "bg-white/15 text-white ring-1 ring-white/20"
              : "border border-[#F26A00]/25 bg-white text-[#F26A00]"
          }`}
        >
          Rimuovi
        </button>
      </div>
    </div>
  );
}

function AvailablePlayerCard({ player, isSelected, isCaptain, locked, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`text-left rounded-[24px] border p-4 transition-all disabled:cursor-not-allowed disabled:opacity-70 sm:rounded-[28px] sm:p-5 ${
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

          <div className="mt-2 line-clamp-2 text-base font-black leading-tight sm:text-lg">
            {player.name}
          </div>

          <div
            className={`mt-1 truncate text-sm font-semibold ${
              isSelected ? "text-white/75" : "text-[#6A5B52]"
            }`}
          >
            {player.team}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div
            className={`rounded-full px-3 py-1 text-sm font-black ${
              isSelected
                ? "bg-white text-[#F26A00]"
                : "bg-[#FFF7F0] text-[#F26A00] ring-1 ring-[#F26A00]/15"
            }`}
          >
            {player.price}
          </div>

          {isCaptain && (
            <div className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#F26A00]">
              x2
            </div>
          )}
        </div>
      </div>

      <div
        className={`mt-4 border-t pt-3 text-sm font-black ${
          isSelected
            ? "border-white/20 text-white"
            : "border-[#E9E2DB] text-[#F26A00]"
        }`}
      >
        {isSelected ? "Tocca per rimuovere" : "Tocca per selezionare"}
      </div>
    </button>
  );
}

function canCompleteRosterAfterBuying(
  player,
  { allPlayers, selectedIds, remainingBudget, remainingSlots }
) {
  const selectedIdSet = new Set(selectedIds.map(String));
  const playerId = String(player.playerId).toUpperCase();
  const price = Number(player.price || 0);

  if (selectedIdSet.has(playerId)) {
    return true;
  }

  if (price > remainingBudget) {
    return false;
  }

  const slotsAfterPurchase = remainingSlots - 1;
  const budgetAfterPurchase = remainingBudget - price;

  if (slotsAfterPurchase <= 0) {
    return budgetAfterPurchase >= 0;
  }

  const cheapestOtherPlayers = allPlayers
    .filter((candidate) => {
      const candidateId = String(candidate.playerId).toUpperCase();
      const candidatePrice = Number(candidate.price || 0);

      return (
        candidateId !== playerId &&
        !selectedIdSet.has(candidateId) &&
        candidatePrice <= budgetAfterPurchase
      );
    })
    .map((candidate) => Number(candidate.price || 0))
    .sort((a, b) => a - b)
    .slice(0, slotsAfterPurchase);

  if (cheapestOtherPlayers.length < slotsAfterPurchase) {
    return false;
  }

  const minimumCostToComplete = cheapestOtherPlayers.reduce(
    (sum, value) => sum + value,
    0
  );

  return minimumCostToComplete <= budgetAfterPurchase;
}

function HeroStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/15 px-3 py-3 ring-1 ring-white/20 backdrop-blur-sm sm:rounded-3xl sm:px-4 sm:py-4">
      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-white/75 sm:text-xs">
        {label}
      </div>

      <div className="mt-1 text-xl font-black text-white sm:text-2xl">
        {value}
      </div>
    </div>
  );
}

function SummaryCell({ label, value }) {
  return (
    <div className="border-b border-r border-[#F26A00]/10 px-4 py-3 last:border-r-0 md:border-b-0 md:px-5 md:py-4">
      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#F26A00] sm:text-xs">
        {label}
      </div>

      <div className="mt-1 truncate text-sm font-bold text-[#2B211B]">
        {value}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#E9E2DB] py-3 last:border-b-0">
      <span className="text-sm font-semibold text-[#6A5B52]">{label}</span>
      <span className="max-w-[160px] truncate text-right font-black text-[#F26A00]">
        {value}
      </span>
    </div>
  );
}

export default MyRoster;