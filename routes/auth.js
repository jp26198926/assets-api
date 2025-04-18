const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Trail = require("../models/Trail");
const { auth } = require("../middleware/auth");
const trailLogger = require("../middleware/trailLogger");

const router = express.Router();

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, status: "Active" });

    if (!user) {
      return res.status(401).send({ error: "Invalid login credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).send({ error: "Invalid login credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "24h" }
    );

    // Log the login action
    const trail = new Trail({
      userId: user._id,
      action: "login",
      entity: "user",
      entityId: user._id,
      details: "User logged in",
      ip: req.ip,
    });
    await trail.save();

    res.send({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Get current user profile
router.get("/profile", auth, (req, res) => {
  res.send({
    user: {
      id: req.user._id,
      email: req.user.email,
      firstname: req.user.firstname,
      lastname: req.user.lastname,
      role: req.user.role,
    },
  });
});

module.exports = router;
