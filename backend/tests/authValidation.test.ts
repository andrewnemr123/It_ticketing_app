import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app";

describe("Authentication Input Validation Tests", () => {
  describe("POST /api/auth/login", () => {
    it("should reject login request when email is missing with 400 Bad Request", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ password: "Password123" });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Email and password are required");
    });

    it("should reject login request when password is missing with 400 Bad Request", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "user@company.com" });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Email and password are required");
    });
  });

  describe("POST /api/auth/register", () => {
    it("should reject registration with password shorter than 8 characters", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "John Doe",
          email: "john@company.com",
          password: "short",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("at least 8 characters");
    });

    it("should reject registration when name is missing", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "john@company.com",
          password: "Password123",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Name, email and password are required");
    });
  });
});

