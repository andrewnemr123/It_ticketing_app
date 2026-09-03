import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  JwtPayload,
} from "../types";

interface TicketRow extends RowDataPacket {
  id: number;
  ticket_number: string | null;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  creator_id: number;
  assigned_to_id: number | null;
  created_at: Date;
  updated_at: Date;
  creator_name?: string;
  assignee_name?: string | null;
}

const TICKET_SELECT = `
  SELECT
    t.id, t.ticket_number, t.title, t.description, t.category,
    t.priority, t.status, t.creator_id, t.assigned_to_id,
    t.created_at, t.updated_at,
    creator.name AS creator_name,
    assignee.name AS assignee_name
  FROM ticket t
  JOIN \`user\` creator ON creator.id = t.creator_id
  LEFT JOIN \`user\` assignee ON assignee.id = t.assigned_to_id
`;

async function getTicketById(id: number): Promise<TicketRow | null> {
  const [rows] = await pool.execute<TicketRow[]>(
    `${TICKET_SELECT} WHERE t.id = ?`,
    [id]
  );
  return rows[0] || null;
}

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "Invalid id");
  }
  return id;
}

/** Employees may only touch their own tickets; admins may touch any. */
function assertCanAccess(user: JwtPayload, ticket: TicketRow): void {
  if (user.role === "ADMIN") return;
  if (ticket.creator_id !== user.userId) {
    // 404 (not 403) so employees cannot probe which ticket ids exist.
    throw new ApiError(404, "Ticket not found");
  }
}

async function addEvent(params: {
  ticketId: number;
  userId: number;
  eventType:
    | "COMMENT"
    | "INTERNAL_NOTE"
    | "STATUS_CHANGE"
    | "ASSIGNMENT_CHANGE"
    | "PRIORITY_CHANGE";
  oldValue?: string | null;
  newValue?: string | null;
  commentText?: string | null;
  isInternal?: boolean;
}): Promise<void> {
  await pool.execute(
    `INSERT INTO ticket_event
       (ticket_id, user_id, event_type, old_value, new_value, comment_text, is_internal)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      params.ticketId,
      params.userId,
      params.eventType,
      params.oldValue ?? null,
      params.newValue ?? null,
      params.commentText ?? null,
      params.isInternal ? 1 : 0,
    ]
  );
}

// ---------------------------------------------------------------------------
// GET /api/tickets
// ---------------------------------------------------------------------------
export const listTickets = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const where: string[] = [];
  const values: unknown[] = [];

  if (user.role !== "ADMIN") {
    where.push("t.creator_id = ?");
    values.push(user.userId);
  }

  const { status, priority, category } = req.query;
  if (typeof status === "string" && TICKET_STATUSES.includes(status as never)) {
    where.push("t.status = ?");
    values.push(status);
  }
  if (
    typeof priority === "string" &&
    TICKET_PRIORITIES.includes(priority as never)
  ) {
    where.push("t.priority = ?");
    values.push(priority);
  }
  if (
    typeof category === "string" &&
    TICKET_CATEGORIES.includes(category as never)
  ) {
    where.push("t.category = ?");
    values.push(category);
  }

  const sql =
    TICKET_SELECT +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    " ORDER BY t.created_at DESC";

  const [rows] = await pool.query<TicketRow[]>(sql, values);
  res.json({ tickets: rows });
});

// ---------------------------------------------------------------------------
// GET /api/tickets/:id
// ---------------------------------------------------------------------------
export const getTicket = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const ticket = await getTicketById(id);
  if (!ticket) throw new ApiError(404, "Ticket not found");
  assertCanAccess(req.user!, ticket);
  res.json({ ticket });
});

// ---------------------------------------------------------------------------
// POST /api/tickets
// ---------------------------------------------------------------------------
export const createTicket = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const title = String(req.body.title || "").trim();
  const description = String(req.body.description || "").trim();
  const category = String(req.body.category || "").trim();
  const priority = String(req.body.priority || "Medium").trim();

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }
  if (!TICKET_CATEGORIES.includes(category as never)) {
    throw new ApiError(400, "Invalid category");
  }
  if (!TICKET_PRIORITIES.includes(priority as never)) {
    throw new ApiError(400, "Invalid priority");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO ticket (title, description, category, priority, status, creator_id)
       VALUES (?, ?, ?, ?, 'New', ?)`,
      [title, description, category, priority, user.userId]
    );

    const newId = result.insertId;
    // Ticket number derived from the auto-increment id -> always unique,
    // no race condition between concurrent requests.
    const ticketNumber = `TICK-${1000 + newId}`;
    await conn.execute("UPDATE ticket SET ticket_number = ? WHERE id = ?", [
      ticketNumber,
      newId,
    ]);

    await conn.commit();
    conn.release();

    const ticket = await getTicketById(newId);
    res.status(201).json({ message: "Ticket created", ticket });
  } catch (err) {
    await conn.rollback();
    conn.release();
    throw err;
  }
});

