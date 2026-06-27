import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import groupRoutes from "./routes/group.route.js";
import websiteRoutes from "./routes/website.route.js";
import adminRoutes from "./routes/admin.route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import { app, server } from "./lib/socket.js";

const PORT = ENV.PORT || 3000;

app.use(express.json({ limit: "5mb" })); // req.body
app.use(cors({ origin: ENV.CLIENT_ORIGINS, credentials: true }));
app.use(cookieParser());

app.get("/api/health", (_, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/websites", websiteRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (_, res) => {
  res.status(200).json({ status: "ok", service: "chatify-backend" });
});

server.listen(PORT, () => {
  console.log("Server running on port: " + PORT);
  connectDB();
});
