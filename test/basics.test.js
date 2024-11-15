import express from "express";
import { jest } from "@jest/globals";
import EventSource from "eventsource";
import { app } from "../src/server";
jest.setTimeout(400);

describe("Real Basic Connectivity Test", () => {
  let port;
  let eventSource;
  let server;
  let failed;
  beforeAll((done) => {
    server = app.listen(0, () => {
      port = server.address().port;
      console.log(`Test server running on http://localhost:${port}`);
      done();
    });
  });

  afterAll((done) => {
    if (app && app.close) {
      app.close(done);
    } else {
      done();
    }
  });

  afterEach(() => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  });

  test("basic connect", (done) => {
    const serverURL = `http://localhost:${port}/events`;
    eventSource = new EventSource(serverURL);

    eventSource.onopen = () => {
      done();
    };

    eventSource.onerror = (error) => {
      if (failed) {
        console.log({ error });
        done(error);
      }
    };
  });
});

describe("Mock Basic Connectivity Test", () => {
  let port;
  let eventSource;
  let server;
  let mockApp;

  beforeAll((done) => {
    mockApp = createTestApp();
    server = mockApp.listen(0, () => {
      port = server.address().port;
      console.log(`Test server running on http://localhost:${port}`);
      done();
    });
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  afterEach(() => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  });

  test("Test mock basic connect", (done) => {
    const serverURL = `http://localhost:${port}/events`;
    eventSource = new EventSource(serverURL);

    eventSource.onopen = () => {
      done();
    };

    eventSource.onerror = (error) => {
      done(error);
    };
  });
  test("Test real basic connect", (done) => {
    const serverURL = `http://localhost:${port}/events`;
    eventSource = new EventSource(serverURL);

    eventSource.onopen = () => {
      done();
    };

    eventSource.onerror = (error) => {
      done(error);
    };
  });
});
const createTestApp = () => {
  const app = express();
  const clients = [null];

  app.get("/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    clients[0] = res;
    res.write(`data: open\n\n`);
  });

  return app;
};
