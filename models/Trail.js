
const mongoose = require("mongoose");

const trailSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { 
    type: mongoose.Schema.Types.Mixed,  // Changed from ObjectId to Mixed to allow for both ObjectId and string values
    required: true 
  },
  details: { type: String },
  ip: { type: String },
  timestamp: { type: Date, default: Date.now },
  viewedAt: { type: Date },
  viewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

module.exports = mongoose.model("Trail", trailSchema);
