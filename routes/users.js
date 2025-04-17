
const express = require('express');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const trailLogger = require('../middleware/trailLogger');

const router = express.Router();

// User registration (admin only for creating staff)
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstname, lastname, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ error: 'Email already in use' });
    }
    
    const user = new User({
      email,
      password,
      firstname,
      lastname,
      role: role || 'user'
    });
    
    await user.save();
    
    res.status(201).send({ 
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Get all users (admin only)
router.get('/', auth, adminAuth, trailLogger('user'), async (req, res) => {
  try {
    const users = await User.find({ status: 'active' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.send(users);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Update user
router.put('/:id', auth, adminAuth, trailLogger('user'), async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['email', 'password', 'firstname', 'lastname', 'role'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    
    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates' });
    }
    
    const user = await User.findOne({ _id: req.params.id, status: 'active' });
    
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
    
    updates.forEach(update => user[update] = req.body[update]);
    user.updatedAt = new Date();
    user.updatedBy = req.user._id;
    
    await user.save();
    
    res.send({
      user: {
        id: user._id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Delete user (soft delete)
router.delete('/:id', auth, adminAuth, trailLogger('user'), async (req, res) => {
  try {
    const { reason } = req.body;
    
    const user = await User.findOne({ _id: req.params.id, status: 'active' });
    
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
    
    user.status = 'deleted';
    user.deletedAt = new Date();
    user.deletedBy = req.user._id;
    user.deletedReason = reason;
    
    await user.save();
    
    res.send({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
