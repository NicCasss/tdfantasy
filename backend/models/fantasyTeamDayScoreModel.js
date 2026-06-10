const mongoose = require("mongoose");

const fantasyPlayerEventSchema = new mongoose.Schema(
  {
    event: String,
    quantity: Number,
    unitValue: Number,
    total: Number,
    note: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const fantasyPlayerScoreSchema = new mongoose.Schema(
  {
    playerId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    team: {
      type: String,
      required: true,
      trim: true,
    },

    baseScore: {
      type: Number,
      required: true,
      default: 0,
    },

    isCaptain: {
      type: Boolean,
      default: false,
    },

    multiplier: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },

    totalScore: {
      type: Number,
      required: true,
      default: 0,
    },

    events: {
      type: [fantasyPlayerEventSchema],
      default: [],
    },
  },
  { _id: false }
);

const fantasyTeamDayScoreSchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true,
      index: true,
      min: 1,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

    captainPlayerId: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },

    players: {
      type: [fantasyPlayerScoreSchema],
      default: [],
    },

    dayTotal: {
      type: Number,
      required: true,
      default: 0,
    },

    position: {
      type: Number,
      default: null,
    },

    calculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

fantasyTeamDayScoreSchema.index({ day: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model(
  "FantasyTeamDayScore",
  fantasyTeamDayScoreSchema
);