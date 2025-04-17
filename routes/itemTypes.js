
const express = require('express');
const ItemType = require('../models/ItemType');
const { auth } = require('../middleware/auth');
const trailLogger = require('../middleware/trailLogger');

const router = express.Router();

// Create a new item type
router.post('/', auth, trailLogger('itemType'), async (req, res) => {
  try {
    const { type } = req.body;
    
    const itemType = new ItemType({ type });
    await itemType.save();
    
    res.status(201).send(itemType);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Get all item types
router.get('/', auth, async (req, res) => {
  try {
    const itemTypes = await ItemType.find().sort({ type: 1 });
    res.send(itemTypes);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
