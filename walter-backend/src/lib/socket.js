import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ENV.CLIENT_ORIGINS,
    credentials: true,
  },
});

// apply authentication middleware to all socket connections
io.use(socketAuthMiddleware);

// we will use this function to check if the user is online or not
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// this is for storig online users
const userSocketMap = {}; // {userId:socketId}

import Group from "../models/Group.js";

io.on("connection", async (socket) => {
  console.log("A user connected", socket.user.fullName);

  const userId = socket.userId;
  userSocketMap[userId] = socket.id;

  io.emit("contactAdded", {
    _id: socket.user._id.toString(),
    fullName: socket.user.fullName,
    profilePic: socket.user.profilePic,
    status: socket.user.status,
  });

  // Auto-join group rooms
  try {
    const userGroups = await Group.find({ members: userId }).select("_id");
    userGroups.forEach((group) => {
      socket.join(group._id.toString());
    });
  } catch (error) {
    console.error("Error joining group rooms:", error);
  }

  // io.emit() is used to send events to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("joinGroup", (groupId) => {
    Group.exists({ _id: groupId, members: userId })
      .then((isMember) => {
        if (!isMember) return;
        socket.join(groupId);
        console.log(`User ${userId} joined group ${groupId}`);
      })
      .catch((error) => {
        console.error("Error joining group room:", error);
      });
  });

  // with socket.on we listen for events from clients
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.user.fullName);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
