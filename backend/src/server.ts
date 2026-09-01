import dotenv from "dotenv";
import app from "./app";
import { assertDbConnection } from "./config/db";

dotenv.config();

const PORT = Number(process.env.PORT || 5000);

async function start(): Promise<void> {
  try {
    await assertDbConnection();
    console.log("MySQL connection OK");
  } catch (err) {
    console.error("Could not connect to MySQL. Check your .env settings.");
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

start();
