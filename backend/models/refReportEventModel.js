const mongoose = require("mongoose");

const refReportEventSchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true,
      index: true,
      min: 1,
    },

    teamA: {
      type: String,
      default: "",
      trim: true,
    },

    teamB: {
      type: String,
      default: "",
      trim: true,
    },

    playerId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    playerName: {
      type: String,
      required: true,
      trim: true,
    },

    playerTeam: {
      type: String,
      required: true,
      trim: true,
    },

    event: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      default: 1,
    },

    unitValue: {
      type: Number,
      required: true,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
      default: 0,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    source: {
      type: String,
      default: "google_sheets",
    },

    importedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

refReportEventSchema.index({ day: 1, playerId: 1 });

module.exports = mongoose.model("RefReportEvent", refReportEventSchema);