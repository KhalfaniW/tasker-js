import express from "express";
import dotenv from "dotenv";
import EventServer from "./event-server.js";

import cors from "cors";
import repl from "repl";
import path from "path";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const eventPort = process.env.EVENT_SERVER_PORT || 4505;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const goal = "aldis job applied confirmation ";
const eventServer = new EventServer(
  eventPort,
  (eventServer) => {
    eventServer.sendMessage("tests");
    eventServer.sendMessage("33tests");

    // Create the REPL server
    console.log("REPL started.  Type commands here."); // Indicate REPL is ready
    const myRepl = repl.start({
      prompt: "> ",
      eval: (cmd, context, filename, callback) => {
        eventServer.sendMessage(cmd);
      },
    });
  },
  app,
);

app.use("/code", express.static(path.join(import.meta.dirname, "client.js")));

app.use("/public", express.static("public"));

app.post("/log", (req, res) => {
  const logData = req.body;
  console.log("Received log data:", logData);
  res.status(200).json({ message: "Log received successfully", data: logData });
});

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
function doX() {
  console.log("do x");
  eventServer.sendMessage("cm33d");
}
