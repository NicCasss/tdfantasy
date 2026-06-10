const mongoose = require("mongoose");

const fantasySettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "default",
    },

    rosterSize: {
      type: Number,
      required: true,
      default: 4,
      min: 1,
    },

    budgetCap: {
      type: Number,
      required: true,
      default: 100,
      min: 1,
    },

    rosterLockAt: {
      type: Date,
      required: true,
    },

    allowSharedPlayers: {
      type: Boolean,
      default: true,
    },

    isRosterEditEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FantasySettings", fantasySettingsSchema);