// ---------------------------------------------------------------------------
// PUT /api/tickets/:id/status   (ADMIN)
// ---------------------------------------------------------------------------
export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const status = String(req.body.status || "").trim();
  if (!TICKET_STATUSES.includes(status as never)) {
    throw new ApiError(400, "Invalid status");
  }

  const ticket = await getTicketById(id);
  if (!ticket) throw new ApiError(404, "Ticket not found");

  if (ticket.status !== status) {
    await pool.execute("UPDATE ticket SET status = ? WHERE id = ?", [status, id]);
    await addEvent({
      ticketId: id,
      userId: req.user!.userId,
      eventType: "STATUS_CHANGE",
      oldValue: ticket.status,
      newValue: status,
    });
  }

  res.json({ message: "Status updated", ticket: await getTicketById(id) });
});

// ---------------------------------------------------------------------------
// PUT /api/tickets/:id/priority   (ADMIN)
// ---------------------------------------------------------------------------
export const updatePriority = asyncHandler(
  async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    const priority = String(req.body.priority || "").trim();
    if (!TICKET_PRIORITIES.includes(priority as never)) {
      throw new ApiError(400, "Invalid priority");
    }

    const ticket = await getTicketById(id);
    if (!ticket) throw new ApiError(404, "Ticket not found");

    if (ticket.priority !== priority) {
      await pool.execute("UPDATE ticket SET priority = ? WHERE id = ?", [
        priority,
        id,
      ]);
      await addEvent({
        ticketId: id,
        userId: req.user!.userId,
        eventType: "PRIORITY_CHANGE",
        oldValue: ticket.priority,
        newValue: priority,
      });
    }

    res.json({ message: "Priority updated", ticket: await getTicketById(id) });
  }
);

// ---------------------------------------------------------------------------
// PUT /api/tickets/:id/assign   (ADMIN)  -> assignee must be an ADMIN, or null
// ---------------------------------------------------------------------------
export const assignTicket = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const raw = req.body.assigned_to_id;
  const assigneeId =
    raw === null || raw === undefined || raw === "" ? null : Number(raw);

  if (assigneeId !== null && (!Number.isInteger(assigneeId) || assigneeId <= 0)) {
    throw new ApiError(400, "Invalid assigned_to_id");
  }

  const ticket = await getTicketById(id);
  if (!ticket) throw new ApiError(404, "Ticket not found");

  let newName: string | null = null;
  if (assigneeId !== null) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, name, role FROM `user` WHERE id = ?",
      [assigneeId]
    );
    if (rows.length === 0) throw new ApiError(404, "Assignee not found");
    if (rows[0].role !== "ADMIN") {
      throw new ApiError(400, "Tickets can only be assigned to an ADMIN");
    }
    newName = rows[0].name as string;
  }

  if (ticket.assigned_to_id !== assigneeId) {
    await pool.execute("UPDATE ticket SET assigned_to_id = ? WHERE id = ?", [
      assigneeId,
      id,
    ]);
    await addEvent({
      ticketId: id,
      userId: req.user!.userId,
      eventType: "ASSIGNMENT_CHANGE",
      oldValue: ticket.assignee_name ?? "Unassigned",
      newValue: newName ?? "Unassigned",
    });
  }

  res.json({ message: "Assignment updated", ticket: await getTicketById(id) });
});

