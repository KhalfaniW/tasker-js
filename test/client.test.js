import express from "express";
import { jest } from "@jest/globals";
import fetch from "node-fetch";
import { initializeClient } from "../src/client.js";
import { app } from "../src/app.js";
import winston from "winston";
jest.setTimeout(500);
const logger = winston.createLogger({
  level: process.env.DEBUG  ? "debug" : "info",
  format: winston.format.combine(
    winston.format.printf(({ timestamp, level, message }) => { 
      return `${timestamp} ${level}: ${message}`;
    }),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "server.log" }),
  ],
});

describe("Client-Server Integration Test", () => {
  let port;
  let flashMock;
  let eventsource;
  beforeAll(async () => {
    const listener = await new Promise((resolve) => {
      const server = app.listen(0, () => resolve(server));
    });
    port = listener.address().port;
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

  test("Connect", async () => {
    eventsource = initializeClient("http://localhost", port);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(flashMock).toHaveBeenCalledWith("Connected to server");
  });

  test("Connect and send message twice", async () => {
    expect(flashMock).not.toHaveBeenCalledWith("Connected to server");
    eventsource = initializeClient("http://localhost", port);

    await fetch(`http://localhost:${port}/send-test-message`);
    await new Promise((resolve) => setTimeout(resolve, 31));
    expect(flashMock).toHaveBeenCalledWith("Received test message");

    await fetch(`http://localhost:${port}/send-test-message`);
    await new Promise((resolve) => setTimeout(resolve, 32));

    const logCalls = flashMock.mock.calls.map((params) => params[0]);
    const receivedCount = logCalls.filter(
      (log) => log == "Received test message",
    ).length;
    logger.debug(flashMock.mock.calls);
    expect(receivedCount).toEqual(2);
  });

  test("Send command and receive message", async () => {
    eventsource = initializeClient("http://localhost", port);

    await new Promise((resolve) => setTimeout(resolve, 100));
    logger.debug(flashMock.mock.calls);
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
    logger.debug(flashMock.mock.calls);
    expect(flashMock).toHaveBeenCalledWith("test command");
  });

  //TODO handle multiple clients
});
