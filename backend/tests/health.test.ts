import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app";

describe("API Connectivity & Health Endpoint", () => {
  it("GET /api/health should respond with 200 OK and status 'ok'", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.header["content-type"]).toContain("application/json");
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /api/non-existent-route should return 404 Route not found", async () => {
    const res = await request(app).get("/api/non-existent-route");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Route not found");
  });
});

