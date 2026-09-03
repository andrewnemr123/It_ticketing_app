import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import app from "../src/app";
import pool from "../src/config/db";

describe("Auth Controller Success & DB Logic Tests", () => {
  const JWT_SECRET = "test_jwt_secret_key_123";

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    vi.restoreAllMocks();
  });

  describe("POST /api/auth/register (Success flow)", () => {
    it("should hash password and create a new employee user", async () => {
      vi.spyOn(pool, "execute")
        .mockResolvedValueOnce([[], []] as any) // check existing email -> none
        .mockResolvedValueOnce([{ insertId: 7 }, []] as any); // insert

      const res = await request(app).post("/api/auth/register").send({
        name: "Alice Cooper",
        email: "alice@company.com",
        password: "Password123",
      });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("User created successfully");
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe("EMPLOYEE");
    });
  });

  describe("POST /api/auth/login (Success & Invalid flows)", () => {
    it("should return 401 when email is not found in database", async () => {
      vi.spyOn(pool, "execute").mockResolvedValueOnce([[], []] as any);

      const res = await request(app).post("/api/auth/login").send({
        email: "nonexistent@company.com",
        password: "Password123",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid email or password");
    });

    it("should return 401 when password does not match hash", async () => {
      const realHash = await bcrypt.hash("CorrectPassword123", 10);
      const mockUserRow = {
        id: 1,
        name: "Admin",
        email: "admin@company.com",
        password_hash: realHash,
        role: "ADMIN",
      };

      vi.spyOn(pool, "execute").mockResolvedValueOnce([[mockUserRow], []] as any);

      const res = await request(app).post("/api/auth/login").send({
        email: "admin@company.com",
        password: "WrongPassword123",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid email or password");
    });

    it("should return 200 and token on correct email and password", async () => {
      const realHash = await bcrypt.hash("CorrectPassword123", 10);
      const mockUserRow = {
        id: 1,
        name: "Admin",
        email: "admin@company.com",
        password_hash: realHash,
        role: "ADMIN",
      };

      vi.spyOn(pool, "execute").mockResolvedValueOnce([[mockUserRow], []] as any);

      const res = await request(app).post("/api/auth/login").send({
        email: "admin@company.com",
        password: "CorrectPassword123",
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe("admin@company.com");
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return the current user profile from token", async () => {
      const token = jwt.sign(
        { userId: 1, email: "admin@company.com", role: "ADMIN" },
        JWT_SECRET
      );

      const mockUserRow = {
        id: 1,
        name: "Admin",
        email: "admin@company.com",
        role: "ADMIN",
        created_at: new Date(),
      };

      vi.spyOn(pool, "execute").mockResolvedValueOnce([[mockUserRow], []] as any);

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe("Admin");
    });
  });
});

