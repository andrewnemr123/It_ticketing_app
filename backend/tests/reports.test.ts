import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app";
import pool from "../src/config/db";

describe("Report Controller & Metrics API Tests", () => {
  const JWT_SECRET = "test_jwt_secret_key_123";
  let adminToken: string;
  let employeeToken: string;

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

  it("should reject non-admin users with 403 Forbidden on report endpoints", async () => {
    const res = await request(app)
      .get("/api/reports/dashboard")
      .set("Authorization", `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
  });

  it("should allow admin to fetch helpdesk summary counts", async () => {
    const mockStatusCounts = [
      { status: "Open", count: 5 },
      { status: "Resolved", count: 12 },
    ];
    const mockPriorityCounts = [
      { priority: "High", count: 3 },
      { priority: "Low", count: 14 },
    ];

    vi.spyOn(pool, "query")
      .mockResolvedValueOnce([mockStatusCounts, []] as any)
      .mockResolvedValueOnce([mockPriorityCounts, []] as any);

    const res = await request(app)
      .get("/api/reports/dashboard")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });
});
