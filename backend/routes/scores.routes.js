const express = require("express");
const mongoose = require("mongoose");

const Roster = require("../models/rosterModel");
const FantasyTeamDayScore = require("../models/fantasyTeamDayScoreModel");
const { authenticateToken } = require("../middlewares/authenticateToken");
const { getFantasySettings } = require("../services/fantasySettings.service");

const router = express.Router();

function normalizePlayerId(value) {
  return String(value || "").trim().toUpperCase();
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

function publicEvent(event) {
  return {
    event: event?.event || "",
    quantity: Number(event?.quantity || 0),
    unitValue: Number(event?.unitValue || 0),
    total: Number(event?.total || 0),
    note: event?.note || "",
  };
}

function publicPlayerScore(player) {
  const name = player?.name || player?.playerName || "";
  const team = player?.team || player?.playerTeam || "";

  return {
    playerId: player?.playerId || "",
    name,
    team,
    playerName: name,
    playerTeam: team,
    baseScore: Number(player?.baseScore || 0),
    isCaptain: Boolean(player?.isCaptain),
    multiplier: Number(player?.multiplier || 1),
    totalScore: Number(player?.totalScore || 0),
    events: Array.isArray(player?.events)
      ? player.events.map(publicEvent)
      : [],
  };
}

function publicTeamDayScore(score) {
  if (!score) return null;

  return {
    day: Number(score.day || 0),
    fantasyTeamName: score.fantasyTeamName || null,
    nationalTeam: score.nationalTeam || null,
    position: Number(score.position || 0),
    dayTotal: Number(score.dayTotal || 0),
    captainPlayerId: score.captainPlayerId || null,
    players: Array.isArray(score.players)
      ? score.players.map(publicPlayerScore)
      : [],
  };
}

router.get(
  "/player/:playerId/day/:day",
  authenticateToken,
  validateDayParam,
  async (req, res) => {
    try {
      const userId = req.user?.user?._id;
      const playerId = normalizePlayerId(req.params.playerId);
      const day = req.day;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(401).json({
          error: true,
          message: "Token non valido",
        });
      }

      if (!playerId) {
        return res.status(400).json({
          error: true,
          message: "Giocatore non valido",
        });
      }

      const roster = await Roster.findOne({ userId })
        .select("players captainPlayerId")
        .lean();

      if (!roster) {
        return res.status(404).json({
          error: true,
          message: "Rosa non trovata",
        });
      }

      const rosterPlayer = (roster.players || []).find(
        (player) => normalizePlayerId(player.playerId) === playerId
      );

      if (!rosterPlayer) {
        return res.status(403).json({
          error: true,
          message: "Questo giocatore non fa parte della tua rosa",
        });
      }

      const teamDayScore = await FantasyTeamDayScore.findOne({
        userId,
        day,
      })
        .select("day captainPlayerId players")
        .lean();

      if (!teamDayScore) {
        const isCaptain =
          normalizePlayerId(roster.captainPlayerId) ===
          normalizePlayerId(rosterPlayer.playerId);

        return res.json({
          error: false,
          day,
          player: {
            playerId,
            name: rosterPlayer.name || "",
            team: rosterPlayer.team || "",
            playerName: rosterPlayer.name || "",
            playerTeam: rosterPlayer.team || "",
            baseScore: 0,
            isCaptain,
            multiplier: isCaptain ? 2 : 1,
            totalScore: 0,
            events: [],
          },
          message: "Nessun punteggio caricato per questa giornata",
        });
      }

      const playerScore = (teamDayScore.players || []).find(
        (player) => normalizePlayerId(player.playerId) === playerId
      );

      if (!playerScore) {
        const isCaptain =
          normalizePlayerId(teamDayScore.captainPlayerId) === playerId;

        return res.json({
          error: false,
          day,
          player: {
            playerId,
            name: rosterPlayer.name || "",
            team: rosterPlayer.team || "",
            playerName: rosterPlayer.name || "",
            playerTeam: rosterPlayer.team || "",
            baseScore: 0,
            isCaptain,
            multiplier: isCaptain ? 2 : 1,
            totalScore: 0,
            events: [],
          },
          message: "Nessun punteggio caricato per questa giornata",
        });
      }

      return res.json({
        error: false,
        day,
        player: publicPlayerScore(playerScore),
      });
    } catch (err) {
      console.error("Errore score player day:", err);

      return res.status(500).json({
        error: true,
        message: "Errore interno del server",
      });
    }
  }
);

router.get(
  "/me/day/:day",
  authenticateToken,
  validateDayParam,
  async (req, res) => {
    try {
      const userId = req.user?.user?._id;
      const day = req.day;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(401).json({
          error: true,
          message: "Token non valido",
        });
      }

      const score = await FantasyTeamDayScore.findOne({
        userId,
        day,
      })
        .select(
          "day fantasyTeamName nationalTeam position dayTotal captainPlayerId players"
        )
        .lean();

      if (!score) {
        return res.json({
          error: false,
          day,
          score: null,
          message: "Nessun punteggio caricato per questa giornata",
        });
      }

      return res.json({
        error: false,
        day,
        score: publicTeamDayScore(score),
      });
    } catch (err) {
      console.error("Errore score me day:", err);

      return res.status(500).json({
        error: true,
        message: "Errore interno del server",
      });
    }
  }
);

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user?._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        error: true,
        message: "Token non valido",
      });
    }

    const scores = await FantasyTeamDayScore.find({ userId })
      .sort({ day: 1 })
      .select(
        "day fantasyTeamName nationalTeam position dayTotal captainPlayerId players"
      )
      .lean();

    const publicScores = scores.map(publicTeamDayScore);

    const total = publicScores.reduce(
      (sum, item) => sum + Number(item?.dayTotal || 0),
      0
    );

    return res.json({
      error: false,
      total,
      scores: publicScores,
    });
  } catch (err) {
    console.error("Errore score me:", err);

    return res.status(500).json({
      error: true,
      message: "Errore interno del server",
    });
  }
});

module.exports = router;