import { Request, Response } from "express";
import type { RowDataPacket } from "mysql2";
import pool from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { TICKET_CATEGORIES } from "../types";

// ---------------------------------------------------------------------------
// GET /api/reports/dashboard   (ADMIN)
// ---------------------------------------------------------------------------
export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  const [statusRows] = await pool.query<RowDataPacket[]>(
    "SELECT status, COUNT(*) AS count FROM ticket GROUP BY status"
  );
  const [priorityRows] = await pool.query<RowDataPacket[]>(
    "SELECT priority, COUNT(*) AS count FROM ticket GROUP BY priority"
  );
  const [categoryRows] = await pool.query<RowDataPacket[]>(
    "SELECT category, COUNT(*) AS count FROM ticket GROUP BY category"
  );
  const [[totalRow]] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM ticket"
  );

  const byStatus: Record<string, number> = {};
  for (const r of statusRows) byStatus[r.status as string] = Number(r.count);

  const byCategory: Record<string, number> = {};
  for (const c of TICKET_CATEGORIES) byCategory[c] = 0;
  for (const r of categoryRows) byCategory[r.category as string] = Number(r.count);

  const critical =
    priorityRows.find((r) => r.priority === "Critical")?.count ?? 0;

  const [recent] = await pool.query<RowDataPacket[]>(
    `SELECT t.id, t.ticket_number, t.title, t.category, t.priority, t.status,
            t.created_at, creator.name AS creator_name, assignee.name AS assignee_name
     FROM ticket t
     JOIN \`user\` creator ON creator.id = t.creator_id
     LEFT JOIN \`user\` assignee ON assignee.id = t.assigned_to_id
     ORDER BY t.created_at DESC
     LIMIT 5`
  );

  res.json({
    stats: {
      total: Number(totalRow.total),
      new: byStatus["New"] || 0,
      open: byStatus["Open"] || 0,
      inProgress: byStatus["In Progress"] || 0,
      waitingForUser: byStatus["Waiting for User"] || 0,
      resolved: byStatus["Resolved"] || 0,
      closed: byStatus["Closed"] || 0,
      critical: Number(critical),
    },
    byCategory,
    recentTickets: recent,
  });
});
