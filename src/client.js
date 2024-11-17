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
    const url = baseUrl;

    //console.error will cause tasker to exit
    console.error = (...params) => globalThis.flash(`ERROR:: ${params}`);
    globalThis.postData = postData;
    globalThis.url = url;
    globalThis.log = async (str) => {
      try {
        await postData(`${url}:${port + 1}/log`, String(str));
      } catch (err) {
        console.error("Error in log:", err);
      }
    };
    globalThis.sLog = async (str) => {
      try {
        const response = await fetch(
          `${url}:${port + 1}/s-log?log=${encodeURIComponent(String(str))}`,
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
      } catch (err) {
        console.error("Error in sLog:", err);
      }
    };
    globalThis.l = async (str) => {
      try {
        const response = await fetch(
          `${url}:${port + 1}/s-log?log=${encodeURIComponent(String(str))}`,
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
      } catch (err) {
        console.error("Error in l:", err);
      }
    };
    window.client = await initializeClient(baseUrl, port, {
      logger: async (str) => {
        try {
          await sLog(str);
        } catch (err) {
          globalThis.flash(err, "logging-slog-error", err);
        } finally {
        }
      },
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
          // Decode the incoming data
          const decodedData = atob(event.data);
          logger(["data", decodedData]);

          if (decodedData === "close") {
            logger("CLOSED");
            eventSource.close();
            exit();
            return;
          }

          if (decodedData.startsWith("cmd::")) {
            const command = decodedData.substring(5);
            try {
              logger(command);
              (0, eval)(command);
            } catch (e) {
              logger(`Command ERROR: ${e.message}`);
            }
            return;
          }

          if (decodedData === "Test message from server") {
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
