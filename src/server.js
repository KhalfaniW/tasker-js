import express from "express";
import { createInterface } from "readline";
import path from "path";
import fs from "fs";
const app = express();
// const server = createServer(app);

const clients = [null];

app.get("/events", (req, res) => {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Add client to the clients set
  clients[0] = res;
  console.log("opened");
  // Remove client on disconnect
  req.on("close", () => {
    clients[0]?.write(`data: close\n\n`);

    console.log("closed");

    clients[0] = null;
  });
});

app.use(
  "/code",
  express.static(path.join(import.meta.dirname, "../build/client.js")),
);

app.post("/log", (req, res) => {
  const logData = req.body;
  console.log("log data:", logData);
  res.status(200).json({ message: "Log received successfully", data: logData });
});

app.get("/s-log", (req, res) => {
  const { log: inputLog } = req.query;
  const log = decodeURIComponent(inputLog);

  console.log(`Simple Loging: ${log}`);
  res.send(`loged ${log}`);
});

app.get("/s", (req, res) => {
  console.log("ssssssss");
  //   const { log: inputLog } = req.query; // Destructure the query parameter
  //   console.log({ inputLog });
  res.send(`loged s`);
});

// Broadcast message to all connected clients
function broadcastMessage(message) {
  for (const client of clients) {
    client?.write(`data: ${message}\n\n`);
  }
}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("Type  message to broadcast to connected clients:");
rl.on("line", (line) => {
  broadcastMessage(line);
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
