const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/userModel");
const FantasySettings = require("../models/fantasySettingsModel");
const { authenticateToken } = require("../middlewares/authenticateToken");
const {
  getFantasySettings,
} = require("../services/fantasySettings.service");
const {
  parseItalianDateTime,
  formatItalianDateTime,
} = require("../utils/dateParser");

const router = express.Router();

const ADMIN_ROLE = "admCorradoadm";

function getAuthUser(req) {
  return req.user?.user || req.user || {};
}

async function requireAdmin(req, res, next) {
  try {
    const authUser = getAuthUser(req);
    const userId = authUser?._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        error: true,
        message: "Token non valido",
      });
    }

    const user = await User.findById(userId).select("role").lean();

    if (!user || user.role !== ADMIN_ROLE) {
      return res.status(403).json({
        error: true,
        message: "Accesso riservato agli admin",
      });
    }

    next();
  } catch (err) {
    console.error("Errore controllo admin impostazioni:", err);

    return res.status(500).json({
      error: true,
      message: "Errore interno del server",
    });
  }
}

function publicSettings(settings) {
  return {
    rosterSize: Number(settings.rosterSize || 0),
    budgetCap: Number(settings.budgetCap || 0),
    tournamentDays: Number(settings.tournamentDays || 6),
    rosterLockAt: settings.rosterLockAt,
    rosterLockAtFormatted: formatItalianDateTime(settings.rosterLockAt),
    allowSharedPlayers: Boolean(settings.allowSharedPlayers),
    isRosterEditEnabled: Boolean(settings.isRosterEditEnabled),
  };
}

router.get("/", authenticateToken, async (req, res) => {
  try {
    const settings = await getFantasySettings();

    return res.json({
      error: false,
      settings: publicSettings(settings),
    });
  } catch (err) {
    console.error("Errore get fantasy settings:", err);

    return res.status(500).json({
      error: true,
      message: "Errore interno del server",
    });
  }
});

router.put("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      rosterSize,
      budgetCap,
      rosterLockAt,
      allowSharedPlayers,
      isRosterEditEnabled,
    } = req.body;

    const parsedRosterSize = Number(rosterSize);
    const parsedBudgetCap = Number(budgetCap);

    if (
      !Number.isInteger(parsedRosterSize) ||
      parsedRosterSize < 1 ||
      parsedRosterSize > 20
    ) {
      return res.status(400).json({
        error: true,
        message: "Numero giocatori non valido",
      });
    }

    if (
      !Number.isFinite(parsedBudgetCap) ||
      parsedBudgetCap < 1 ||
      parsedBudgetCap > 100000
    ) {
      return res.status(400).json({
        error: true,
        message: "Budget non valido",
      });
    }

    const parsedDate = parseItalianDateTime(rosterLockAt);

    if (!parsedDate.valid) {
      return res.status(400).json({
        error: true,
        message: parsedDate.message,
      });
    }

    const settings = await FantasySettings.findOneAndUpdate(
      { key: "default" },
      {
        $set: {
          rosterSize: parsedRosterSize,
          budgetCap: parsedBudgetCap,
          rosterLockAt: parsedDate.date,
          allowSharedPlayers: allowSharedPlayers === true,
          isRosterEditEnabled: isRosterEditEnabled === true,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    return res.json({
      error: false,
      message: "Impostazioni aggiornate",
      settings: publicSettings(settings),
    });
  } catch (err) {
    console.error("Errore update fantasy settings:", err);

    return res.status(500).json({
      error: true,
      message: "Errore interno del server",
    });
  }
});

module.exports = router;