#!/usr/bin/env node
/**
 * Run database migrations (creates tables if needed).
 * Usage: npm run migrate
 */

require("dotenv").config();

const { runMigrations } = require("../src/db/migrate");
const { pool, checkConnection } = require("../src/db/pool");

async function main() {
  await runMigrations();
  const ok = await checkConnection();
  if (!ok) {
    throw new Error("Could not connect to the database");
  }
  console.log("Migrations complete. Database is ready.");
}

main()
  .catch((err) => {
    console.error("Migration failed:", err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
