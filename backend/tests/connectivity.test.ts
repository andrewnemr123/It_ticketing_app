import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app";

describe("Frontend to Backend Connectivity & Protocol Tests", () => {
  it("should return Access-Control-Allow-Origin header for browser cross-origin requests", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:5173");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("should handle CORS preflight OPTIONS requests cleanly", async () => {
    const res = await request(app)
      .options("/api/auth/login")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "Content-Type, Authorization");

    expect(res.status).toBe(204); // No Content for successful preflight
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
  });

  it("should reject malformed JSON payloads gracefully with 400 or handled response", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{ invalid json payload ");

    expect(res.status).toBe(400);
  });
});

