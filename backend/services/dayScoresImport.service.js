const RefReportEvent = require("../models/refReportEventModel");
const PlayerDayScore = require("../models/playerDayScoreModel");
const FantasyTeamDayScore = require("../models/fantasyTeamDayScoreModel");
const LeaderboardEntry = require("../models/leaderboardEntryModel");
const Roster = require("../models/rosterModel");
const { readSheetValues } = require("./googleSheets.service");

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizePlayerId(value) {
  return String(value || "").trim().toUpperCase();
}

function parseNumber(value) {
  const normalized = String(value || "")
    .trim()
    .replace(",", ".");

  const parsed = Number(normalized);

  if (Number.isNaN(parsed)) return 0;

  return parsed;
}

function rowToObject(headers, row) {
  const obj = {};

  headers.forEach((header, index) => {
    obj[header] = row[index] ?? "";
  });

  return obj;
}

function calculatePositions(items, scoreField) {
  const sorted = [...items].sort((a, b) => {
    const diff = Number(b[scoreField] || 0) - Number(a[scoreField] || 0);

    if (diff !== 0) return diff;

    return String(a.fantasyTeamName || "").localeCompare(
      String(b.fantasyTeamName || "")
    );
  });

  let currentPosition = 0;
  let previousScore = null;

  return sorted.map((item, index) => {
    const score = Number(item[scoreField] || 0);

    if (previousScore === null || score !== previousScore) {
      currentPosition = index + 1;
      previousScore = score;
    }

    return {
      ...item,
      position: currentPosition,
    };
  });
}

function parseRefReportRow(rowObj, requestedDay, rowNumber) {
  const day = parseNumber(rowObj.GIORNATA);

  if (!day || day !== Number(requestedDay)) {
    return {
      valid: false,
      skip: true,
      errors: [],
      event: null,
    };
  }

  const playerId = normalizePlayerId(rowObj.PLAYER_ID);
  const playerName = normalizeString(rowObj.NOME);
  const playerTeam = normalizeString(rowObj.SQUADRA);
  const eventName = normalizeString(rowObj.EVENTO);

  const quantity = parseNumber(rowObj.QTA);
  const unitValue = parseNumber(rowObj.VALORE_UNITARIO);
  const totalFromSheet = parseNumber(rowObj.TOTALE);
  const calculatedTotal = quantity * unitValue;

  const errors = [];

  if (!playerId) {
    errors.push(`Riga ${rowNumber}: PLAYER_ID mancante`);
  }

  if (!playerName) {
    errors.push(`Riga ${rowNumber}: NOME mancante`);
  }

  if (!playerTeam) {
    errors.push(`Riga ${rowNumber}: SQUADRA mancante`);
  }

  if (!eventName) {
    errors.push(`Riga ${rowNumber}: EVENTO mancante`);
  }

  if (!quantity) {
    errors.push(`Riga ${rowNumber}: QTA mancante o non valida`);
  }

  if (errors.length > 0) {
    return {
      valid: false,
      skip: false,
      errors,
      event: null,
    };
  }

  return {
    valid: true,
    skip: false,
    errors: [],
    event: {
      day,
      teamA: normalizeString(rowObj.SQUADRA_A),
      teamB: normalizeString(rowObj.SQUADRA_B),
      playerId,
      playerName,
      playerTeam,
      event: eventName,
      quantity,
      unitValue,
      total: totalFromSheet || calculatedTotal,
      note: normalizeString(rowObj.NOTE),
      source: "google_sheets",
      importedAt: new Date(),
    },
  };
}

async function importScoresForDay(day) {
  const requestedDay = Number(day);

  if (!requestedDay || requestedDay < 1) {
    throw new Error("Giornata non valida");
  }

const sheetName = process.env.GOOGLE_REPORT_DB_SHEET_NAME || "REPORT_DB";
const range = process.env.GOOGLE_REPORT_DB_RANGE || `${sheetName}!A:K`;
  const values = await readSheetValues(range);

  if (!values.length) {
    return {
      day: requestedDay,
      eventsImported: 0,
      playersScored: 0,
      teamsCalculated: 0,
      errors: ["REPORT_DB vuoto"],
    };
  }

  const headerRowIndex = values.findIndex((row) => {
    const headers = row.map(normalizeHeader);

    return (
      headers.includes("GIORNATA") &&
      headers.includes("PLAYER_ID") &&
      headers.includes("EVENTO") &&
      headers.includes("TOTALE")
    );
  });

  if (headerRowIndex === -1) {
    return {
      day: requestedDay,
      eventsImported: 0,
      playersScored: 0,
      teamsCalculated: 0,
      errors: [
        "Header REPORT_DB non trovati. Servono almeno GIORNATA, PLAYER_ID, EVENTO, TOTALE.",
      ],
    };
  }

  const headers = values[headerRowIndex].map(normalizeHeader);
  const dataRows = values.slice(headerRowIndex + 1);

  const parsedEvents = [];
  const errors = [];

  dataRows.forEach((row, index) => {
    const absoluteRowNumber = headerRowIndex + index + 2;
    const isEmpty = row.every((cell) => String(cell || "").trim() === "");

    if (isEmpty) return;

    const rowObj = rowToObject(headers, row);
    const parsed = parseRefReportRow(rowObj, requestedDay, absoluteRowNumber);

    if (parsed.skip) return;

    if (!parsed.valid) {
      errors.push(...parsed.errors);
      return;
    }

    parsedEvents.push(parsed.event);
  });

  if (!parsedEvents.length) {
    await clearDayData(requestedDay);

    return {
      day: requestedDay,
      eventsImported: 0,
      playersScored: 0,
      teamsCalculated: 0,
      errors:
        errors.length > 0
          ? errors
          : [`Nessun evento trovato per la giornata ${requestedDay}`],
    };
  }

  await clearDayData(requestedDay);

  await RefReportEvent.insertMany(parsedEvents);

  const playerDayScores = await buildPlayerDayScores(requestedDay);
  const fantasyScores = await buildFantasyTeamDayScores(requestedDay);
  const rankedFantasyScores = await rankFantasyTeamDayScores(
    requestedDay,
    fantasyScores
  );

  await recalculateGlobalLeaderboard();

  const winner = rankedFantasyScores[0] || null;

  return {
    day: requestedDay,
    eventsImported: parsedEvents.length,
    playersScored: playerDayScores.length,
    teamsCalculated: rankedFantasyScores.length,
    dayWinner: winner?.fantasyTeamName || null,
    dayWinnerScore: winner?.dayTotal ?? null,
    errors,
  };
}

