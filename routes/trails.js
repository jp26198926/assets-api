
const express = require('express');
const Trail = require('../models/Trail');
const { auth, adminAuth } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// Get all trails (admin only)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const { entity, userId, action, startDate, endDate, searchQuery, limit = 100 } = req.query;
    
    const query = {};
    
    if (entity) {
      query.entity = entity;
    }
    
    if (userId) {
      query.userId = userId;
    }
    
    if (action) {
      query.action = action;
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }
    
    if (searchQuery) {
      query.$or = [
        { action: { $regex: searchQuery, $options: 'i' } },
        { entity: { $regex: searchQuery, $options: 'i' } },
        { details: { $regex: searchQuery, $options: 'i' } }
      ];
    }
    
    const trails = await Trail.find(query)
      .populate('userId', 'firstname lastname email')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.send(trails);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
