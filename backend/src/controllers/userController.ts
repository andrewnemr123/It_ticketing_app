import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Role } from "../types";

const PUBLIC_USER_COLUMNS = "id, name, email, role, created_at";

// ---------------------------------------------------------------------------
// GET /api/users   (ADMIN)
// ---------------------------------------------------------------------------
export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${PUBLIC_USER_COLUMNS} FROM \`user\` ORDER BY created_at DESC`
  );
  res.json({ users: rows });
});

// ---------------------------------------------------------------------------
// GET /api/users/:id   (ADMIN)
// ---------------------------------------------------------------------------
export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "Invalid id");

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT ${PUBLIC_USER_COLUMNS} FROM \`user\` WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) throw new ApiError(404, "User not found");
  res.json({ user: rows[0] });
});

// ---------------------------------------------------------------------------
// POST /api/users   (ADMIN)  -> can create EMPLOYEE or ADMIN
// ---------------------------------------------------------------------------
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const role = String(req.body.role || "EMPLOYEE").trim().toUpperCase() as Role;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }
  if (password.length < 8) {
    throw new ApiError(400, "Password must contain at least 8 characters");
  }
  if (role !== "EMPLOYEE" && role !== "ADMIN") {
    throw new ApiError(400, "Role must be EMPLOYEE or ADMIN");
  }

  const [existing] = await pool.execute<RowDataPacket[]>(
    "SELECT id FROM `user` WHERE email = ?",
    [email]
  );
  if (existing.length > 0) throw new ApiError(409, "Email already exists");

  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.execute<ResultSetHeader>(
    "INSERT INTO `user` (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
    [name, email, passwordHash, role]
  );

  res.status(201).json({
    message: "User created",
    user: { id: result.insertId, name, email, role },
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/users/:id   (ADMIN)
// ---------------------------------------------------------------------------
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "Invalid id");
  }

  // Prevent an admin from deleting their own account.
  if (id === req.user!.userId) {
    throw new ApiError(400, "You cannot delete your own account");
  }

  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT id FROM `user` WHERE id = ?",
    [id]
  );

  if (rows.length === 0) {
    throw new ApiError(404, "User not found");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Unassign tickets assigned to this user
    await conn.execute(
      "UPDATE ticket SET assigned_to_id = NULL WHERE assigned_to_id = ?",
      [id]
    );

    // 2. Detach creator on tickets
    await conn.execute(
      "UPDATE ticket SET creator_id = NULL WHERE creator_id = ?",
      [id]
    );

    // 3. Remove ticket attachments created by this user
    await conn.execute(
      "DELETE FROM ticket_attachment WHERE user_id = ?",
      [id]
    );

    // 4. Remove ticket events created by this user
    await conn.execute(
      "DELETE FROM ticket_event WHERE user_id = ?",
      [id]
    );

    // 5. Clean up password reset tokens if present
    try {
      await conn.execute(
        "DELETE FROM password_reset_tokens WHERE user_id = ?",
        [id]
      );
    } catch {
      // ignore if table does not exist or user has no tokens
    }

    // 6. Delete the user
    await conn.execute("DELETE FROM `user` WHERE id = ?", [id]);

    await conn.commit();
    res.json({ message: "User deleted" });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});


// ---------------------------------------------------------------------------
// PUT /api/users/:id/role   (ADMIN)
// ---------------------------------------------------------------------------
export const updateUserRole = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, "Invalid id");

    const role = String(req.body.role || "").trim().toUpperCase() as Role;
    if (role !== "EMPLOYEE" && role !== "ADMIN") {
      throw new ApiError(400, "Role must be EMPLOYEE or ADMIN");
    }

    if (id === req.user!.userId && role !== "ADMIN") {
      throw new ApiError(400, "You cannot remove your own admin role");
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM `user` WHERE id = ?",
      [id]
    );
    if (rows.length === 0) throw new ApiError(404, "User not found");

    await pool.execute("UPDATE `user` SET role = ? WHERE id = ?", [role, id]);

    const [updated] = await pool.execute<RowDataPacket[]>(
      `SELECT ${PUBLIC_USER_COLUMNS} FROM \`user\` WHERE id = ?`,
      [id]
    );
    res.json({ message: "Role updated", user: updated[0] });
  }
);
