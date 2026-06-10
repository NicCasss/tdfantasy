const FantasySettings = require("../models/fantasySettingsModel");

async function getFantasySettings() {
  let settings = await FantasySettings.findOne({ key: "default" });

  if (!settings) {
    const defaultLockAt = new Date();
    defaultLockAt.setDate(defaultLockAt.getDate() + 7);

    settings = await FantasySettings.create({
      key: "default",
      rosterSize: 4,
      budgetCap: 100,
      rosterLockAt: defaultLockAt,
      allowSharedPlayers: true,
      isRosterEditEnabled: true,
    });
  }

  return settings;
}

function isRosterLocked(settings) {
  if (!settings.isRosterEditEnabled) return true;

  const now = new Date();
  return now >= new Date(settings.rosterLockAt);
}

module.exports = {
  getFantasySettings,
  isRosterLocked,
};