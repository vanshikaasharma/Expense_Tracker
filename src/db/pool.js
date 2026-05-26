/**
 * PostgreSQL connection pool (Supabase or local Postgres).
 * Set DATABASE_URL in .env — see .env.example
 */

const { Pool } = require("pg");

function buildPoolConfig() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is missing. Copy .env.example to .env and add your Supabase connection string."
    );
  }

  const config = { connectionString };

  if (process.env.PGSSLMODE !== "disable") {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
}

const pool = new Pool(buildPoolConfig());

pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err);
});

/** Quick check that the database is reachable. */
async function checkConnection() {
  const result = await pool.query("SELECT 1 AS ok");
  return result.rows[0]?.ok === 1;
}

module.exports = { pool, checkConnection };
