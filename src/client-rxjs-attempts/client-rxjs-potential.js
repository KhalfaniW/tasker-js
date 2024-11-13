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
const createEventSource = () => new EventSource(serverURL);

const createSSEStream = (eventSource) => {
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
// Create streams for each event type

// Create the main event stream with automatic reconnection
const eventStream$ = defer(() => {
  const eventSource = createEventSource();
  const events$ = createSSEStreams(eventSource);

  // Create a stream that will clean up the EventSource on unsubscribe
  return events$.pipe(
    takeUntil(
      fromEvent(eventSource, "close").pipe(tap(() => eventSource.close())),
    ),
  );
}).pipe(
  share(), // Share the connection between multiple subscribers
  retryWhen((errors) =>
    errors.pipe(
      tap((error) => flash("Attempting to reconnect...")),
      switchMap(() => timer(1000)),
    ),
  ),
  catchError((error) => {
    flash("Fatal error occurred:", error);
    return EMPTY;
  }),
);

// Subscribe to the event stream
const subscription = eventStream$.subscribe({
  next: (event) => {
    switch (event.type) {
      case "connected":
        flash("Successfully connected to server");
        break;
      case "message":
        flash("Received message:", event.data);
        break;
    }
  },
  error: (error) => flash("Error in stream:", error),
  complete: () => flash("Stream completed"),
});

// To clean up when done
// subscription.unsubscribe();
