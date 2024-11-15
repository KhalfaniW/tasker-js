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
  flash = globalThis.flash,
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
      flash("Connected to server");
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
    };

    eventSource.onmessage = (event) => {
      flash(["data", event.data]);

      if (event.data.length < 3) {
        vibrate(120);
        flash("short_Message from server: " + event.data);
        return;
      }
      if (event.data === "close") {
        exit();
        return;
      }

      if (event.data.startsWith("cmd::")) {
        const command = event.data.substring(5);
        try {
          flash(command);
          // (0, eval)(command);
        } catch (e) {
          flash(`Command execution error: ${e.message}`);
        }
        return;
      }

      if (event.data === "Test message from server") {
        flash("Received test message");
      }
      if (event.data.includes("::")) {
        const [command, value] = event.data.split("::");
        flash(value);
        return;
      }
      try {
        // (0, eval)(event.data);
      } catch (e) {
        flash(`ERROR ${e.message}`);
      }
    };

    eventSource.onerror = (error) => {
      const errorMessage = error.message || "Unknown error";
      if (eventSource.readyState !== 0)
        flash(`Er ${eventSource.readyState}` + JSON.stringify(error));

      if (!reconnectInterval) reconnect();

      if (eventSource.readyState === EventSource.CLOSED) {
        flash("Disconnected from server. Attempting to reconnect...");
        console.log("Attempting to reconnect...");
        exit();
      }
    };

    const reconnect = () => {
      reconnectInterval = setInterval(() => {
        if (reconnectInterval) return; //idk why this insn't null
        flash("33Reconnecting...");
        console.log({ reconnectInterval });
        // eventSource = new EventSource(serverURL);
      }, 1000);
    };
    flash("loaded");
    return eventSource; // Return eventSource for testing purposes
  } catch (e) {
    flash(JSON.stringify(e));
    exit();
  }
}
