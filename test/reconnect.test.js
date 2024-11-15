import { initializeClient } from "../src/client.js";
import app from "../src/app.js";
import fetch from "node-fetch";
import winston from "winston";
import { jest } from "@jest/globals";

jest.setTimeout(600);
  
const logger = winston.createLogger({
  level: process.env.DEBUG ? "debug" : "info",

  format: winston.format.combine(
    winston.format.printf(({ level, message }) => {
      return `${level}: ${message}`;
    }),
  ),
  transports: [new winston.transports.Console()],
});

describe("Client Reconnection Test", () => {
  let server;
  let port;
  let flashMock;
  let shutdown;
  beforeEach((done) => {
    ({ server, shutdown } = app.listen(0, () => {
      port = server.address().port;
      done();
    }));
  });

  afterAll((done) => {
    if (app?.close) {
      app.close(done);
    } else {
      done();
    }
  });

  beforeEach(() => {
    flashMock = jest.fn();
    global.flash = flashMock;
  });

  afterEach(() => {
    delete global.flash;
  });

  test("Able to close server", async () => {
    await new Promise((resolve) =>
      server.close(() => {
        logger.debug("Closed on it's own");
        resolve();
      }),
    );
    server = app.listen(port);
  });

  test("Client reconnects after server disconnect", async () => {
    const eventSource = await initializeClient("http://localhost", port);
    logger.debug("setup");
    await new Promise((resolve) => setTimeout(resolve, 150));

    logger.debug(`mock calls ${JSON.stringify(flashMock.mock.calls)}`);
    expect(flashMock).toHaveBeenCalledWith("Connected to server");
    logger.debug("Connected to server, successfuly");
    server.close();
    server.closeAllConnections();
    logger.debug("Server force close");
    await new Promise((resolve) => setTimeout(resolve, 200));
    logger.debug(`mock calls ${JSON.stringify(flashMock.mock.calls)}`);
    expect(flashMock).toHaveBeenCalledWith("Disconnected; reconnecting");

    server = app.listen(port);
    logger.debug("restarted");
    // Wait for client to reconnect
    await new Promise((resolve) => setTimeout(resolve, 200));

    logger.debug(
      `mock calls ${JSON.stringify(flashMock.mock.calls.map((p) => p[0]))}`,
    );
    expect(flashMock).toHaveBeenCalledWith("Reconnected to server");
  });

  test("Client disconnects on shutdown", async () => {
    const eventSource = await initializeClient("http://localhost", port);
    logger.debug("setup");
    await new Promise((resolve) => setTimeout(resolve, 150));

    logger.debug(`mock calls ${JSON.stringify(flashMock.mock.calls)}`);
    expect(flashMock).toHaveBeenCalledWith("Connected to server");
    logger.debug("Connected to server, successfuly");

    shutdown();

    logger.debug("Server shutdown");
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(flashMock).toHaveBeenCalledWith("CLOSED");
    const previousCallCount = flashMock.mock.calls.length;

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(flashMock.mock.calls.length).toBe(previousCallCount);
  });
});