// ---------------------------------------------------------------------------
// GET /api/tickets/:id/events
// ---------------------------------------------------------------------------
export const listEvents = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const ticket = await getTicketById(id);
  if (!ticket) throw new ApiError(404, "Ticket not found");
  assertCanAccess(req.user!, ticket);

  const hideInternal = req.user!.role !== "ADMIN";
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT e.id, e.ticket_id, e.user_id, e.event_type, e.old_value, e.new_value,
            e.comment_text, e.is_internal, e.created_at, u.name AS user_name
     FROM ticket_event e
     JOIN \`user\` u ON u.id = e.user_id
     WHERE e.ticket_id = ?
     ${hideInternal ? "AND e.is_internal = 0 AND e.event_type <> 'INTERNAL_NOTE'" : ""}
     ORDER BY e.created_at ASC, e.id ASC`,
    [id]
  );

  res.json({ events: rows });
});

// ---------------------------------------------------------------------------
// POST /api/tickets/:id/comments
// ---------------------------------------------------------------------------
export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const user = req.user!;
  const text = String(req.body.comment_text || "").trim();
  const wantsInternal = req.body.is_internal === true || req.body.is_internal === "true";

  if (!text) throw new ApiError(400, "comment_text is required");

  const ticket = await getTicketById(id);
  if (!ticket) throw new ApiError(404, "Ticket not found");
  assertCanAccess(user, ticket);

  // Only admins can create internal notes.
  const isInternal = wantsInternal && user.role === "ADMIN";

  await addEvent({
    ticketId: id,
    userId: user.userId,
    eventType: isInternal ? "INTERNAL_NOTE" : "COMMENT",
    commentText: text,
    isInternal,
  });

  res.status(201).json({ message: "Comment added" });
});

// ---------------------------------------------------------------------------
// POST /api/tickets/:id/attachments   (multipart/form-data, field: "file")
// ---------------------------------------------------------------------------
export const addAttachment = asyncHandler(
  async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    const user = req.user!;

    // multer has already saved the file to disk by this point; if any check
    // below fails, remove that orphaned file before responding.
    const cleanup = () => {
      if (req.file?.path) fs.promises.unlink(req.file.path).catch(() => undefined);
    };

    let ticket: TicketRow | null;
    try {
      ticket = await getTicketById(id);
      if (!ticket) throw new ApiError(404, "Ticket not found");
      assertCanAccess(user, ticket);
      if (!req.file) throw new ApiError(400, "No file uploaded (field name: file)");
    } catch (err) {
      cleanup();
      throw err;
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO ticket_attachment (ticket_id, user_id, filename, filepath, filesize)
       VALUES (?, ?, ?, ?, ?)`,
      [id, user.userId, req.file.originalname, req.file.filename, req.file.size]
    );

    res.status(201).json({
      message: "Attachment uploaded",
      attachment: {
        id: result.insertId,
        ticket_id: id,
        filename: req.file.originalname,
        filesize: req.file.size,
      },
    });
  }
);

// ---------------------------------------------------------------------------
// GET /api/tickets/:id/attachments
// ---------------------------------------------------------------------------
export const listAttachments = asyncHandler(
  async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    const ticket = await getTicketById(id);
    if (!ticket) throw new ApiError(404, "Ticket not found");
    assertCanAccess(req.user!, ticket);

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT a.id, a.ticket_id, a.user_id, a.filename, a.filesize, a.created_at,
              u.name AS user_name
       FROM ticket_attachment a
       JOIN \`user\` u ON u.id = a.user_id
       WHERE a.ticket_id = ?
       ORDER BY a.created_at ASC`,
      [id]
    );
    res.json({ attachments: rows });
  }
);

// ---------------------------------------------------------------------------
// GET /api/tickets/:id/attachments/:attachmentId/download
// ---------------------------------------------------------------------------
export const downloadAttachment = asyncHandler(
  async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    const attachmentId = parseId(req.params.attachmentId);

    const ticket = await getTicketById(id);
    if (!ticket) throw new ApiError(404, "Ticket not found");
    assertCanAccess(req.user!, ticket);

    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT filename, filepath FROM ticket_attachment WHERE id = ? AND ticket_id = ?",
      [attachmentId, id]
    );
    if (rows.length === 0) throw new ApiError(404, "Attachment not found");

    const uploadDir = path.resolve(
      process.cwd(),
      process.env.UPLOAD_DIR || "uploads"
    );
    res.download(path.join(uploadDir, rows[0].filepath as string), rows[0].filename as string);
  }
);
