import { postData } from "./client-lib.js";
import { Observable, timer } from "rxjs";
import { retryWhen, delayWhen, tap } from "rxjs/operators";

const isNode = typeof window === "undefined";

const baseUrl = globalThis.baseUrl || "http://localhost";

if (isNode) {
  (async () => {
    globalThis.flash = console.log;
    globalThis.vibrate = () => {};
    globalThis.exit = () => {};
  })();
} else {
  (async () => {
    const port = 3000;

    window.client = await initializeClient(baseUrl, port, {
      logger: (str) => postData(`${baseUrl}:${port}/log`, str),
    });
    window.initializeClient = initializeClient;
  })();
}

export async function initializeClient(
  url = `http://192.168.1.160`,
  port = 3000,
  { logger = globalThis.flash, reconnectInterval = 1000 } = {},
) {
  try {
    const serverURL = `${url}:${port}/events`;

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
    logger("initializing");
    let isReconnecting = false; // Add this variable
    let eventSource; // Declare eventSource in the outer scope

    const connect$ = new Observable((subscriber) => {
      logger("Attempting to connect...");
      eventSource = new EventSource(serverURL); // Assign to outer scope variable

      eventSource.onopen = () => {
        if (isReconnecting) {
          logger("Reconnected to server");
          isReconnecting = false;
        } else {
          logger("Connected to server");
        }
      };

      eventSource.onmessage = (event) => {
        subscriber.next(event);
      };

      eventSource.onerror = () => {
        subscriber.error(new Error("Connection lost"));
      };

      return () => {
        eventSource.close();
      };
    });

    connect$
      .pipe(
        retryWhen((errors) =>
          errors.pipe(
            tap(() => {
              logger("Disconnected; reconnecting");
              isReconnecting = true;
            }),
            delayWhen(() => timer(reconnectInterval)),
          ),
        ),
      )
      .subscribe(
        (event) => {
          logger(["data", event.data]);

          if (event.data === "close") {
            logger("CLOSED");
            eventSource.close();
            exit();
            return;
          }

          if (event.data.startsWith("cmd::")) {
            const command = event.data.substring(5);
            try {
              logger(command);
              (0, eval)(command);
            } catch (e) {
              logger(`Command ERROR: ${e.message}`);
            }
            return;
          }

          if (event.data === "Test message from server") {
            logger("Received test message");
            return;
          }
        },
        (error) => {
          logger("Failed to reconnect:", error); 
        },
      );

    return eventSource; // Return eventSource if needed
  } catch (e) {
    logger(JSON.stringify(e));
    exit();
  }
}
