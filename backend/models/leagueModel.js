const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const leagueMemberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["owner", "admin", "member"], default: "member" },
    teamName: { type: String, trim: true, required: true },
  },
  { _id: false }
);

const leagueSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    inviteCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    mode: { type: String, enum: ["classic", "public_daily"], default: "classic" },
    isSystem: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
    settings: {
      publicDaily: {
        budgetCap: { type: Number, default: 230 },
        maxForeigners: { type: Number, default: 2 },
      },
    },
    participantsCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [leagueMemberSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("League", leagueSchema);
