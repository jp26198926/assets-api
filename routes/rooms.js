const express = require("express");
const Room = require("../models/Room");
const { auth } = require("../middleware/auth");
const trailLogger = require("../middleware/trailLogger");

const router = express.Router();

// Create a new room
router.post("/", auth, trailLogger("room"), async (req, res) => {
  try {
    const { room } = req.body;

    const newRoom = new Room({
      room,
      createdBy: req.user._id,
    });

    await newRoom.save();

    res.status(201).send(newRoom);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Get all rooms
router.get("/", auth, async (req, res) => {
  try {
    const rooms = await Room.find({ status: "Active" }).sort({ room: 1 });

    res.send(rooms);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Update a room
router.put("/:id", auth, trailLogger("room"), async (req, res) => {
  try {
    const { room } = req.body;

    const existingRoom = await Room.findOne({
      _id: req.params.id,
      status: "Active",
    });

    if (!existingRoom) {
      return res.status(404).send({ error: "Room not found" });
    }

    existingRoom.room = room;
    existingRoom.updatedAt = new Date();
    existingRoom.updatedBy = req.user._id;

    await existingRoom.save();

    res.send(existingRoom);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Delete a room (soft delete)
router.delete("/:id", auth, trailLogger("room"), async (req, res) => {
  try {
    const { reason } = req.body;

    const room = await Room.findOne({
      _id: req.params.id,
      status: "Active",
    });

    if (!room) {
      return res.status(404).send({ error: "Room not found" });
    }

    room.status = "Deleted";
    room.deletedAt = new Date();
    room.deletedBy = req.user._id;
    room.deletedReason = reason;

    await room.save();

    res.send({ message: "Room deleted successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
