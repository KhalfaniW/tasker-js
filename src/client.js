import { postData } from "./client-lib.js";
import fetch from "node-fetch";
import EventSource from "eventsource";
const isNode = typeof window === "undefined";

if (isNode) {
  (async () => {
    globalThis.flash = console.log;
    globalThis.vibrate = () => {};
    globalThis.exit = () => {};
  })();
}

/*global flash*/
export async function initializeClient(
  url = `http://192.168.1.160`,
  port = 3000,
  logger = globalThis.flash,
) {
  try {
    const serverURL = `${url}:${port}/events`;
    let eventSource = new EventSource(serverURL);
    let reconnectInterval = null;

    globalThis.postData = postData;
    globalThis.url = url;
    globalThis.log = (str) => postData(`${url}:${port}/log`, str);
    globalThis.sLog = async (str) => {
      const response = await fetch(
        `${url}:${port}/s-log?log=${encodeURIComponent(str)}`,
      );
    };
    globalThis.l = async (str) => {
      const response = await fetch(
        `${url}:${port}/s-log?log=${encodeURIComponent(str)}`,
      );
    };
    globalThis.eventSource = eventSource;

    eventSource.onopen = () => {
      logger("Connected to server");
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
    };

    eventSource.onmessage = (event) => {
      logger(["data", event.data]);

      if (event.data === "close") {
        flash("CLOSED");
        eventSource.close();
        exit();
        return;
      }

      if (event.data.startsWith("cmd::")) {
        const command = event.data.substring(5);
        try {
          logger(command);
          // (0, eval)(command);
        } catch (e) {
          logger(`Command execution error: ${e.message}`);
        }
        return;
      }

      if (event.data === "Test message from server") {
        logger("Received test message");
      }
      if (event.data.includes("::")) {
        const [command, value] = event.data.split("::");
        logger(value);
        return;
      }
      try {
        // (0, eval)(event.data);
      } catch (e) {
        logger(`ERROR ${e.message}`);
      }
    };

    eventSource.onerror = (error) => {
      logger({ reconnectInterval });
      logger("Connection error:", error);
      if (!reconnectInterval) {
        logger("Disconnected; reconnecting");
        reconnect();
      }
    };

    const reconnect = () => {
      if (reconnectInterval) return;

      reconnectInterval = setInterval(() => {
        logger("attempt Reconnecting...");
        eventSource = new EventSource(serverURL);
        eventSource.onopen = () => {
          logger("Reconnected to server");
          clearInterval(reconnectInterval);
          reconnectInterval = null;
        };
        eventSource.onerror = (error) => {
          logger("Reconnection attempt failed:", error);
        };
      }, 100);
    };

    return eventSource; // Return eventSource for testing purposes
  } catch (e) {
    logger(JSON.stringify(e));
    exit();
  }
}