async function clearDayData(day) {
  await RefReportEvent.deleteMany({ day });
  await PlayerDayScore.deleteMany({ day });
  await FantasyTeamDayScore.deleteMany({ day });
}

async function buildPlayerDayScores(day) {
  const events = await RefReportEvent.find({ day }).lean();

  const byPlayer = new Map();

  for (const event of events) {
    if (!byPlayer.has(event.playerId)) {
      byPlayer.set(event.playerId, {
        day,
        playerId: event.playerId,
        playerName: event.playerName,
        playerTeam: event.playerTeam,
        events: [],
        totalScore: 0,
        calculatedAt: new Date(),
      });
    }

    const item = byPlayer.get(event.playerId);

    item.events.push({
      event: event.event,
      quantity: event.quantity,
      unitValue: event.unitValue,
      total: event.total,
      note: event.note || "",
    });

    item.totalScore += Number(event.total || 0);
  }

  const scores = [...byPlayer.values()];

  if (scores.length) {
    await PlayerDayScore.insertMany(scores);
  }

  return scores;
}

async function buildFantasyTeamDayScores(day) {
  const rosters = await Roster.find({ status: "complete" }).lean();
  const playerScores = await PlayerDayScore.find({ day }).lean();

  const scoreByPlayerId = new Map();

  playerScores.forEach((score) => {
    scoreByPlayerId.set(normalizePlayerId(score.playerId), score);
  });

  const fantasyScores = rosters.map((roster) => {
    const captainPlayerId = normalizePlayerId(roster.captainPlayerId);

    const players = (roster.players || []).map((rosterPlayer) => {
      const rosterPlayerId = normalizePlayerId(rosterPlayer.playerId);
      const playerScore = scoreByPlayerId.get(rosterPlayerId);

      const baseScore = Number(playerScore?.totalScore || 0);
      const isCaptain =
        Boolean(captainPlayerId) && rosterPlayerId === captainPlayerId;
      const multiplier = isCaptain ? 2 : 1;
      const totalScore = baseScore * multiplier;

      return {
        playerId: rosterPlayer.playerId,
        name: rosterPlayer.name,
        team: rosterPlayer.team,
        baseScore,
        isCaptain,
        multiplier,
        totalScore,
        events: playerScore?.events || [],
      };
    });

    const dayTotal = players.reduce(
      (sum, player) => sum + Number(player.totalScore || 0),
      0
    );

    return {
      day,
      userId: roster.userId,
      userEmail: roster.userEmail,
      fantasyTeamName:
        roster.assignedTeamName || roster.fantasyTeamName || roster.nationalTeam,
      nationalTeam:
        roster.nationalTeam || roster.assignedTeamName || roster.fantasyTeamName,
      captainPlayerId,
      players,
      dayTotal,
      calculatedAt: new Date(),
    };
  });

  if (fantasyScores.length) {
    await FantasyTeamDayScore.insertMany(fantasyScores);
  }

  return fantasyScores;
}

async function rankFantasyTeamDayScores(day, fantasyScores) {
  const ranked = calculatePositions(fantasyScores, "dayTotal");

  for (const item of ranked) {
    await FantasyTeamDayScore.updateOne(
      {
        day,
        userId: item.userId,
      },
      {
        $set: {
          position: item.position,
        },
      }
    );
  }

  return ranked;
}

async function recalculateGlobalLeaderboard() {
  const allDayScores = await FantasyTeamDayScore.find({}).lean();

  const byUser = new Map();

  for (const dayScore of allDayScores) {
    const key = String(dayScore.userId);

    if (!byUser.has(key)) {
      byUser.set(key, {
        userId: dayScore.userId,
        userEmail: dayScore.userEmail,
        fantasyTeamName: dayScore.fantasyTeamName,
        nationalTeam: dayScore.nationalTeam,
        totalScore: 0,
        days: [],
        lastCalculatedAt: new Date(),
      });
    }

    const item = byUser.get(key);

    item.totalScore += Number(dayScore.dayTotal || 0);

    item.days.push({
      day: dayScore.day,
      score: dayScore.dayTotal,
      position: dayScore.position,
    });
  }

  const entries = [...byUser.values()].map((entry) => ({
    ...entry,
    days: entry.days.sort((a, b) => a.day - b.day),
  }));

  const ranked = calculatePositions(entries, "totalScore");

  await LeaderboardEntry.deleteMany({});

  if (ranked.length) {
    await LeaderboardEntry.insertMany(ranked);
  }

  return ranked;
}

module.exports = {
  importScoresForDay,
};