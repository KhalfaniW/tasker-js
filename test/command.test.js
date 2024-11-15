import { app } from "../src/server.js";
import { initializeClient } from "../src/client.js";
import request from "supertest";
import { jest } from "@jest/globals";

jest.setTimeout(400);
describe.skip("Command Testing Suite", () => {
  let server;
  const TEST_PORT = 3002;
  const TEST_URL = "http://localhost";


  beforeAll(() => {
    server = app.listen(TEST_PORT);
    global.flash = jest.fn();
    global.vibrate = jest.fn();
    global.exit = jest.fn();
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Send and receive command through POST endpoint", (done) => {
    initializeClient(TEST_URL, TEST_PORT).then(() => {
      // Wait for connection to establish
      setTimeout(async () => {
        // Send test command
        const response = await request(app)
          .post("/send-command")
          .send({ cmd: 'flash("hello world")' });

        expect(response.status).toBe(200);

        // Wait for command to be processed
        setTimeout(() => {
          expect(global.flash).toHaveBeenCalledWith("hello world");
          done();
        }, 100);
      }, 100);
    });
  });

  test("Handle invalid command gracefully", (done) => {
    initializeClient(TEST_URL, TEST_PORT).then(() => {
      setTimeout(async () => {
        const response = await request(app)
          .post("/send-command")
          .send({ cmd: "invalidFunction()" });

        expect(response.status).toBe(200);

        setTimeout(() => {
          expect(global.flash).toHaveBeenCalledWith(
            expect.stringContaining("Command execution error"),
          );
          done();
        }, 100);
      }, 100);
    });
  });

  test("Reject empty commands", async () => {
    const response = await request(app).post("/send-command").send({});

    expect(response.status).toBe(400);
    expect(response.text).toContain("required");
  });
});
