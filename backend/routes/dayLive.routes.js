const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/userModel");
const {
  getAllDayStatuses,
  getDayStatus,
  startLiveDay,
  importNow,
  closeDay,
} = require("../services/dayLive.service");

const { authenticateToken } = require("../middlewares/authenticateToken");
const { getFantasySettings } = require("../services/fantasySettings.service");

const router = express.Router();

const ADMIN_ROLE = "admCorradoadm";

function getAuthUser(req) {
  return req.user?.user || req.user || {};
}

async function requireAdminRole(req, res, next) {
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
        message: "Accesso riservato agli amministratori",
      });
    }

    next();
  } catch (err) {
    console.error("Errore controllo admin live:", err);

    return res.status(500).json({
      error: true,
      message: "Errore interno del server",
    });
  }
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
    console.error("Errore validazione giornata live:", err);

    return res.status(500).json({
      error: true,
      message: "Errore interno del server",
    });
  }
}

router.use(authenticateToken);
router.use(requireAdminRole);

router.get("/status", async (req, res) => {
  try {
    const statuses = await getAllDayStatuses();

    return res.json({
      error: false,
      statuses,
    });
  } catch (err) {
    console.error("Errore recupero stati live:", err);

    return res.status(500).json({
      error: true,
      message: "Errore durante il recupero degli stati live",
    });
  }
});

router.get("/status/:day", validateDayParam, async (req, res) => {
  try {
    const status = await getDayStatus(req.day);

    return res.json({
      error: false,
      status,
    });
  } catch (err) {
    console.error("Errore recupero stato live:", err);

    return res.status(500).json({
      error: true,
      message: "Errore durante il recupero dello stato live",
    });
  }
});

router.post("/day/:day/start", validateDayParam, async (req, res) => {
  try {
    const result = await startLiveDay(req.day);

    return res.json({
      error: false,
      message: `Live giornata ${req.day} attivato`,
      ...result,
    });
  } catch (err) {
    console.error("Errore start live giornata:", err);

    return res.status(400).json({
      error: true,
      message: err.message || "Errore durante l'attivazione del live",
    });
  }
});

router.post("/day/:day/import-now", validateDayParam, async (req, res) => {
  try {
    const result = await importNow(req.day);

    return res.json({
      error: false,
      message: `Giornata ${req.day} aggiornata`,
      ...result,
    });
  } catch (err) {
    console.error("Errore import manuale live giornata:", err);

    return res.status(500).json({
      error: true,
      message: err.message || "Errore durante l'import manuale",
    });
  }
});

router.post("/day/:day/close", validateDayParam, async (req, res) => {
  try {
    const result = await closeDay(req.day);

    return res.json({
      error: false,
      message: `Giornata ${req.day} chiusa`,
      ...result,
    });
  } catch (err) {
    console.error("Errore chiusura giornata:", err);

    return res.status(500).json({
      error: true,
      message: err.message || "Errore durante la chiusura della giornata",
    });
  }
});

module.exports = router;