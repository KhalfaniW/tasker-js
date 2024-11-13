import { fromEvent, merge, defer, timer, EMPTY } from "rxjs";
import { fromEventPattern, of } from "rxjs";
import {
  map,
  takeUntil,
  share,
  retryWhen,
  tap,
  switchMap,
  catchError,
  filter,
} from "rxjs/operators";

const serverURL = "http://192.168.1.160:4505/events";
const EventSource =
  globalThis.EventSource || (await import("eventsource")).default;
const flash = (...s) => console.log("flash", s);

// Create event source factory
export const createEventSource = () => new EventSource(serverURL);

export const createSSEStream = (eventSource) => {
  return fromEventPattern((handler) => {
    eventSource.addEventListener("open", (event) => {
      handler({ type: "connected", event });
    });

    eventSource.addEventListener("message", (event) => {
      handler({ type: "message", event, data: event.data });
    });

    eventSource.addEventListener("error", (error) => {
      handler({
        type: "error",
        error,
        eventSource,
        error: error.message || "Unknown error",
      });
    });

    return () => {
      eventSource.removeEventListener("open", handler); 
      eventSource.removeEventListener("message", handler);
      eventSource.removeEventListener("error", handler);
    };
  }).pipe(
    map((e) =>
      e.type == "error" && e.eventSource.readyState !== EventSource.CLOSED
        ? { ...e, message: "Unknown Error" }
        : e,
    ),
    tap((event) => {
      switch (event.type) {
        case "connected":
          flash("Connected to server");
          break;
        case "message":
          flash("Received event: " + JSON.stringify(event));
          flash("Message from server: " + event.data);
          break;
        case "error":
          flash(
            `Error ${eventSource.readyState} ${JSON.stringify(event.error)}`,
          );
          flash("Disconnected from server. Attempting to reconnect...");
          break;
      }
    }),
    catchError((err) => {
      console.error("SSE Error:", err);
      return of({ type: "error", error: err.message });
    }),
  );
};
