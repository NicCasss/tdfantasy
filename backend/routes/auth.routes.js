const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const validator = require("validator");
const xss = require("xss");
const mongoose = require("mongoose");

const User = require("../models/userModel");
const League = require("../models/leagueModel");
const { authenticateToken } = require("../middlewares/authenticateToken");
const { sendResetPasswordEmail } = require("../services/emailService");
const { setAuthCookie, clearAuthCookie } = require("../utils/authCookies");

const {
  normalizeNationalTeam,
  isValidNationalTeam,
} = require("../config/nationalTeams");

const router = express.Router();

const PUBLIC_LEAGUE_NAME = "provapubblica";
const PUBLIC_LEAGUE_DISPLAY_NAME = "Provapubblica";
const PUBLIC_INVITE_CODE = "PUBLIC";
const PUBLIC_PARTICIPANTS_CAP = Number.MAX_SAFE_INTEGER;
const PUBLIC_DAILY_BUDGET_CAP = 230;
const PUBLIC_DAILY_MAX_FOREIGNERS = 2;
const SYSTEM_USER_ID = new mongoose.Types.ObjectId("000000000000000000000000");

const LEGAL_VERSION = "2026-06-10";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: "Troppe richieste. Riprova tra qualche minuto.",
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: "Troppi tentativi di login. Riprova più tardi.",
  },
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: "Troppe richieste di reset. Riprova più tardi.",
  },
});

function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

function sanitizeText(value) {
  return xss(String(value || "").trim());
}

function createTeamSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isStrongPassword(password) {
  const value = String(password || "");

  return validator.isStrongPassword(value, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  });
}

function createAccessToken(user) {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new Error("ACCESS_TOKEN_SECRET mancante");
  }

  return jwt.sign(
    {
      user: {
        _id: user._id,
        fullName: user.fullName,
        fantasyTeamName: user.fantasyTeamName,
        fantasyTeamSlug: user.fantasyTeamSlug,
        nationalTeam: user.nationalTeam,
        assignedTeamName: user.assignedTeamName,
        email: user.email,
        role: user.role || "user",
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "1h" }
  );
}

function publicUser(user) {
  return {
    _id: user._id,
    fullName: user.fullName,
    fantasyTeamName: user.fantasyTeamName,
    fantasyTeamSlug: user.fantasyTeamSlug,
    nationalTeam: user.nationalTeam,
    assignedTeamName: user.assignedTeamName,
    email: user.email,
    role: user.role || "user",
    legalAcceptedAt: user.legalAcceptedAt || null,
    legalVersion: user.legalVersion || null,
    createdAt: user.createdAt,
  };
}

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function normalizeTeamName(raw, userId) {
  const base = String(raw || "").trim().toLowerCase();

  if (base) return base;

  return `team-${String(userId || "").slice(-4)}`.toLowerCase();
}

function uniqueTeamName(desired, existingLowerSet, userId) {
  let name = normalizeTeamName(desired, userId);

  if (!existingLowerSet.has(name)) return name;

  const tail = String(userId || "").slice(-4);
  let i = 1;

  while (existingLowerSet.has(`${name}-${tail}-${i}`)) {
    i++;
  }

  return `${name}-${tail}-${i}`.toLowerCase();
}

async function ensurePublicLeagueExists() {
  const existing = await League.findOne({ name: PUBLIC_LEAGUE_NAME });

  if (existing) return existing;

  return League.create({
    name: PUBLIC_LEAGUE_NAME,
    displayName: PUBLIC_LEAGUE_DISPLAY_NAME,
    inviteCode: PUBLIC_INVITE_CODE,
    mode: "public_daily",
    isSystem: true,
    isPublic: true,
    settings: {
      publicDaily: {
        budgetCap: PUBLIC_DAILY_BUDGET_CAP,
        maxForeigners: PUBLIC_DAILY_MAX_FOREIGNERS,
      },
    },
    participantsCount: PUBLIC_PARTICIPANTS_CAP,
    createdBy: SYSTEM_USER_ID,
    members: [],
  });
}

async function ensureUserInPublicLeague(user) {
  if (!user?._id) return;

  const league = await ensurePublicLeagueExists();

  const already = (league.members || []).some(
    (m) => String(m.userId) === String(user._id)
  );

  if (already) return;

  const existingNames = new Set(
    (league.members || [])
      .map((m) => String(m.teamName || "").trim().toLowerCase())
      .filter(Boolean)
  );

  const desired =
    user.fantasyTeamName ||
    user.assignedTeamName ||
    user.fullName ||
    String(user.email || "").split("@")[0];

  const safeTeamName = uniqueTeamName(desired, existingNames, user._id);

  league.members.push({
    userId: user._id,
    role: "member",
    teamName: safeTeamName,
  });

  await league.save();
}

