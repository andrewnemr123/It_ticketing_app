import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { JwtPayload, Role } from "../types";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  created_at: Date;
}

function signToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET || "default_jwt_secret_key_it_ticketing";
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  } as jwt.SignOptions);
}


// ---------------------------------------------------------------------------
// POST /api/auth/register  -> always creates an EMPLOYEE
// ---------------------------------------------------------------------------
export const register = asyncHandler(async (req: Request, res: Response) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }
  if (password.length < 8) {
    throw new ApiError(400, "Password must contain at least 8 characters");
  }

  const [existing] = await pool.execute<UserRow[]>(
    "SELECT id FROM `user` WHERE email = ?",
    [email]
  );
  if (existing.length > 0) {
    throw new ApiError(409, "Email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Public registration is hard-coded to EMPLOYEE. Role from the body is ignored.
  const [result] = await pool.execute<ResultSetHeader>(
    "INSERT INTO `user` (name, email, password_hash, role) VALUES (?, ?, ?, 'EMPLOYEE')",
    [name, email, passwordHash]
  );

  const user = {
    id: result.insertId,
    name,
    email,
    role: "EMPLOYEE" as Role,
  };

  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  res.status(201).json({ message: "User created successfully", token, user });
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
export const login = asyncHandler(async (req: Request, res: Response) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const [users] = await pool.execute<UserRow[]>(
    "SELECT id, name, email, password_hash, role FROM `user` WHERE email = ?",
    [email]
  );

  if (users.length === 0) {
    throw new ApiError(401, "Invalid email or password");
  }

  const user = users[0];
  const passwordValid = await bcrypt.compare(password, user.password_hash);
  if (!passwordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(200).json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const [users] = await pool.execute<UserRow[]>(
    "SELECT id, name, email, role, created_at FROM `user` WHERE id = ?",
    [req.user!.userId]
  );

  if (users.length === 0) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({ user: users[0] });
});
