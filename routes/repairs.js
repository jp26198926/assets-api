
const express = require("express");
const Repair = require("../models/Repair");
const Item = require("../models/Item");
const { auth } = require("../middleware/auth");
const trailLogger = require("../middleware/trailLogger");

const router = express.Router();

// Create a new repair record
router.post("/", auth, trailLogger("repair"), async (req, res) => {
  try {
    const { date, itemId, problem, reportBy } = req.body;

    // Check if the item exists
    const item = await Item.findOne({
      _id: itemId,
      status: { $ne: "Deleted" },
    });

    if (!item) {
      return res.status(404).send({ error: "Item not found" });
    }

    // Create repair record
    const repair = new Repair({
      date,
      itemId,
      problem,
      reportBy,
      createdBy: req.user._id,
    });

    // Update item status to defective
    item.status = "Defective";
    item.updatedAt = new Date();
    item.updatedBy = req.user._id;

    await Promise.all([repair.save(), item.save()]);

    res.status(201).send(repair);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Get all repairs
router.get("/", auth, async (req, res) => {
  try {
    const repairs = await Repair.find({ status: { $ne: "Deleted" } })
      .populate({
        path: "itemId",
        populate: { path: "typeId" }
      })
      .populate("reportBy", "firstname lastname")
      .populate("checkedBy", "firstname lastname")
      .populate("createdBy", "firstname lastname")
      .populate("updatedBy", "firstname lastname")
      .populate("deletedBy", "firstname lastname")
      .sort({ date: -1 });

    res.send(repairs);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Complete a repair
router.put("/:id/complete", auth, trailLogger("repair"), async (req, res) => {
  try {
    const { diagnosis, checkedBy } = req.body;

    const repair = await Repair.findOne({
      _id: req.params.id,
      status: "Ongoing",
    });

    if (!repair) {
      return res.status(404).send({ error: "Repair record not found" });
    }

    // Update repair record
    repair.status = "Completed";
    repair.diagnosis = diagnosis;
    repair.checkedBy = checkedBy || req.user._id;
    repair.updatedAt = new Date();
    repair.updatedBy = req.user._id;

    // Update item status back to active
    const item = await Item.findById(repair.itemId);
    if (item) {
      item.status = "Active";
      item.updatedAt = new Date();
      item.updatedBy = req.user._id;
      await item.save();
    }

    await repair.save();

    res.send(repair);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Delete a repair (soft delete)
router.delete("/:id", auth, trailLogger("repair"), async (req, res) => {
  try {
    const { reason } = req.body;

    const repair = await Repair.findOne({
      _id: req.params.id,
      status: { $ne: "Deleted" },
    });

    if (!repair) {
      return res.status(404).send({ error: "Repair not found" });
    }

    repair.status = "Deleted";
    repair.deletedAt = new Date();
    repair.deletedBy = req.user._id;
    repair.deletedReason = reason;

    await repair.save();

    res.send({ message: "Area deleted successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
