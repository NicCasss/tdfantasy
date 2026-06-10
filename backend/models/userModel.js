const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    fantasyTeamName: {
      type: String,
      default: null,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    fantasyTeamSlug: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      index: true,
    },

    nationalTeam: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
      maxlength: 80,
    },

    // lo teniamo per non rompere il codice esistente
    assignedTeamName: {
      type: String,
      default: null,
      trim: true,
      maxlength: 80,
    },

    teamAccessCodeHash: {
      type: String,
      default: null,
      select: false,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      maxlength: 120,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admCorradoadm"],
      default: "user",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    resetPasswordTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);