
const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");
const auth = require("../middleware/auth");

// Get settings
router.get("/", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings({
        appName: "Asset Nexus",
        companyName: "",
        logoUrl: "",
      });
      await settings.save();
    }
    
    res.send(settings);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Update settings (protected route)
router.put("/", auth, async (req, res) => {
  try {
    const { appName, companyName, logoUrl } = req.body;
    
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings({
        appName,
        companyName,
        logoUrl,
      });
    } else {
      settings.appName = appName;
      settings.companyName = companyName;
      settings.logoUrl = logoUrl;
    }
    
    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;
    
    await settings.save();
    res.send(settings);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