router.post("/create-account", authLimiter, async (req, res) => {
  try {
    const fullName = sanitizeText(req.body.fullName);
    const nationalTeam = normalizeNationalTeam(req.body.nationalTeam);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    const acceptedLegal = req.body.acceptedLegal === true;
    const clientLegalVersion = String(req.body.legalVersion || "").trim();

    const fantasyTeamName = nationalTeam;
    const fantasyTeamSlug = createTeamSlug(nationalTeam);

    if (!fullName || !nationalTeam || !email || !password) {
      return res.status(400).json({
        error: true,
        message: "Tutti i campi sono obbligatori",
      });
    }

    if (!acceptedLegal) {
      return res.status(400).json({
        error: true,
        message:
          "Devi accettare il Regolamento e prendere visione della Privacy Policy e della Cookie Policy",
      });
    }

    if (clientLegalVersion && clientLegalVersion !== LEGAL_VERSION) {
      return res.status(400).json({
        error: true,
        message:
          "Versione dei documenti legali non valida. Ricarica la pagina e riprova.",
      });
    }

    if (fullName.length < 2 || fullName.length > 80) {
      return res.status(400).json({
        error: true,
        message: "Nome non valido",
      });
    }

    if (!isValidNationalTeam(nationalTeam)) {
      return res.status(400).json({
        error: true,
        message: "Nome squadra non valido",
      });
    }

    if (!fantasyTeamSlug || fantasyTeamSlug.length < 2) {
      return res.status(400).json({
        error: true,
        message: "Nome squadra non valido",
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        error: true,
        message: "Email non valida",
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error: true,
        message:
          "Password troppo debole. Usa almeno 8 caratteri, una maiuscola, una minuscola, un numero e un simbolo.",
      });
    }

    const existingEmail = await User.findOne({ email }).select("+password");

    if (existingEmail) {
      return res.status(409).json({
        error: true,
        message: "Email già registrata",
      });
    }

    const existingTeam = await User.findOne({ fantasyTeamSlug });

    if (existingTeam) {
      return res.status(409).json({
        error: true,
        message: "Questo nome squadra è già stato scelto da un altro utente",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const legalAcceptedAt = new Date();

    const user = await User.create({
      fullName,
      fantasyTeamName,
      fantasyTeamSlug,
      nationalTeam,
      assignedTeamName: nationalTeam,
      email,
      password: hashedPassword,
      legalAcceptedAt,
      legalVersion: LEGAL_VERSION,
      privacyAcceptedAt: legalAcceptedAt,
      termsAcceptedAt: legalAcceptedAt,
    });

    try {
      await ensureUserInPublicLeague(user);
    } catch (e) {
      console.error("Auto-join signup fallito:", e.message);
    }

    const accessToken = createAccessToken(user);
    setAuthCookie(res, accessToken);

    return res.status(201).json({
      error: false,
      user: publicUser(user),
      message: "Account creato con successo",
    });
  } catch (err) {
    console.error("Errore create-account:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        error: true,
        message: "Email o nome squadra già utilizzato",
      });
    }

    return res.status(500).json({
      error: true,
      message: "Errore interno del server",
    });
  }
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: "Email e password obbligatorie",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        error: true,
        message: "Credenziali non valide",
      });
    }

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      return res.status(401).json({
        error: true,
        message: "Credenziali non valide",
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    try {
      await ensureUserInPublicLeague(user);
    } catch (e) {
      console.error("Auto-join login fallito:", e.message);
    }

    const accessToken = createAccessToken(user);
    setAuthCookie(res, accessToken);

    return res.json({
      error: false,
      user: publicUser(user),
      message: "Login effettuato",
    });
  } catch (err) {
    console.error("Errore login:", err);

    return res.status(500).json({
      error: true,
      message: "Errore interno del server",
    });
  }
});

router.post("/logout", authenticateToken, async (req, res) => {
  clearAuthCookie(res);

  return res.json({
    error: false,
    message: "Logout effettuato",
  });
});

router.get("/get-user", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.user?._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        error: true,
        message: "Token non valido",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: true,
        message: "Utente non trovato",
      });
    }

    try {
      await ensureUserInPublicLeague(user);
    } catch (e) {
      console.error("Auto-join get-user fallito:", e.message);
    }

    return res.json({
      error: false,
      user: publicUser(user),
    });
  } catch (err) {
    console.error("Errore get-user:", err);

    return res.status(500).json({
      error: true,
      message: "Errore interno del server",
    });
  }
});

router.post("/forgot-password", resetLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email || !validator.isEmail(email)) {
      return res.json({
        error: false,
        message: "Se l'email esiste, riceverai un link",
      });
    }

    const user = await User.findOne({ email }).select(
      "+resetPasswordTokenHash +resetPasswordExpires"
    );

    if (!user) {
      return res.json({
        error: false,
        message: "Se l'email esiste, riceverai un link",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordTokenHash = hashResetToken(resetToken);
    user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 30);

    await user.save();

    await sendResetPasswordEmail(user.email, resetToken);

    return res.json({
      error: false,
      message: "Se l'email esiste, riceverai un link",
    });
  } catch (err) {
    console.error("Errore forgot-password:", err);

    return res.status(500).json({
      error: true,
      message: "Errore interno del server",
    });
  }
});

router.post("/reset-password", resetLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const token = String(req.body.token || "");
    const newPassword = String(req.body.newPassword || "");

    if (!email || !token || !newPassword) {
      return res.status(400).json({
        error: true,
        message: "Dati mancanti",
      });
    }

    if (!validator.isEmail(email) || !isStrongPassword(newPassword)) {
      return res.status(400).json({
        error: true,
        message: "Dati non validi",
      });
    }

    const user = await User.findOne({
      email,
      resetPasswordTokenHash: hashResetToken(token),
      resetPasswordExpires: { $gt: new Date() },
    }).select("+password +resetPasswordTokenHash +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({
        error: true,
        message: "Token non valido o scaduto",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordChangedAt = new Date();
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;

    await user.save();

    clearAuthCookie(res);

    return res.json({
      error: false,
      message: "Password aggiornata con successo",
    });
  } catch (err) {
    console.error("Errore reset-password:", err);

    return res.status(500).json({
      error: true,
      message: "Errore interno del server",
    });
  }
});

module.exports = router;