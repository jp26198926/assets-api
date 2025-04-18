const mongoose = require("mongoose");

const repairSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  problem: { type: String, required: true },
  diagnosis: { type: String },
  reportBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedAt: { type: Date },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deletedReason: { type: String },
  status: {
    type: String,
    enum: ["Ongoing", "Completed", "Deleted"],
    default: "Ongoing",
  },
});

module.exports = mongoose.model("Repair", repairSchema);
