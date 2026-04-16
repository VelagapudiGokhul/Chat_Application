// socket.js

const { Server } = require("socket.io");
const http = require("http");
const express = require("express");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  pingTimeout: 180000,
  cors: {
    origin: "http://localhost:3000", 
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true, 
  },
});

function getReceiverSocketId(userId) {
  return onlineusers[userId];
}

let onlineusers = {}; 

io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) onlineusers[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(onlineusers));

  socket.on("joinGroup", (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`Socket ${socket.id} joined group_${groupId}`);
  });

  socket.on("leaveGroup", (groupId) => {
    socket.leave(`group_${groupId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
    delete onlineusers[userId];
    io.emit("getOnlineUsers", Object.keys(onlineusers));
  });
});

module.exports = { io, app, server, getReceiverSocketId };
