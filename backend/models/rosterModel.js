const mongoose = require("mongoose");

const rosterPlayerSchema = new mongoose.Schema(
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

    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const rosterSchema = new mongoose.Schema(
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
      trim: true,
      lowercase: true,
    },

    assignedTeamName: {
      type: String,
      default: null,
      trim: true,
    },

    players: {
      type: [rosterPlayerSchema],
      default: [],
    },

    captainPlayerId: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },

    totalCost: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    budgetCap: {
      type: Number,
      required: true,
    },

    rosterSize: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "complete"],
      default: "draft",
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    lastUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Roster", rosterSchema);