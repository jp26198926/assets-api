const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  typeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ItemType",
    required: true,
  },
  itemName: { type: String, required: true },
  brand: { type: String, required: true },
  serialNo: { type: String, required: true, unique: true },
  otherDetails: { type: String },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedAt: { type: Date },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deletedReason: { type: String },
  status: {
    type: String,
    enum: ["Active", "Deleted", "Defective", "Assigned"],
    default: "Active",
  },
});

module.exports = mongoose.model("Item", itemSchema);
