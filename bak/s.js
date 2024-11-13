import express from "express";
import { createInterface } from "readline";
import path from "path";
import fs from "fs";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("Type  message to broadcast to connected clients:");
rl.on("line", (line) => {
  console.log({ line });
});

// app.listen(3000, () => {
//   console.log("Server running on http://localhost:3000");
// });
