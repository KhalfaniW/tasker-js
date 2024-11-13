import { fromEvent, merge, defer, timer, Subject,Observable } from "rxjs";
import { fromEventPattern, of } from "rxjs";
import { tap, switchMap, filter } from "rxjs/operators";
import { map, takeUntil, share, retryWhen, concatMap } from "rxjs/operators";

import { mock, describe, it, expect } from "bun:test";

const flash = mock((x) => {});
let sub0 = new Subject();
sub0.subscribe();

describe("createSSEStream", () => {
  it("should handle open events", async () => {
    const newSub = sub0.pipe(funs());
    newSub.subscribe();
    const sub = newSub;
    sub.next({ type: "connected", ignore: true });
    expect(flash).toHaveBeenCalledTimes(0);
    sub.next({ type: "connected" });
    expect(flash).toHaveBeenCalledTimes(1);

    // Message event with delay
    sub.next({ type: "message", data: "Hello" });
    expect(flash).toHaveBeenCalledTimes(1);
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(flash).toHaveBeenCalledTimes(2);
    expect(1).toBe(3 - 2);
  });
});

const delayWhenOperattion = () => (obs) =>
  obs.pipe(
    map((event) => {
      if (event.type === "message") {
        return new Observable((observer) => {
          setTimeout(() => {
            observer.next(event); // Emit the event after the delay
            observer.complete(); // Complete the observable
          }, 400); // Delay for 400ms
        }).pipe(map(() => event)); // Delay the event by 400ms
      }
      return of(event); // No delay for other event types
    }),
    concatMap((event$) => event$),
  );
function funs() {
  return (obs) =>
    obs.pipe(
      ...[
        filter((event) => !event.ignore),
        delayWhenOperattion(),
        tap((event) => {
          switch (event.type) {
            case "connected":
              flash("Connected to server");
              break;
            case "message":
              flash("Message from server: " + event.data);
              break;
          }
        }), 
      ],
    );
}
