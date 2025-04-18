
const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  appName: { type: String, required: true },
  companyName: { type: String },
  logoUrl: { type: String },
  updatedAt: { type: Date },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Settings", settingsSchema);
