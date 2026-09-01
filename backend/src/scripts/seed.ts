/**
 * Load demo data with properly bcrypt-hashed passwords.
 *
 *   npm run seed
 *
 * Demo accounts (all password: "Password123"):
 *   admin@company.com     ADMIN
 *   sarah@company.com     EMPLOYEE
 *   mike@company.com      EMPLOYEE
 *
 * Safe to run more than once - existing emails are skipped.
 */
import bcrypt from "bcryptjs";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/db";

const DEMO_PASSWORD = "Password123";

const demoUsers = [
  { name: "System Admin", email: "admin@company.com", role: "ADMIN" as const },
  { name: "Sarah Jenkins", email: "sarah@company.com", role: "EMPLOYEE" as const },
  { name: "Mike Chen", email: "mike@company.com", role: "EMPLOYEE" as const },
];

async function getOrCreateUser(
  name: string,
  email: string,
  role: "ADMIN" | "EMPLOYEE",
  hash: string
): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT id FROM `user` WHERE email = ?",
    [email]
  );
  if (rows.length > 0) return rows[0].id as number;

  const [result] = await pool.execute<ResultSetHeader>(
    "INSERT INTO `user` (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
    [name, email, hash, role]
  );
  return result.insertId;
}

async function createTicket(params: {
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  creatorId: number;
  assignedToId: number | null;
}): Promise<void> {
  const [existing] = await pool.execute<RowDataPacket[]>(
    "SELECT id FROM ticket WHERE title = ? AND creator_id = ?",
    [params.title, params.creatorId]
  );
  if (existing.length > 0) return;

  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO ticket
       (title, description, category, priority, status, creator_id, assigned_to_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      params.title,
      params.description,
      params.category,
      params.priority,
      params.status,
      params.creatorId,
      params.assignedToId,
    ]
  );
  await pool.execute("UPDATE ticket SET ticket_number = ? WHERE id = ?", [
    `TICK-${1000 + result.insertId}`,
    result.insertId,
  ]);
}

async function main(): Promise<void> {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const ids: Record<string, number> = {};
  for (const u of demoUsers) {
    ids[u.email] = await getOrCreateUser(u.name, u.email, u.role, hash);
  }
  console.log("Demo users ready.");

  await createTicket({
    title: "VPN connection dropping intermittently",
    description:
      "When connecting to remote servers, the VPN disconnects roughly every 15 minutes.",
    category: "Network",
    priority: "High",
    status: "In Progress",
    creatorId: ids["sarah@company.com"],
    assignedToId: ids["admin@company.com"],
  });
  await createTicket({
    title: "Request for JetBrains IntelliJ license",
    description: "New developer onboarding requires an enterprise IDE license.",
    category: "Software",
    priority: "Medium",
    status: "Open",
    creatorId: ids["sarah@company.com"],
    assignedToId: null,
  });
  await createTicket({
    title: "Second monitor shows no display over HDMI",
    description: "Monitor stays black after the latest display driver update.",
    category: "Hardware",
    priority: "Low",
    status: "Resolved",
    creatorId: ids["mike@company.com"],
    assignedToId: ids["admin@company.com"],
  });
  console.log("Demo tickets ready.");

  await pool.end();
  console.log(`\nDone. Log in with any demo email and password "${DEMO_PASSWORD}".`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
