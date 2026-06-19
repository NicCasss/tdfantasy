const DayStatus = require("../models/dayStatusModel");
const { importScoresForDay } = require("./dayScoresImport.service");

const LIVE_INTERVAL_MINUTES = 2;

function getNextImportAt(fromDate = new Date()) {
  return new Date(fromDate.getTime() + LIVE_INTERVAL_MINUTES * 60 * 1000);
}

function normalizeImportResult(result, day) {
  return {
    day,
    eventsImported: Number(result?.eventsImported || 0),
    playersScored: Number(result?.playersScored || 0),
    teamsCalculated: Number(result?.teamsCalculated || 0),
    dayWinner: result?.dayWinner || null,
    dayWinnerScore:
      result?.dayWinnerScore !== undefined &&
      result?.dayWinnerScore !== null
        ? Number(result.dayWinnerScore)
        : null,
    errors: Array.isArray(result?.errors) ? result.errors : [],
    message: result?.message || "",
  };
}

async function getAllDayStatuses() {
  return DayStatus.find({}).sort({ day: 1 }).lean();
}

async function getDayStatus(day) {
  const parsedDay = Number(day);

  let status = await DayStatus.findOne({ day: parsedDay }).lean();

  if (!status) {
    status = await DayStatus.create({
      day: parsedDay,
      status: "not_started",
      isLive: false,
      isClosed: false,
    });

    return status.toObject();
  }

  return status;
}

async function runImportForDay(day, source = "manual", forcedStatus = null) {
  const parsedDay = Number(day);

  if (!parsedDay || parsedDay < 1) {
    throw new Error("Giornata non valida");
  }

  const now = new Date();

  let currentStatus = await DayStatus.findOne({ day: parsedDay });

  if (!currentStatus) {
    currentStatus = await DayStatus.create({
      day: parsedDay,
      status: "not_started",
      isLive: false,
      isClosed: false,
    });
  }

  const result = await importScoresForDay(parsedDay);
  console.log("IMPORT RESULT", result);
  const normalized = normalizeImportResult(result, parsedDay);

  const nextStatus = forcedStatus || currentStatus.status || "not_started";

  const shouldRemainLive = nextStatus === "live";
  const shouldBeClosed = nextStatus === "closed";

  const updatedStatus = await DayStatus.findOneAndUpdate(
    { day: parsedDay },
    {
      $set: {
        status: nextStatus,
        isLive: shouldRemainLive,
        isClosed: shouldBeClosed,
        autoImportEveryMinutes: LIVE_INTERVAL_MINUTES,

        lastImportAt: now,
        nextImportAt: shouldRemainLive ? getNextImportAt(now) : null,

        eventsImported: normalized.eventsImported,
        playersScored: normalized.playersScored,
        teamsCalculated: normalized.teamsCalculated,

        dayWinner: normalized.dayWinner,
        dayWinnerScore: normalized.dayWinnerScore,

        lastImportSource: source,
        lastMessage: normalized.message,
        errors: normalized.errors,

        ...(source === "live_start" ? { startedAt: now, closedAt: null } : {}),
        ...(source === "close" ? { closedAt: now } : {}),
      },
    },
    { new: true, upsert: true }
  ).lean();

  return {
    error: false,
    message: normalized.message || "Import completato",
    status: updatedStatus,
    importResult: result,
  };
}

async function startLiveDay(day) {
  const parsedDay = Number(day);

  if (!parsedDay || parsedDay < 1) {
    throw new Error("Giornata non valida");
  }

  const existingStatus = await DayStatus.findOne({ day: parsedDay }).lean();

  if (existingStatus?.isClosed) {
    throw new Error("La giornata è già chiusa. Non è possibile attivare il live.");
  }

  await DayStatus.findOneAndUpdate(
    { day: parsedDay },
    {
      $set: {
        status: "live",
        isLive: true,
        isClosed: false,
        startedAt: new Date(),
        closedAt: null,
        autoImportEveryMinutes: LIVE_INTERVAL_MINUTES,
      },
    },
    { new: true, upsert: true }
  );

  return runImportForDay(parsedDay, "live_start", "live");
}

async function importNow(day) {
  const parsedDay = Number(day);

  const currentStatus = await DayStatus.findOne({ day: parsedDay }).lean();

  const forcedStatus = currentStatus?.status || "not_started";

  return runImportForDay(parsedDay, "manual", forcedStatus);
}

async function closeDay(day) {
  const parsedDay = Number(day);

  if (!parsedDay || parsedDay < 1) {
    throw new Error("Giornata non valida");
  }

  return runImportForDay(parsedDay, "close", "closed");
}

module.exports = {
  LIVE_INTERVAL_MINUTES,
  getAllDayStatuses,
  getDayStatus,
  startLiveDay,
  importNow,
  closeDay,
  runImportForDay,
};