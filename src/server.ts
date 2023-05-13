import express from 'express';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

const MongoDB_URL = process.env.MONGODB_URL;

const app = express();
const server = createServer(app);
const io = new Server(server);

// Connect to MongoDB
mongoose.connect(MongoDB_URL as string)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Create a MongoDB schema and model for the Crash data
const crashSchema = new mongoose.Schema({
  participants: {
    type: Map,
    of: {
      amount: Number,
      cashed_out: Boolean,
    },
  },
  game_id: String,
  status: String,
  crash_current: Number,
  ended_at: Number,
});

const Crash = mongoose.model('Crash', crashSchema);

// WebSocket (socket.io) connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  // Send the current crash data to the client
  Crash.findOne({ status: 'running' })
    .then((crash) => {
      if (crash) {
        const { crash_current } = crash;
        socket.emit('currentCrash', crash_current);
      }
    })
    .catch((error) => {
      console.error('Error retrieving crash data:', error);
    });

  // Listen for updates from the client
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the server
const port = 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
