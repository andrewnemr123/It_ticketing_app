/**
 * Create the database and all tables from database/schema.sql.
 * Uses the DB_* values in .env (but connects WITHOUT selecting a database,
 * since schema.sql creates it).
 *
 *   npm run db:init
 */
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function main(): Promise<void> {
  const schemaPath = path.resolve(process.cwd(), "database", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  await conn.query(sql);
  await conn.end();

  console.log(
    `Schema loaded into "${process.env.DB_NAME || "it_ticketing"}" on ` +
      `${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 3306}.`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to load schema:");
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
