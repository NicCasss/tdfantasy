const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/userModel");
const { authenticateToken } = require("../middlewares/authenticateToken");
const { importScoresForDay } = require("../services/dayScoresImport.service");
const { syncPlayersFromGoogleSheet } = require("../services/playersSync.service");
const { getFantasySettings } = require("../services/fantasySettings.service");

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
    console.error("Errore controllo admin:", err);

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
    console.error("Errore validazione giornata:", err);

    return res.status(500).json({
      error: true,
      message: "Errore interno del server",
    });
  }
}

router.post(
  "/sync/players",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const stats = await syncPlayersFromGoogleSheet();

      return res.json({
        error: false,
        message: "Sincronizzazione giocatori completata",
        stats,
      });
    } catch (err) {
      console.error("Errore sync players:", err);

      return res.status(500).json({
        error: true,
        message: err.message || "Errore durante la sincronizzazione giocatori",
      });
    }
  }
);

router.post(
  "/import-scores/day/:day",
  authenticateToken,
  requireAdmin,
  validateDayParam,
  async (req, res) => {
    try {
      const stats = await importScoresForDay(req.day);

      return res.json({
        error: false,
        message: `Giornata ${req.day} importata e classifica ricalcolata`,
        stats,
      });
    } catch (err) {
      console.error("Errore import scores:", err);

      return res.status(500).json({
        error: true,
        message: err.message || "Errore durante l'importazione dei punteggi",
      });
    }
  }
);

module.exports = router;