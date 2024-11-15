import express from "express";
import { createInterface } from "readline";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json()); // Add this line to parse JSON bodies
const PORT = process.env.PORT || 3000;

const clients = [null];

app.get("/events", (req, res) => {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients[0] = res;
  //data needs to be sent for first onopen to be called
  clients[0].write(`data: open\n\n`);
  console.log("opened");
  // Remove client on disconnect
  req.on("close", () => {
    clients[0]?.write(`data: close\n\n`);
    console.log("closed");

    clients[0] = null;
  });
});

app.use("/code", express.static(path.join(__dirname, "../build/client.js")));

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

app.get("/send-test-message", (req, res) => {
  if (clients[0]) {
    clients[0].write(`data: Test message from server\n\n`);
    res.status(200).send("Test message sent"); 
  } else {
    res.status(200).send("No client connected");
  } 
});

app.post("/send-command", (req, res) => {
  const { cmd } = req.body;
  if (!cmd) {
    res.status(400).send("Command parameter 'cmd' is required in request body");
    return;
  }

  if (clients[0]) {
      console.log('sENDING MESSAGE')
    clients[0].write(`data: cmd::${cmd}\n\n`);
    res.status(200).send(`Command "${cmd}" sent successfully`);
  } else {
    res.status(200).send("No client connected");
  }
});

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
export { app };
