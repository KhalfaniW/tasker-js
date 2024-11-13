import { postData } from "./client-lib.js";

(async () => {
  try {
    const url = `http://192.168.1.160`; //TODO handle this changing and set ports

    const serverURL = `${url}:3000/events`;

    let eventSource = new EventSource(serverURL);

    let reconnectInterval = null;

    globalThis.postData = postData;
    globalThis.url = url;
    globalThis.log = (str) => postData(`${url}:3000/log`, str);
    globalThis.sLog = async (str) => {
      const response = await fetch(
        `${url}:3000/s-log?log=${encodeURIComponent(str)}`,
      );
    };
    globalThis.l = async (str) => {
      const response = await fetch(
        `${url}:3000/s-log?log=${encodeURIComponent(str)}`,
      );
    };
    // globalThis.f = async (str) => {
    //   const response = await fetch(
    //     `${url}:3000/s-log?log=${encodeURIComponent(str)}`,
    //   );
    // };

    //  sLog(`url == ${url}:3000/s-log?log=${encodeURIComponent("test 0")}`);
    globalThis.eventSource = eventSource;

    eventSource.onopen = () => {
      flash("Connected to server");
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
    };

    eventSource.onmessage = (event) => {
      if (event.data.length < 3) {
        vibrate(120);
        flash("short_Message from server: " + event.data);
        return;
      }
      if (event.data === "close") {
        sLog("[remote] Closing connection...");
        flash("close");
        eventSource.close(); // Close the EventSource connection
        exit();
        return;
      }

        // flash(`$run ${event.data}`);
      try {
        // eval(event.data);
        (0, eval)(event.data);
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
        exit();
        flash("Disconnected from server. Attempting to reconnect...");
        console.log("Attempting to reconnect...");
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
    return;
  } catch (e) {
    flash(JSON.stringify(e));
    exit();
  }
})();
