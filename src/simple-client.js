import { postData } from "./client-lib.js";

const isNode = typeof window === "undefined";

if (isNode) {
  (async () => {
    globalThis.EventSource = (await import("eventsource")).default;
  })();
}

/*global flash*/
export async function initializeClient(
  url = `http://192.168.1.160`,
  port = 3000,
) {
  try {
    const serverURL = `${url}:${port}/events`;
    let eventSource = new EventSource(serverURL);
    let reconnectInterval = null;

    eventSource.onopen = () => {
      console.log("Connected to server");
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
    };
  } catch (error) {
    console.error("Failed to initialize client:", error);
  }
}
