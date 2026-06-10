const mongoose = require("mongoose");

const dayStatusSchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true,
      unique: true,
      index: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["not_started", "live", "closed"],
      default: "not_started",
    },

    isLive: {
      type: Boolean,
      default: false,
    },

    isClosed: {
      type: Boolean,
      default: false,
    },

    autoImportEveryMinutes: {
      type: Number,
      default: 2,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    lastImportAt: {
      type: Date,
      default: null,
    },

    nextImportAt: {
      type: Date,
      default: null,
    },

    eventsImported: {
      type: Number,
      default: 0,
    },

    playersScored: {
      type: Number,
      default: 0,
    },

    teamsCalculated: {
      type: Number,
      default: 0,
    },

    dayWinner: {
      type: String,
      default: null,
    },

    dayWinnerScore: {
      type: Number,
      default: null,
    },

    lastImportSource: {
      type: String,
      enum: ["manual", "live_start", "scheduler", "close"],
      default: "manual",
    },

    lastMessage: {
      type: String,
      default: "",
    },

    errors: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DayStatus", dayStatusSchema);