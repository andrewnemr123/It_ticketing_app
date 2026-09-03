import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { authenticateToken } from "../src/middleware/authMiddleware";
import { Request, Response, NextFunction } from "express";

describe("Auth Middleware Unit Tests", () => {
  const JWT_SECRET = "test_jwt_secret_key_123";

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  it("should return 401 if Authorization header is missing", () => {
    const req = { headers: {} } as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Access token required" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if Authorization header format is invalid", () => {
    const req = { headers: { authorization: "Basic 12345" } } as unknown as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Access token required" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if token is expired or tampered", () => {
    const req = {
      headers: { authorization: "Bearer invalid.fake.token" },
    } as unknown as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should attach user payload to req.user and call next() for valid JWT token", () => {
    const payload = { userId: 42, email: "developer@company.com", role: "EMPLOYEE" as const };
    const token = jwt.sign(payload, JWT_SECRET);

    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    authenticateToken(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user?.userId).toBe(42);
    expect(req.user?.email).toBe("developer@company.com");
    expect(req.user?.role).toBe("EMPLOYEE");
    expect(next).toHaveBeenCalledTimes(1);
  });
});

