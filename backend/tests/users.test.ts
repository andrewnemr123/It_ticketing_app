import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app";
import pool from "../src/config/db";


describe("User Controller & Management API Tests", () => {
  const JWT_SECRET = "test_jwt_secret_key_123";
  let adminToken: string;
  let employeeToken: string;

  const mockUser = {
    id: 2,
    name: "Sarah Jenkins",
    email: "sarah@company.com",
    role: "EMPLOYEE",
    created_at: new Date(),
  };

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    adminToken = jwt.sign(
      { userId: 1, email: "admin@company.com", role: "ADMIN" },
      JWT_SECRET
    );
    employeeToken = jwt.sign(
      { userId: 2, email: "sarah@company.com", role: "EMPLOYEE" },
      JWT_SECRET
    );
    vi.restoreAllMocks();
  });

  describe("GET /api/users", () => {
    it("should reject non-admin users with 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it("should allow admin to list all users", async () => {
      vi.spyOn(pool, "query").mockResolvedValueOnce([[mockUser], []] as any);

      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(1);
      expect(res.body.users[0].email).toBe("sarah@company.com");
    });
  });

  describe("GET /api/users/:id", () => {
    it("should return 400 for invalid non-integer user ID", async () => {
      const res = await request(app)
        .get("/api/users/xyz")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid id");
    });

    it("should return 404 if user does not exist", async () => {
      vi.spyOn(pool, "execute").mockResolvedValueOnce([[], []] as any);

      const res = await request(app)
        .get("/api/users/999")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("User not found");
    });

    it("should return 200 with user data for valid id", async () => {
      vi.spyOn(pool, "execute").mockResolvedValueOnce([[mockUser], []] as any);

      const res = await request(app)
        .get("/api/users/2")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe("Sarah Jenkins");
    });
  });

  describe("POST /api/users (Admin User Creation)", () => {
    it("should reject user creation with invalid role", async () => {
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Test User",
          email: "test@company.com",
          password: "Password123",
          role: "SUPERUSER",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Role must be EMPLOYEE or ADMIN");
    });

    it("should reject creation if email already exists with 409 Conflict", async () => {
      vi.spyOn(pool, "execute").mockResolvedValueOnce([[{ id: 2 }], []] as any);

      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Duplicate User",
          email: "sarah@company.com",
          password: "Password123",
          role: "EMPLOYEE",
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("Email already exists");
    });

    it("should create user and return 201 Created", async () => {
      vi.spyOn(pool, "execute")
        .mockResolvedValueOnce([[], []] as any) // check existing email
        .mockResolvedValueOnce([{ insertId: 5 }, []] as any); // insert user

      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "New Engineer",
          email: "engineer@company.com",
          password: "Password123",
          role: "EMPLOYEE",
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("User created");
      expect(res.body.user.email).toBe("engineer@company.com");
    });
  });

  describe("PUT /api/users/:id/role (Update User Role)", () => {
    it("should prevent an admin from removing their own admin role", async () => {
      const res = await request(app)
        .put("/api/users/1/role") // Admin user ID is 1
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "EMPLOYEE" });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("cannot remove your own admin role");
    });

    it("should allow admin to promote an employee to admin", async () => {
      const updatedUser = { ...mockUser, role: "ADMIN" };

      vi.spyOn(pool, "execute")
        .mockResolvedValueOnce([[mockUser], []] as any) // find user
        .mockResolvedValueOnce([{ affectedRows: 1 }, []] as any) // update role
        .mockResolvedValueOnce([[updatedUser], []] as any); // select updated user

      const res = await request(app)
        .put("/api/users/2/role")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "ADMIN" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Role updated");
      expect(res.body.user.role).toBe("ADMIN");
    });
  });
});
