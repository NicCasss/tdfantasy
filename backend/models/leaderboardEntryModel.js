const mongoose = require("mongoose");

const leaderboardDaySchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true,
    },

    score: {
      type: Number,
      required: true,
      default: 0,
    },

    position: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);

const leaderboardEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    fantasyTeamName: {
      type: String,
      required: true,
      trim: true,
    },

    nationalTeam: {
      type: String,
      required: true,
      trim: true,
    },

    totalScore: {
      type: Number,
      required: true,
      default: 0,
    },

    position: {
      type: Number,
      default: null,
    },

    days: {
      type: [leaderboardDaySchema],
      default: [],
    },

    lastCalculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeaderboardEntry", leaderboardEntrySchema);