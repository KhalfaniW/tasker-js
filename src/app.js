import express from "express";
import { createInterface } from "readline";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import winston from "winston";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

const clients = [null];

// Configure winston logger
const logger = winston.createLogger({
  level: process.env.VERBOSE ? "verbose" : "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    }),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "server.log" }),
  ],
});

// Helper function to send messages to the client
function sendMessageToClient(client, message) {
  if (client) {
    client.write(`data: ${message}\n\n`);
    return true;
  } else {
    logger.warn("Attempted to send message to non-existent client");
    return false;
  }
}

app.get("/events", (req, res) => {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients[0] = res;
  //data needs to be sent for first onopen to be called
  sendMessageToClient(clients[0], "open");
  logger.verbose("Client connection opened");
  // Remove client on disconnect
  req.on("close", () => {
    sendMessageToClient(clients[0], "close");
    logger.verbose("Client connection closed");

    clients[0] = null;
  });
});

app.use("/code", express.static(path.join(__dirname, "../build/client.js")));

app.post("/log", (req, res) => {
  const logData = req.body;
  logger.verbose("Log data received: " + JSON.stringify(logData));
  // If you need to send SSE messages based on log data:
  // sendSSEMessage(clients[0], JSON.stringify(logData));
  res.status(200).json({ message: "Log received successfully", data: logData });
});

app.get("/s-log", (req, res) => {
  const { log: inputLog } = req.query;
  const log = decodeURIComponent(inputLog);

  logger.info(`Simple Loging: ${log}`);
  res.send(`loged ${log}`);
});

app.get("/send-test-message", (req, res) => {
  logger.verbose("sending test message");
  logger.debug("client `${clients[0]}`");
  if (sendMessageToClient(clients[0], "Test message from server")) {
    res.status(200).send("Test message sent");
  } else {
    res.status(400).send("No client connected");
  }
});

app.post("/send-command", (req, res) => {
  const { cmd } = req.body;
  if (!cmd) {
    res.status(400).send("Command parameter 'cmd' is required in request body");
    return;
  }

  if (sendMessageToClient(clients[0], `cmd::${cmd}`)) {
    res.status(200).send(`Command "${cmd}" sent successfully`);
  } else {
    res.status(200).send("No client connected");
  }
});

export { app };
