const express = require("express");
const Area = require("../models/Area");
const { auth } = require("../middleware/auth");
const trailLogger = require("../middleware/trailLogger");

const router = express.Router();

// Create a new area
router.post("/", auth, trailLogger("area"), async (req, res) => {
  try {
    const { area } = req.body;

    const newArea = new Area({
      area,
      createdBy: req.user._id,
    });

    await newArea.save();

    res.status(201).send(newArea);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Get all areas
router.get("/", auth, async (req, res) => {
  try {
    const areas = await Area.find({ status: "Active" }).sort({ area: 1 });

    res.send(areas);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Update an area
router.put("/:id", auth, trailLogger("area"), async (req, res) => {
  try {
    const { area } = req.body;

    const existingArea = await Area.findOne({
      _id: req.params.id,
      status: "Active",
    });

    if (!existingArea) {
      return res.status(404).send({ error: "Area not found" });
    }

    existingArea.area = area;
    existingArea.updatedAt = new Date();
    existingArea.updatedBy = req.user._id;

    await existingArea.save();

    res.send(existingArea);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Delete an area (soft delete)
router.delete("/:id", auth, trailLogger("area"), async (req, res) => {
  try {
    const { reason } = req.body;

    const area = await Area.findOne({
      _id: req.params.id,
      status: "Active",
    });

    if (!area) {
      return res.status(404).send({ error: "Area not found" });
    }

    area.status = "Deleted";
    area.deletedAt = new Date();
    area.deletedBy = req.user._id;
    area.deletedReason = reason;

    await area.save();

    res.send({ message: "Area deleted successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
