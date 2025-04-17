// This file contains the server implementation code for reference purposes.
// To run the actual server, this would need to be moved to a separate Node.js project.

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/asset_nexus", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Models
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  role: { type: String, enum: ["Admin", "User"], default: "User" },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedAt: { type: Date },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deletedReason: { type: String },
  status: { type: String, enum: ["Active", "Deleted"], default: "Active" },
});

const itemTypeSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
});

const itemSchema = new mongoose.Schema({
  typeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ItemType",
    required: true,
  },
  itemName: { type: String, required: true },
  brand: { type: String, required: true },
  serialNo: { type: String, required: true, unique: true },
  otherDetails: { type: String },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedAt: { type: Date },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deletedReason: { type: String },
  status: {
    type: String,
    enum: ["Active", "Deleted", "Defective", "Assigned"],
    default: "Active",
  },
});

const roomSchema = new mongoose.Schema({
  room: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedAt: { type: Date },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deletedReason: { type: String },
  status: { type: String, enum: ["Active", "Deleted"], default: "Active" },
});

const assignSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedAt: { type: Date },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deletedReason: { type: String },
  status: {
    type: String,
    enum: ["Active", "Deleted", "Transferred", "Surrendered"],
    default: "Active",
  },
});

const repairSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  problem: { type: String, required: true },
  diagnosis: { type: String },
  reportBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedAt: { type: Date },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deletedReason: { type: String },
  status: {
    type: String,
    enum: ["Ongoing", "Completed", "Deleted"],
    default: "Ongoing",
  },
});

// Model compilation
const User = mongoose.model("User", userSchema);
const ItemType = mongoose.model("ItemType", itemTypeSchema);
const Item = mongoose.model("Item", itemSchema);
const Room = mongoose.model("Room", roomSchema);
const Assign = mongoose.model("Assign", assignSchema);
const Repair = mongoose.model("Repair", repairSchema);

// Middleware for JWT authentication
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );
    const user = await User.findOne({
      _id: decoded.id,
      status: "Active",
    });

    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ error: "Please authenticate." });
  }
};

// Middleware for admin authorization
const adminAuth = (req, res, next) => {
  if (req.user.role !== "Admin") {
    return res
      .status(403)
      .send({ error: "Access denied. Admin rights required." });
  }
  next();
};

// Auth Routes
app.post("/api/auth/login", async (req, res) => {
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

app.get("/api/auth/profile", auth, (req, res) => {
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

// User Routes
app.post("/api/users/register", async (req, res) => {
  try {
    const { email, password, firstname, lastname, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ error: "Email already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
      firstname,
      lastname,
      role: role || "User",
    });

    await user.save();

    res.status(201).send({
      message: "User registered successfully",
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

app.get("/api/users", auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find({ status: "Active" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.send(users);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Item Type Routes
app.post("/api/itemTypes", auth, async (req, res) => {
  try {
    const { type } = req.body;

    const itemType = new ItemType({ type });
    await itemType.save();

    res.status(201).send(itemType);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/api/itemTypes", auth, async (req, res) => {
  try {
    const itemTypes = await ItemType.find().sort({ type: 1 });
    res.send(itemTypes);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Item Routes
app.post("/api/items", auth, async (req, res) => {
  try {
    const { typeId, itemName, brand, serialNo, otherDetails } = req.body;

    const item = new Item({
      typeId,
      itemName,
      brand,
      serialNo,
      otherDetails,
      createdBy: req.user._id,
    });

    await item.save();

    res.status(201).send(item);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/api/items", auth, async (req, res) => {
  try {
    const items = await Item.find({ status: { $ne: "Deleted" } })
      .populate("typeId")
      .sort({ createdAt: -1 });

    res.send(items);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/api/items/:id", auth, async (req, res) => {
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

app.put("/api/items/:id", auth, async (req, res) => {
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

app.delete("/api/items/:id", auth, async (req, res) => {
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

// Room Routes
app.post("/api/rooms", auth, async (req, res) => {
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

app.get("/api/rooms", auth, async (req, res) => {
  try {
    const rooms = await Room.find({ status: "Active" }).sort({ room: 1 });

    res.send(rooms);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Assignment Routes
app.post("/api/assignments", auth, async (req, res) => {
  try {
    const { date, itemId, roomId } = req.body;

    // Check if the item exists and is available
    const item = await Item.findOne({
      _id: itemId,
      status: "active",
    });

    if (!item) {
      return res.status(404).send({ error: "Item not found or not available" });
    }

    // Check if the room exists
    const room = await Room.findOne({
      _id: roomId,
      status: "active",
    });

    if (!room) {
      return res.status(404).send({ error: "Room not found" });
    }

    // Create assignment
    const assignment = new Assign({
      date,
      itemId,
      roomId,
      assignedBy: req.user._id,
      createdBy: req.user._id,
    });

    // Update item status
    item.status = "assigned";
    item.updatedAt = new Date();
    item.updatedBy = req.user._id;

    await Promise.all([assignment.save(), item.save()]);

    res.status(201).send(assignment);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/api/assignments", auth, async (req, res) => {
  try {
    const assignments = await Assign.find({ status: { $ne: "deleted" } })
      .populate("itemId")
      .populate("roomId")
      .populate("assignedBy", "firstname lastname")
      .sort({ date: -1 });

    res.send(assignments);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Repair Routes
app.post("/api/repairs", auth, async (req, res) => {
  try {
    const { date, itemId, problem, reportBy } = req.body;

    // Check if the item exists
    const item = await Item.findOne({
      _id: itemId,
      status: { $ne: "deleted" },
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
    item.status = "defective";
    item.updatedAt = new Date();
    item.updatedBy = req.user._id;

    await Promise.all([repair.save(), item.save()]);

    res.status(201).send(repair);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/api/repairs", auth, async (req, res) => {
  try {
    const repairs = await Repair.find({ status: { $ne: "deleted" } })
      .populate("itemId")
      .populate("reportBy", "firstname lastname")
      .populate("checkedBy", "firstname lastname")
      .sort({ date: -1 });

    res.send(repairs);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.put("/api/repairs/:id/complete", auth, async (req, res) => {
  try {
    const { diagnosis, checkedBy } = req.body;

    const repair = await Repair.findOne({
      _id: req.params.id,
      status: "ongoing",
    });

    if (!repair) {
      return res.status(404).send({ error: "Repair record not found" });
    }

    // Update repair record
    repair.status = "completed";
    repair.diagnosis = diagnosis;
    repair.checkedBy = checkedBy || req.user._id;
    repair.updatedAt = new Date();
    repair.updatedBy = req.user._id;

    // Update item status back to active
    const item = await Item.findById(repair.itemId);
    if (item) {
      item.status = "active";
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: "Something went wrong!" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
