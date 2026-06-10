const mongoose = require("mongoose");

const scoreEventSchema = new mongoose.Schema(
  {
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
  },
  { _id: false }
);

const playerDayScoreSchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true,
      index: true,
      min: 1,
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

    events: {
      type: [scoreEventSchema],
      default: [],
    },

    totalScore: {
      type: Number,
      required: true,
      default: 0,
    },

    calculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

playerDayScoreSchema.index({ day: 1, playerId: 1 }, { unique: true });

module.exports = mongoose.model("PlayerDayScore", playerDayScoreSchema);