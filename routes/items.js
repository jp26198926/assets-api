const express = require("express");
const Item = require("../models/Item");
const Repair = require("../models/Repair");
const Assign = require("../models/Assign");
const { auth } = require("../middleware/auth");
const trailLogger = require("../middleware/trailLogger");

const router = express.Router();

// Generate unique barcodeId
const generateBarcodeId = async () => {
  const year = new Date().getFullYear().toString().slice(-2);
  let unique = false;
  let barcodeId;
  
  while (!unique) {
    // Generate a random 5-digit number
    const random = Math.floor(10000 + Math.random() * 90000);
    barcodeId = `IT${year}${random}`;
    
    // Check if this barcodeId already exists
    const existing = await Item.findOne({ barcodeId });
    if (!existing) {
      unique = true;
    }
  }
  
  return barcodeId;
};

// Create a new item
router.post("/", auth, trailLogger("item"), async (req, res) => {
  try {
    const { typeId, itemName, brand, serialNo, otherDetails } = req.body;
    
    // Generate unique barcodeId
    const barcodeId = await generateBarcodeId();

    const item = new Item({
      typeId,
      itemName,
      brand,
      serialNo,
      barcodeId,
      otherDetails,
      createdBy: req.user._id,
    });

    await item.save();

    res.status(201).send(item);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Get all items
router.get("/", auth, async (req, res) => {
  try {
    const items = await Item.find({ status: { $ne: "Deleted" } })
      .populate("typeId")
      .sort({ createdAt: -1 });

    res.send(items);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Get a specific item
router.get("/:id", auth, async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      status: { $ne: "Deleted" },
    }).populate("typeId");

    if (!item) {
      return res.status(404).send({ error: "Item not found" });
    }

    res.send(item);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Update an item
router.put("/:id", auth, trailLogger("item"), async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = [
      "typeId",
      "itemName",
      "brand",
      "serialNo",
      "otherDetails",
      "status",
    ];
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).send({ error: "Invalid updates" });
    }

    const item = await Item.findOne({
      _id: req.params.id,
      status: { $ne: "Deleted" },
    });

    if (!item) {
      return res.status(404).send({ error: "Item not found" });
    }

    updates.forEach((update) => (item[update] = req.body[update]));
    item.updatedAt = new Date();
    item.updatedBy = req.user._id;

    await item.save();

    res.send(item);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Delete an item (soft delete)
router.delete("/:id", auth, trailLogger("item"), async (req, res) => {
  try {
    const { reason } = req.body;

    const item = await Item.findOne({
      _id: req.params.id,
      status: { $ne: "Deleted" },
    });

    if (!item) {
      return res.status(404).send({ error: "Item not found" });
    }

    item.status = "Deleted";
    item.deletedAt = new Date();
    item.deletedBy = req.user._id;
    item.deletedReason = reason;

    await item.save();

    res.send({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Get item history (assignments and repairs)
router.get("/:id/history", auth, async (req, res) => {
  try {
    const itemId = req.params.id;

    // Get the item details
    const item = await Item.findOne({
      _id: itemId,
      status: { $ne: "Deleted" },
    }).populate("typeId");

    if (!item) {
      return res.status(404).send({ error: "Item not found" });
    }

    // Get assignment history
    const assignments = await Assign.find({ itemId })
      .populate("roomId")
      .populate("assignedBy", "firstname lastname")
      .sort({ date: -1 });

    // Get repair history
    const repairs = await Repair.find({ itemId })
      .populate("reportBy", "firstname lastname")
      .populate("checkedBy", "firstname lastname")
      .sort({ date: -1 });

    res.send({
      item,
      assignments,
      repairs,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
