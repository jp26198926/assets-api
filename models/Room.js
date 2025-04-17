const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  room: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedAt: { type: Date },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deletedReason: { type: String },
  status: { type: String, enum: ["Active", "Deleted"], default: "Active" },
});

module.exports = mongoose.model("Room", roomSchema);
