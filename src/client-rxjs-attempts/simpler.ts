import {
  fromEvent,
  merge,
  defer,
  timer,
  EMPTY,
  Observable,
  Subject,
} from "rxjs";
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
  return new Subject((subscriber) => {
    eventSource.onopen = (event) => {
      subscriber.next({ type: "connected", event });
    };

    eventSource.onmessage = (event) => {
      subscriber.next({ type: "message", event, data: event.data });
    };

    eventSource.onerror = (error) => {
      subscriber.next({
        type: "error",
        error,
        eventSource,
        message: error.message || "Unknown error", // Directly add the error message here
      });
      if (eventSource.readyState === EventSource.CLOSED) {
        subscriber.complete(); // Complete the observable if the connection is closed
      }
    };

    return () => {
      // Cleanup function
      eventSource.close(); // Close the EventSource when the subscription is unsubscribed
    };
  }).pipe(
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

          if (eventSource.readyState === EventSource.CLOSED) {
            flash("Disconnected from server.");
          } else {
            flash("Disconnected from server. Attempting to reconnect..."); // Only show reconnecting message if not CLOSED
          }
          break;
      }
    }),
  );
};
