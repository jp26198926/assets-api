const express = require("express");
const Assign = require("../models/Assign");
const Item = require("../models/Item");
const Room = require("../models/Room");
const { auth } = require("../middleware/auth");
const trailLogger = require("../middleware/trailLogger");

const router = express.Router();

// Create a new assignment
router.post("/", auth, trailLogger("assign"), async (req, res) => {
  try {
    console.log(req.body);
    const { date, itemId, roomId, remarks } = req.body;

    // Check if the item exists and is available
    const item = await Item.findOne({
      _id: itemId,
      status: "Active",
    });

    if (!item) {
      return res.status(404).send({ error: "Item not found or not available" });
    }

    // Check if the room exists
    const room = await Room.findOne({
      _id: roomId,
      status: "Active",
    });

    if (!room) {
      return res.status(404).send({ error: "Room not found" });
    }

    // Create assignment
    const assignment = new Assign({
      date,
      itemId,
      roomId,
      remarks,
      assignedBy: req.user._id,
      createdBy: req.user._id,
    });

    // Update item status
    item.status = "Assigned";
    item.updatedAt = new Date();
    item.updatedBy = req.user._id;

    await Promise.all([assignment.save(), item.save()]);

    res.status(201).send(assignment);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Get all assignments
router.get("/", auth, async (req, res) => {
  try {
    // const assignments = await Assign.find({ status: { $ne: "Deleted" } })
    const assignments = await Assign.find()
      // .populate("itemId")
      .populate({
        path: "itemId",
        populate: {
          path: "typeId", // this is inside itemSchema
          model: "ItemType",
        },
      })
      .populate("roomId")
      .populate("assignedBy", "firstname lastname")
      // .sort({ date: -1 });
      .sort({ createdAt: -1 });

    res.send(assignments);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Update assignment status (transfer/surrender)
router.put("/:id/status", auth, trailLogger("assign"), async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (!["Transferred", "Surrendered", "Deleted"].includes(status)) {
      return res.status(400).send({ error: "Invalid status" });
    }

    const assignment = await Assign.findOne({
      _id: req.params.id,
      status: "Active",
    });

    if (!assignment) {
      return res.status(404).send({ error: "Assignment not found" });
    }

    // Update assignment status
    assignment.status = status;
    assignment.updatedAt = new Date();
    assignment.updatedBy = req.user._id;

    if (status === "Deleted") {
      assignment.deletedAt = new Date();
      assignment.deletedBy = req.user._id;
      assignment.deletedReason = reason;
    }

    // If surrendered, update item status back to active
    // if (status === "Surrendered") {
    const item = await Item.findById(assignment.itemId);
    if (item) {
      item.status = "Active";
      item.updatedAt = new Date();
      item.updatedBy = req.user._id;
      await item.save();
    }
    // }

    await assignment.save();

    res.send(assignment);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
