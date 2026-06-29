import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";

// These imports will fail until src/app.js is implemented — that is expected.
import app, { startServer } from "../src/app.js";

describe("GET /health", () => {
  it("returns HTTP 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
  });

  it("returns JSON body { status: 'ok' }", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("app export", () => {
  it("exports a default app object (Express application)", () => {
    // An Express app is a function with routing methods attached.
    expect(typeof app).toBe("function");
    expect(typeof app.get).toBe("function");
    expect(typeof app.use).toBe("function");
    expect(typeof app.listen).toBe("function");
  });
});

describe("startServer export", () => {
  it("exports a named startServer function", () => {
    expect(typeof startServer).toBe("function");
  });

  it("startServer(port) starts the server and returns a net.Server (or similar closeable handle)", async () => {
    const server = startServer(0); // port 0 lets the OS pick a free port
    expect(server).toBeDefined();
    // Should have a close() method so we can tear it down cleanly
    expect(typeof server.close).toBe("function");
    // Clean up
    await new Promise((resolve) => server.close(resolve));
  });
});
