
const express = require('express');
const ItemType = require('../models/ItemType');
const Item = require('../models/Item');
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

// Update an item type
router.put('/:id', auth, trailLogger('itemType'), async (req, res) => {
  try {
    const { type } = req.body;
    
    const itemType = await ItemType.findById(req.params.id);
    if (!itemType) {
      return res.status(404).send({ error: 'Item type not found' });
    }

    itemType.type = type;
    await itemType.save();
    
    res.send(itemType);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Delete an item type
router.delete('/:id', auth, trailLogger('itemType'), async (req, res) => {
  try {
    const itemType = await ItemType.findById(req.params.id);
    if (!itemType) {
      return res.status(404).send({ error: 'Item type not found' });
    }

    // Check if type is being used
    const itemsUsingType = await Item.findOne({ typeId: req.params.id });
    if (itemsUsingType) {
      return res.status(400).send({ 
        error: 'Cannot delete item type that is being used by items' 
      });
    }

    await itemType.deleteOne();
    res.send({ message: 'Item type deleted successfully' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Check if item type is in use - individual check
router.get('/:id/usage', auth, async (req, res) => {
  try {
    const itemsUsingType = await Item.findOne({ typeId: req.params.id });
    res.send({ inUse: !!itemsUsingType });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Check multiple item types usage status in one request
router.post('/usage/bulk', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).send({ error: 'Invalid request. Expected an array of IDs.' });
    }
    
    const results = {};
    
    // Use a more efficient query to get all items using any of these types
    const itemsUsingTypes = await Item.find({ 
      typeId: { $in: ids } 
    }).select('typeId').lean();
    
    // Create a Set of typeIds that are in use
    const usedTypeIds = new Set(itemsUsingTypes.map(item => item.typeId.toString()));
    
    // Map results
    ids.forEach(id => {
      results[id] = usedTypeIds.has(id.toString());
    });
    
    res.send({ results });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
