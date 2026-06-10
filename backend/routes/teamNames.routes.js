const express = require("express");
const rateLimit = require("express-rate-limit");

const User = require("../models/userModel");
const { NATIONAL_TEAMS } = require("../config/nationalTeams");

const router = express.Router();

const teamNamesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: "Troppe richieste. Riprova più tardi.",
  },
});

function normalizeName(value) {
  return String(value || "").trim().toUpperCase();
}

router.get("/available", teamNamesLimiter, async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");

    const users = await User.find({
      fantasyTeamName: { $exists: true, $ne: null },
    })
      .select("fantasyTeamName nationalTeam assignedTeamName")
      .lean();

    const usedNames = new Set(
      users
        .map(
          (user) =>
            user.fantasyTeamName || user.nationalTeam || user.assignedTeamName
        )
        .filter(Boolean)
        .map(normalizeName)
    );

    const teamNames = NATIONAL_TEAMS.filter(
      (name) => !usedNames.has(normalizeName(name))
    );

    return res.json({
      error: false,
      teamNames,
    });
  } catch (err) {
    console.error("Errore recupero nomi squadra disponibili:", err);

    return res.status(500).json({
      error: true,
      message: "Errore durante il recupero dei nomi squadra disponibili",
    });
  }
});

module.exports = router;