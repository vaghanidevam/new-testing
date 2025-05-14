// index.js

const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const userRoutes = require('./user/userRoutes');
const profileRoutes = require('./profile/profileRoutes');
const courseRoutes = require('./course/courseRoutes');
const database = require('./config/database');
const http = require('http');
const { Server } = require('socket.io');
const setupSocket = require('./courseProgress/courseProgressController'); // Import socket controller


// Load environment variables
dotenv.config();

// Port config
const PORT = process.env.PORT || 4000;

// Connect to database
database.connect();

// Middleware for Stripe webhook
const conditionalBodyParser = (req, res, next) => {
  if (req.originalUrl === '/api/VI/course/stripe-webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
};

// Middleware
app.use(conditionalBodyParser);
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

// Routes
app.use('/api/VI/auth', userRoutes);
app.use('/api/VI/profile', profileRoutes);
app.use('/api/VI/course', courseRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
  });
});

const server = http.createServer(app);

// Create socket.io instance
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Set up socket events in the courseProgressController
setupSocket(io);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
