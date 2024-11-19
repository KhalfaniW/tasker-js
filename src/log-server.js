import express from "express";
import cors from "cors";
import { createInterface } from "readline";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import winston from "winston";

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT + 1 || 3000 + 1;

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
    new winston.transports.File({ filename: "./tmp/server.log" }),
  ],
});

app.post("/log", (req, res) => {
  const logInput = req.body;
  const logData = logInput.data;
  logger.info(
    `Log: ${typeof logData == "object" ? JSON.stringify(logData) : logData}`,
  );
  // If you need to send SSE messages based on log data:
  // sendSSEMessage(clients[0], JSON.stringify(logData));
  res.status(200).json({ message: "Log received successfully", data: logData });
});

app.get("/s-log", (req, res) => {
  const { log } = req.query;

  logger.info(`Simple Loging: ${log}`);
  res.send(`loged ${log}`);
});

app.listen(PORT, () => {
  console.log(`log server is running on port ${PORT}`);
});
