import express from "express";
import { jest } from "@jest/globals";
import fetch from "node-fetch";
import { initializeClient } from "../src/client.js";
import { app } from "../src/server.js";

jest.setTimeout(1500);
describe("Client-Server Integration Test", () => {
  let port;
  let flashMock;

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
 
  test("Successful and send message", (done) => {
    initializeClient("http://localhost", port);

    setTimeout(() => {
      expect(flashMock).toHaveBeenCalledWith("Connected to server");
      done();
    }, 100);
  });

  test("Successful and send message again", (done) => {
    setTimeout(() => {
      expect(flashMock).not.toHaveBeenCalledWith("Connected to server");

      initializeClient("http://localhost", port);
      //fetch send message
      fetch(`http://localhost:${port}/send-test-message`).then(() => {
        setTimeout(() => {
          console.log(flashMock.mock.calls);
          expect(flashMock).toHaveBeenCalledWith("Received test message");
          done();
        }, 100);
      });
    }, 100);
  });

     test("Successful and send custom message again", (done) => {
    setTimeout(() => {
      expect(flashMock).not.toHaveBeenCalledWith("Connected to server");

      initializeClient("http://localhost", port);
      //fetch send message
      fetch(`http://localhost:${port}/send-test-message`).then(() => {
        setTimeout(() => {
          console.log(flashMock.mock.calls);
          expect(flashMock).toHaveBeenCalledWith("Received test message");
          done();
        }, 100);
      });
    }, 100);
  });

  //TODO handle multiple clients
});
