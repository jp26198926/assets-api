const mongoose = require("mongoose");

const itemTypeSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
});

module.exports = mongoose.model("ItemType", itemTypeSchema);
