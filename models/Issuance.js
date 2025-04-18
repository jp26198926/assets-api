
const mongoose = require("mongoose");

const issuanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Area", required: true },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  remarks: { type: String },
  signature: { type: String },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedAt: { type: Date },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deletedReason: { type: String },
  status: {
    type: String,
    enum: ["Active", "Deleted", "Transferred", "Surrendered"],
    default: "Active",
  },
});

module.exports = mongoose.model("Issuance", issuanceSchema);
