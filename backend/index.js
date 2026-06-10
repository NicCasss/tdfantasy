require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const path = require("path");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const healthRoutes = require("./routes/health.routes");
const adminRoutes = require("./routes/admin.routes");
const playersRoutes = require("./routes/players.routes");
const fantasySettingsRoutes = require("./routes/fantasySettings.routes");
const rostersRoutes = require("./routes/rosters.routes");
const leaderboardRoutes = require("./routes/leaderboard.routes");
const scoresRoutes = require("./routes/scores.routes");
const dayLiveRoutes = require("./routes/dayLive.routes");
const { startDayLiveScheduler } = require("./jobs/dayLiveScheduler");
const teamNamesRoutes = require("./routes/teamNames.routes");

const app = express();
app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: true, message: "Troppe richieste. Riprova più tardi." },
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads"), { dotfiles: "deny", index: false, maxAge: "7d" }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/players", playersRoutes);
app.use("/fantasy-settings", fantasySettingsRoutes);
app.use("/rosters", rostersRoutes);
app.use("/leaderboard", leaderboardRoutes);
app.use("/scores", scoresRoutes);
app.use("/admin/live", dayLiveRoutes);
app.use("/teams", teamNamesRoutes);


app.use((req, res) => {
  res.status(404).json({ error: true, message: "Route non trovata" });
});

app.use((err, req, res, next) => {
  console.error("Errore:", err.message);
  res.status(err.status || 500).json({
    error: true,
    message: process.env.NODE_ENV === "production" ? "Errore interno del server" : err.message || "Errore interno del server",
  });
});

const PORT = process.env.PORT || 8000;

connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server attivo su http://0.0.0.0:${PORT}`);
  });
});

module.exports = app;
