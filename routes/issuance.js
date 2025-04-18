
const express = require("express");
const Issuance = require("../models/Issuance");
const Item = require("../models/Item");
const Area = require("../models/Area");
const { auth } = require("../middleware/auth");
const trailLogger = require("../middleware/trailLogger");

const router = express.Router();

// Create a new issuance
router.post("/", auth, trailLogger("issuance"), async (req, res) => {
  try {
    const { date, itemId, roomId } = req.body;

    const item = await Item.findOne({
      _id: itemId,
      status: "Active",
    });

    if (!item) {
      return res.status(404).send({ error: "Item not found or not available" });
    }

    const area = await Area.findOne({
      _id: roomId,
      status: "Active",
    });

    if (!area) {
      return res.status(404).send({ error: "Area not found" });
    }

    const issuance = new Issuance({
      date,
      itemId,
      roomId,
      assignedBy: req.user._id,
      createdBy: req.user._id,
    });

    item.status = "Assigned";
    item.updatedAt = new Date();
    item.updatedBy = req.user._id;

    await Promise.all([issuance.save(), item.save()]);

    res.status(201).send(issuance);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Get all issuances
router.get("/", auth, async (req, res) => {
  try {
    const issuances = await Issuance.find({ status: { $ne: "Deleted" } })
      .populate({
        path: "itemId",
        populate: {
          path: "typeId",
          model: "ItemType",
        },
      })
      .populate("roomId")
      .populate("assignedBy", "firstname lastname")
      .sort({ date: -1 });

    res.send(issuances);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Update issuance status (transfer/surrender)
router.put("/:id/status", auth, trailLogger("issuance"), async (req, res) => {
  try {
    const { status, newRoomId, remarks } = req.body;

    if (!["Transferred", "Surrendered"].includes(status)) {
      return res.status(400).send({ error: "Invalid status" });
    }

    const issuance = await Issuance.findOne({
      _id: req.params.id,
      status: "Active",
    });

    if (!issuance) {
      return res.status(404).send({ error: "Issuance not found" });
    }

    if (status === "Transferred") {
      if (!newRoomId) {
        return res.status(400).send({ error: "New room ID is required for transfer" });
      }

      const newArea = await Area.findOne({
        _id: newRoomId,
        status: "Active",
      });

      if (!newArea) {
        return res.status(404).send({ error: "New area not found" });
      }

      // Create new issuance record for the transfer
      const newIssuance = new Issuance({
        date: new Date(),
        itemId: issuance.itemId,
        roomId: newRoomId,
        assignedBy: req.user._id,
        createdBy: req.user._id,
        remarks
      });

      // Update old issuance
      issuance.status = status;
      issuance.updatedAt = new Date();
      issuance.updatedBy = req.user._id;
      issuance.remarks = remarks;

      await Promise.all([newIssuance.save(), issuance.save()]);
      res.send(newIssuance);
    } else {
      // Surrender case
      issuance.status = status;
      issuance.updatedAt = new Date();
      issuance.updatedBy = req.user._id;
      issuance.remarks = remarks;

      const item = await Item.findById(issuance.itemId);
      if (item) {
        item.status = "Active";
        item.updatedAt = new Date();
        item.updatedBy = req.user._id;
        await item.save();
      }

      await issuance.save();
      res.send(issuance);
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Delete issuance
router.delete("/:id", auth, trailLogger("issuance"), async (req, res) => {
  try {
    const issuance = await Issuance.findById(req.params.id);
    
    if (!issuance) {
      return res.status(404).send({ error: "Issuance not found" });
    }

    issuance.status = "Deleted";
    issuance.deletedAt = new Date();
    issuance.deletedBy = req.user._id;
    
    await issuance.save();

    res.send({ message: "Issuance deleted successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
