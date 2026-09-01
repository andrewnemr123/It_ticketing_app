/**
 * Create (or promote) the first ADMIN account.
 *
 *   npm run create-admin -- "Admin Name" admin@example.com "StrongPass123"
 *
 * If the email already exists the account is promoted to ADMIN and, when a
 * password is supplied, its password is reset.
 */
import bcrypt from "bcryptjs";
import readline from "readline";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "../config/db";

function ask(question: string, mask = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
    if (mask) {
      const rlAny = rl as unknown as { _writeToOutput: (s: string) => void };
      rlAny._writeToOutput = () => {};
    }
  });
}

async function main(): Promise<void> {
  const [argName, argEmail, argPassword] = process.argv.slice(2);

  const name = argName || (await ask("Name: "));
  const email = (argEmail || (await ask("Email: "))).toLowerCase();
  const password = argPassword || (await ask("Password (min 8 chars): "));

  if (!name || !email || !password) {
    console.error("Name, email and password are all required.");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);

  const [existing] = await pool.execute<RowDataPacket[]>(
    "SELECT id FROM `user` WHERE email = ?",
    [email]
  );

  if (existing.length > 0) {
    await pool.execute(
      "UPDATE `user` SET role = 'ADMIN', password_hash = ?, name = ? WHERE email = ?",
      [hash, name, email]
    );
    console.log(`Existing user ${email} promoted to ADMIN and password reset.`);
  } else {
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT INTO `user` (name, email, password_hash, role) VALUES (?, ?, ?, 'ADMIN')",
      [name, email, hash]
    );
    console.log(`ADMIN created: ${email} (id ${result.insertId})`);
  }

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
