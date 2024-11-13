import { fromEventPattern, of } from "rxjs";
import {
  map,
  tap,
  catchError,
} from "rxjs/operators";
import { createSSEStream, createEventSource } from "./simple"; // Adjust path as needed


describe("createSSEStream", () => {
  let mockEventSource: any;

  beforeEach(() => {
    mockEventSource = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      readyState: 0, // Or any other initial state you need
      CLOSE: 2, // Mocking the CLOSED state
    };
    (global as any).EventSource = jest.fn(() => mockEventSource); // Mock EventSource constructor
  });


  it("should handle open events", () => {
    const sseStream$ = createSSEStream(createEventSource());
    const mockOpenEvent = { type: "open" };
    const nextFn = jest.fn();
    sseStream$.subscribe(nextFn);

    mockEventSource.addEventListener.mock.calls[0][1](mockOpenEvent); // Simulate 'open' event

    expect(nextFn).toHaveBeenCalledWith({ type: "connected", event: mockOpenEvent });
  });


  it("should handle message events", () => {
    const sseStream$ = createSSEStream(createEventSource());
    const mockMessageEvent = { type: "message", data: "test data" };
    const nextFn = jest.fn();
    sseStream$.subscribe(nextFn);


    mockEventSource.addEventListener.mock.calls[1][1](mockMessageEvent);  // Simulate 'message' event

    expect(nextFn).toHaveBeenCalledWith({ type: "message", event: mockMessageEvent, data: "test data" });

  });



  it("should handle error events and map unknown errors when not closed", () => {
    const sseStream$ = createSSEStream(createEventSource());
    const mockErrorEvent = { type: "error" };
    const nextFn = jest.fn();
    sseStream$.subscribe(nextFn);

    mockEventSource.addEventListener.mock.calls[2][1](mockErrorEvent); // Simulate 'error' event

    expect(nextFn).toHaveBeenCalledWith({ type: "error", error: mockErrorEvent, eventSource: mockEventSource, message: 'Unknown Error' });
  });



  it("should handle error events and pass error through when closed", () => {
    mockEventSource.readyState = mockEventSource.CLOSE;  // Set readyState to CLOSED
    const sseStream$ = createSSEStream(createEventSource());
    const mockErrorEvent = { type: "error", message: "Custom error message" };
    const nextFn = jest.fn();
    sseStream$.subscribe(nextFn);
    
    mockEventSource.addEventListener.mock.calls[2][1](mockErrorEvent);  //Simulate 'error' event
    
    expect(nextFn).toHaveBeenCalledWith({ type: "error", error: mockErrorEvent, eventSource: mockEventSource, error: "Custom error message" });

  });

  it("should call removeEventListeners on unsubscribe", () => {
    const sseStream$ = createSSEStream(createEventSource());
    const subscription = sseStream$.subscribe(() => {});

    subscription.unsubscribe();

    expect(mockEventSource.removeEventListener).toHaveBeenCalledTimes(3); // Ensure all listeners are removed
  });



 it("should handle catchError and return error object", () => {
   const sseStream$ = createSSEStream(createEventSource());
   const mockError = new Error("Test Error");
   const nextFn = jest.fn();
   sseStream$.subscribe(nextFn, undefined, undefined); 

   // Trigger the error within the observable pipeline
   const errorHandler = mockEventSource.addEventListener.mock.calls[2][1];
   errorHandler(mockError);


   expect(nextFn).toHaveBeenCalledWith({ type: "error", error: "Test Error"});
 });


});
