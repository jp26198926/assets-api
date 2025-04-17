
const mongoose = require('mongoose');

const trailSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  entity: { type: String, required: true }, // 'user', 'item', 'room', 'assign', 'repair'
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  details: { type: String },
  ip: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Trail', trailSchema);
