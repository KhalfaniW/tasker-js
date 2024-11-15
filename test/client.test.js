import express from "express";
import { jest } from "@jest/globals";
import fetch from "node-fetch";
import { initializeClient } from "../src/client.js";
import { app } from "../src/server.js";

jest.setTimeout(500);
describe("Client-Server Integration Test", () => {
  let port;
  let flashMock;
  let eventsource;
  beforeAll((done) => {
    const listener = app.listen(0, () => {
      port = listener.address().port;
      console.log(`Test server running on http://localhost:${port}`);
      done();
      console.log("started");
    });
  });

  beforeEach(() => {
    flashMock = jest.fn();
    global.flash = flashMock;
  });

  afterEach(() => {
    delete global.flash;
  });

  afterAll((done) => {
    if (app && app.close) {
      app.close(done);
    } else {
      done();
    }
  });

  test("Connect and send message", (done) => {
    eventsource = initializeClient("http://localhost", port);
    setTimeout(() => {
      expect(flashMock).toHaveBeenCalledWith("Connected to server");
      done();
    }, 409);
  });

  test("Connect and send message twice", (done) => {
    setTimeout(() => {
      expect(flashMock).not.toHaveBeenCalledWith("Connected to server");
      eventsource = initializeClient("http://localhost", port);
      //fetch send message
      fetch(`http://localhost:${port}/send-test-message`).then(() => {
        setTimeout(() => {
          expect(flashMock).toHaveBeenCalledWith("Connected to server");
          expect(flashMock).toHaveBeenCalledWith("Received test message");
        }, 100);
      });

      fetch(`http://localhost:${port}/send-test-message`).then(() => {
        setTimeout(() => {
          console.log(flashMock.mock.calls);
          const logCalls = flashMock.mock.calls.map((params) => params[0]);
          const receivedCount = logCalls.filter(
            (log) => log == "Received test message",
          ).length;
          expect(receivedCount).toEqual(2);

          done();
        }, 200);
      });
    }, 100);
  });

  test("Send command and receive message", async () => {
    eventsource = initializeClient("http://localhost", port);

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(flashMock).toHaveBeenCalledWith("Connected to server");

    await fetch(`http://localhost:${port}/send-test-message`);
    await fetch(`http://localhost:${port}/send-test-message`);

    await fetch(`http://localhost:${port}/send-command`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cmd: "test command" }),
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(flashMock).toHaveBeenCalledWith("test command");
  });

  //TODO handle multiple clients
});
