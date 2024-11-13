import { fromEvent, merge, defer, timer, EMPTY } from 'rxjs';
import { map, takeUntil, share, retryWhen, tap, switchMap, catchError, filter } from 'rxjs/operators';

const serverURL = "http://192.168.1.160:4505/events";
const EventSource = globalThis.EventSource || (await import("eventsource")).default;
const flash = (...s) => console.log("flash", s);

// Create event source factory
const createEventSource = () => new EventSource(serverURL);

// Create streams for each event type
const createSSEStreams = (eventSource) => {
  // Stream of open events
  const open$ = fromEvent(eventSource, 'open').pipe(
    tap(() => flash("Connected to server")),
    map(() => ({ 
      type: 'connected',
      timestamp: Date.now()
    }))
  );

  // Stream of message events
  const message$ = fromEvent(eventSource, 'message').pipe(
    tap(event => {
      flash("Received event: " + JSON.stringify(event));
      flash("Message from server: " + event.data);
    }),
    map(event => ({ 
      type: 'message',
      data: event.data,
      timestamp: Date.now()
    }))
  );

  // Stream of error events - now treated as messages
  const error$ = fromEvent(eventSource, 'error').pipe(
    tap(error => flash(`Error state: ${eventSource.readyState}`)),
    map(error => ({
      type: 'error',
      readyState: eventSource.readyState,
      isClosed: eventSource.readyState === EventSource.CLOSED,
      timestamp: Date.now(),
      error: error.message || 'Unknown error'
    }))
  );

  return merge(open$, message$, error$);
};

// Create the main event stream with automatic reconnection
const eventStream$ = defer(() => {
  const eventSource = createEventSource();
  const events$ = createSSEStreams(eventSource);
  
  return events$.pipe(
    takeUntil(
      fromEvent(eventSource, 'close').pipe(
        tap(() => {
          flash("Connection closed");
          eventSource.close();
        }),
        map(() => ({
          type: 'closed',
          timestamp: Date.now()
        }))
      )
    )
  );
}).pipe(
  share(), // Share the connection between multiple subscribers
  retryWhen(errors => 
    errors.pipe(
      tap(() => flash("Connection lost. Attempting to reconnect...")),
      map(error => ({
        type: 'reconnecting',
        timestamp: Date.now(),
        error: error.message || 'Unknown error'
      })),
      switchMap(() => timer(1000))
    )
  ),
  catchError(error => {
    const fatalError = {
      type: 'fatal_error',
      timestamp: Date.now(),
      error: error.message || 'Unknown fatal error'
    };
    flash("Fatal error occurred:", fatalError);
    return [fatalError]; // Emit the error as a message instead of completing
  })
);

// Subscribe to the event stream
const subscription = eventStream$.subscribe({
  next: (event) => {
    switch (event.type) {
      case 'connected':
        flash("Successfully connected to server");
        break;
      case 'message':
        flash("Received message:", event.data);
        break;
      case 'error':
        flash("Connection error:", event.error, 
          event.isClosed ? "- Connection closed" : "- Connection may recover");
        break;
      case 'reconnecting':
        flash("Attempting to reconnect after error:", event.error);
        break;
      case 'closed':
        flash("Connection closed by server");
        break;
      case 'fatal_error':
        flash("Fatal error occurred:", event.error);
        break;
    }
  },
  complete: () => flash("Stream completed")
});

// To clean up when done
// subscription.unsubscribe();
