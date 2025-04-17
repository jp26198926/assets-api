const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const itemTypeRoutes = require('./routes/itemTypes');
const itemRoutes = require('./routes/items');
const roomRoutes = require('./routes/rooms');
const issuanceRoutes = require('./routes/issuance');
const repairRoutes = require('./routes/repairs');
const trailRoutes = require('./routes/trails');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/asset_nexus', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/itemTypes', itemTypeRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/issuance', issuanceRoutes); // Updated route
app.use('/api/repairs', repairRoutes);
app.use('/api/trails', trailRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
