import { postData } from "./client-lib.js";

(async () => {
  const url = `http://192.168.1.160`; //TODO handle this changing and set ports

  globalThis.flash =
    typeof flash === "undefined"
      ? (...s) => console.log(...s)
      : globalThis.flash;


  const serverURL = `${url}:3000/events`;

  if (!globalThis.EventSource) {
    globalThis.EventSource = (await eval(`(import("eventsource"))`)).default;
  }

  let eventSource = new EventSource(serverURL);

  let reconnectInterval = null;

  eventSource.onopen = () => {
    flash("Connected to server");
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
  };

  eventSource.onmessage = (event) => {
    flash("Message from server: " + event.data);
  };

  eventSource.onerror = (error) => {
    const errorMessage = error.message || "Unknown error";
    flash(`Er ${eventSource.readyState}` + JSON.stringify(error));

    if (!reconnectInterval) reconnect();

    if (eventSource.readyState === EventSource.CLOSED) {
      flash("Disconnected from server. Attempting to reconnect...");
      console.log("Attempting to reconnect...");
    }
  };

  const reconnect = () => {
    reconnectInterval = setInterval(() => {
      if (reconnectInterval) return; //idk why this insn't null
      flash("33Reconnecting...");
      console.log({ reconnectInterval });
      eventSource = new EventSource(serverURL);
    }, 1000);
  };
})();
