const express = require("express");
const LeaderboardEntry = require("../models/leaderboardEntryModel");
const FantasyTeamDayScore = require("../models/fantasyTeamDayScoreModel");
const { authenticateToken } = require("../middlewares/authenticateToken");
const { getFantasySettings } = require("../services/fantasySettings.service");

const router = express.Router();

function getCurrentUser(req) {
  return req.user?.user || req.user || {};
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function markCurrentUserEntry(entry, currentUser) {
  const entryUserId = String(entry.userId || "");
  const currentUserId = String(currentUser._id || "");

  const entryFantasyName = normalize(entry.fantasyTeamName);
  const entryNationalTeam = normalize(entry.nationalTeam);

  const userFantasyName = normalize(currentUser.fantasyTeamName);
  const userNationalTeam = normalize(currentUser.nationalTeam);
  const userAssignedTeam = normalize(currentUser.assignedTeamName);

  const isCurrentUser =
    Boolean(entryUserId && currentUserId && entryUserId === currentUserId) ||
    Boolean(entryFantasyName && entryFantasyName === userFantasyName) ||
    Boolean(entryNationalTeam && entryNationalTeam === userNationalTeam) ||
    Boolean(entryNationalTeam && entryNationalTeam === userAssignedTeam);

  return {
    ...entry,
    isCurrentUser,
  };
}

function publicGlobalEntry(entry, currentUser) {
  const marked = markCurrentUserEntry(entry, currentUser);

  return {
    fantasyTeamName: marked.fantasyTeamName || null,
    nationalTeam: marked.nationalTeam || null,
    position: Number(marked.position || 0),
    totalScore: Number(marked.totalScore || 0),
    isCurrentUser: Boolean(marked.isCurrentUser),
  };
}

function publicDayEntry(entry, currentUser) {
  const marked = markCurrentUserEntry(entry, currentUser);

  return {
    fantasyTeamName: marked.fantasyTeamName || null,
    nationalTeam: marked.nationalTeam || null,
    position: Number(marked.position || 0),
    dayTotal: Number(marked.dayTotal || 0),
    isCurrentUser: Boolean(marked.isCurrentUser),
  };
}

async function validateDayParam(req, res, next) {
  try {
    const day = Number(req.params.day);

    if (!Number.isInteger(day) || day < 1) {
      return res.status(400).json({
        error: true,
        message: "Giornata non valida",
      });
    }

    const settings = await getFantasySettings();
    const tournamentDays = Number(settings?.tournamentDays || 6);

    if (day > tournamentDays) {
      return res.status(400).json({
        error: true,
        message: "Giornata non valida",
      });
    }

    req.day = day;
    next();
  } catch (err) {
    console.error("Errore validazione giornata:", err);

    return res.status(500).json({
      error: true,
      message: "Errore interno del server",
    });
  }
}

router.get("/", authenticateToken, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);

    const leaderboardDocs = await LeaderboardEntry.find({})
      .sort({ position: 1, totalScore: -1 })
      .select("userId fantasyTeamName nationalTeam position totalScore")
      .lean();

    const leaderboard = leaderboardDocs.map((entry) =>
      publicGlobalEntry(entry, currentUser)
    );

    const currentUserEntry =
      leaderboard.find((entry) => entry.isCurrentUser) || null;

    return res.json({
      error: false,
      leaderboard,
      currentUserEntry,
    });
  } catch (err) {
    console.error("Errore leaderboard globale:", err);

    return res.status(500).json({
      error: true,
      message: "Errore interno del server",
    });
  }
});

router.get("/day/:day", authenticateToken, validateDayParam, async (req, res) => {
  try {
    const currentUser = getCurrentUser(req);
    const day = req.day;

    const leaderboardDocs = await FantasyTeamDayScore.find({ day })
      .sort({ position: 1, dayTotal: -1 })
      .select("userId fantasyTeamName nationalTeam position dayTotal")
      .lean();

    const leaderboard = leaderboardDocs.map((entry) =>
      publicDayEntry(entry, currentUser)
    );

    const winner = leaderboard[0] || null;
    const currentUserEntry =
      leaderboard.find((entry) => entry.isCurrentUser) || null;

    return res.json({
      error: false,
      day,
      winner,
      leaderboard,
      currentUserEntry,
    });
  } catch (err) {
    console.error("Errore leaderboard giornata:", err);

    return res.status(500).json({
      error: true,
      message: "Errore interno del server",
    });
  }
});

module.exports = router;