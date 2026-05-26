/**
 * Applies db/schema.sql once (tracked in schema_migrations).
 * Runs automatically on npm start and npm run migrate.
 */

const fs = require("fs");
const path = require("path");
const { pool } = require("./pool");

const MIGRATION_ID = "001_initial_schema";
const SCHEMA_PATH = path.join(__dirname, "../../db/schema.sql");

async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const existing = await pool.query(
    "SELECT id FROM schema_migrations WHERE id = $1",
    [MIGRATION_ID]
  );

  if (existing.rowCount > 0) {
    return { applied: false, id: MIGRATION_ID };
  }

  const sql = fs.readFileSync(SCHEMA_PATH, "utf8");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query(
      "INSERT INTO schema_migrations (id) VALUES ($1)",
      [MIGRATION_ID]
    );
    await client.query("COMMIT");
    console.log(`Database migration applied: ${MIGRATION_ID}`);
    return { applied: true, id: MIGRATION_ID };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { runMigrations };
