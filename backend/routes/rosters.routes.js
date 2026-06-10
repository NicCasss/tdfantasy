const express = require("express");
const mongoose = require("mongoose");

const Player = require("../models/playerModel");
const Roster = require("../models/rosterModel");
const { authenticateToken } = require("../middlewares/authenticateToken");
const {
  getFantasySettings,
  isRosterLocked,
} = require("../services/fantasySettings.service");

const router = express.Router();

function normalizePlayerId(value) {
  return String(value || "").trim().toUpperCase();
}

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = req.user?.user;

    if (!mongoose.Types.ObjectId.isValid(user?._id)) {
      return res.status(401).json({
        error: true,
        message: "Token non valido",
      });
    }

    const roster = await Roster.findOne({
      userId: user._id,
    })
      .select(
        "userEmail assignedTeamName players captainPlayerId totalCost budgetCap rosterSize status submittedAt lastUpdatedAt"
      )
      .lean();

    const settings = await getFantasySettings();

    return res.json({
      error: false,
      roster,
      settings,
      locked: isRosterLocked(settings),
    });
  } catch (err) {
    console.error("Errore get roster:", err);

    return res.status(500).json({
      error: true,
      message: "Errore interno del server",
    });
  }
});

router.get("/available-players", authenticateToken, async (req, res) => {
  try {
    const { remainingBudget } = req.query;

    const budget = Number(remainingBudget);

    const query = {
      active: true,
    };

    if (!Number.isNaN(budget) && budget >= 0) {
      query.price = { $lte: budget };
    }

    const players = await Player.find(query)
      .sort({ price: -1, name: 1 })
      .select("playerId name team price active")
      .lean();

    return res.json({
      error: false,
      count: players.length,
      players,
    });
  } catch (err) {
    console.error("Errore available players:", err);

    return res.status(500).json({
      error: true,
      message: "Errore interno del server",
    });
  }
});

router.post("/me", authenticateToken, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const user = req.user?.user;
    const { playerIds, captainPlayerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(user?._id)) {
      return res.status(401).json({
        error: true,
        message: "Token non valido",
      });
    }

    const settings = await getFantasySettings();

    if (!settings.isRosterEditEnabled) {
      return res.status(403).json({
        error: true,
        message: "La modifica della rosa è disabilitata",
      });
    }

    if (isRosterLocked(settings)) {
      return res.status(403).json({
        error: true,
        message: "La scelta dei giocatori è chiusa",
      });
    }

    if (!Array.isArray(playerIds)) {
      return res.status(400).json({
        error: true,
        message: "Lista giocatori non valida",
      });
    }

    const cleanPlayerIds = playerIds.map(normalizePlayerId).filter(Boolean);

    const uniquePlayerIds = [...new Set(cleanPlayerIds)];

    if (uniquePlayerIds.length !== cleanPlayerIds.length) {
      return res.status(400).json({
        error: true,
        message: "Non puoi selezionare lo stesso giocatore più volte",
      });
    }

    if (uniquePlayerIds.length !== Number(settings.rosterSize)) {
      return res.status(400).json({
        error: true,
        message: `Devi selezionare esattamente ${settings.rosterSize} giocatori`,
      });
    }

    const cleanCaptainPlayerId = normalizePlayerId(captainPlayerId);

    if (!cleanCaptainPlayerId) {
      return res.status(400).json({
        error: true,
        message: "Devi selezionare un capitano",
      });
    }

    if (!uniquePlayerIds.includes(cleanCaptainPlayerId)) {
      return res.status(400).json({
        error: true,
        message: "Il capitano deve essere uno dei giocatori selezionati",
      });
    }

    const players = await Player.find({
      playerId: { $in: uniquePlayerIds },
      active: true,
    })
      .select("playerId name team price active")
      .lean();

    if (players.length !== uniquePlayerIds.length) {
      return res.status(400).json({
        error: true,
        message: "Uno o più giocatori non sono validi o non sono attivi",
      });
    }

    if (!settings.allowSharedPlayers) {
      const alreadyUsedRoster = await Roster.findOne({
        userId: { $ne: user._id },
        "players.playerId": { $in: uniquePlayerIds },
      })
        .select("_id")
        .lean();

      if (alreadyUsedRoster) {
        return res.status(400).json({
          error: true,
          message: "Uno o più giocatori sono già stati scelti da un'altra squadra",
        });
      }
    }

    const totalCost = players.reduce(
      (sum, player) => sum + Number(player.price || 0),
      0
    );

    if (totalCost > Number(settings.budgetCap)) {
      return res.status(400).json({
        error: true,
        message: `Budget superato. Totale ${totalCost}, massimo ${settings.budgetCap}`,
      });
    }

    const rosterPlayers = uniquePlayerIds.map((playerId) => {
      const player = players.find((item) => item.playerId === playerId);

      return {
        playerId: player.playerId,
        name: player.name,
        team: player.team,
        price: player.price,
      };
    });

    let savedRoster;

    await session.withTransaction(async () => {
      savedRoster = await Roster.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            userId: user._id,
            userEmail: user.email,
            assignedTeamName: user.assignedTeamName || null,
            players: rosterPlayers,
            captainPlayerId: cleanCaptainPlayerId,
            totalCost,
            budgetCap: settings.budgetCap,
            rosterSize: settings.rosterSize,
            status:
              rosterPlayers.length === Number(settings.rosterSize)
                ? "complete"
                : "draft",
            submittedAt: new Date(),
            lastUpdatedAt: new Date(),
          },
        },
        {
          new: true,
          upsert: true,
          session,
        }
      );
    });

    return res.json({
      error: false,
      message: "Fantasquadra salvata con successo",
      roster: savedRoster,
    });
  } catch (err) {
    console.error("Errore save roster:", err);

    return res.status(500).json({
      error: true,
      message: "Errore interno del server",
    });
  } finally {
    session.endSession();
  }
});

module.exports = router;