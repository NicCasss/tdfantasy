const DayStatus = require("../models/dayStatusModel");
const { runImportForDay, LIVE_INTERVAL_MINUTES } = require("../services/dayLive.service");

const runningDays = new Set();

function shouldImport(status, now) {
  if (!status.lastImportAt) return true;

  const lastImportAt = new Date(status.lastImportAt).getTime();
  const elapsedMs = now.getTime() - lastImportAt;
  const requiredMs = LIVE_INTERVAL_MINUTES * 60 * 1000;

  return elapsedMs >= requiredMs;
}

function startDayLiveScheduler() {
  console.log("[DayLiveScheduler] Scheduler live giornate avviato");

  setInterval(async () => {
    try {
      const now = new Date();

      const liveDays = await DayStatus.find({
        status: "live",
        isLive: true,
        isClosed: false,
      }).lean();

      for (const dayStatus of liveDays) {
        const day = Number(dayStatus.day);

        if (!shouldImport(dayStatus, now)) continue;
        if (runningDays.has(day)) continue;

        runningDays.add(day);

        try {
          console.log(`[DayLiveScheduler] Import automatico giornata ${day}`);
          await runImportForDay(day, "scheduler", "live");
        } catch (err) {
          console.error(
            `[DayLiveScheduler] Errore import giornata ${day}:`,
            err
          );

          await DayStatus.findOneAndUpdate(
            { day },
            {
              $set: {
                errors: [err.message || "Errore import automatico"],
                lastMessage: err.message || "Errore import automatico",
              },
            }
          );
        } finally {
          runningDays.delete(day);
        }
      }
    } catch (err) {
      console.error("[DayLiveScheduler] Errore scheduler:", err);
    }
  }, 60 * 1000);
}

module.exports = { startDayLiveScheduler };