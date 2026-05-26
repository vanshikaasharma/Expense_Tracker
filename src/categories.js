/**
 * Categories (tags) — stored in PostgreSQL.
 */

const { pool } = require("./db/pool");
const { mapCategory } = require("./db/mappers");

function normalizeName(name) {
  return String(name).trim();
}

async function findCategoryById(id) {
  const result = await pool.query("SELECT * FROM categories WHERE id = $1", [
    Number(id),
  ]);
  return mapCategory(result.rows[0]);
}

async function findCategoryByName(name) {
  const normalized = normalizeName(name).toLowerCase();
  if (!normalized) return null;

  const result = await pool.query(
    "SELECT * FROM categories WHERE LOWER(name) = $1",
    [normalized]
  );
  return mapCategory(result.rows[0]);
}

async function createCategory(name) {
  const trimmed = normalizeName(name);
  if (!trimmed) {
    const err = new Error("Category name cannot be empty");
    err.code = "EMPTY_NAME";
    throw err;
  }

  const existing = await findCategoryByName(trimmed);
  if (existing) {
    return { category: existing, created: false };
  }

  const result = await pool.query(
    "INSERT INTO categories (name) VALUES ($1) RETURNING *",
    [trimmed]
  );
  return { category: mapCategory(result.rows[0]), created: true };
}

async function listCategories() {
  const result = await pool.query(
    "SELECT * FROM categories ORDER BY LOWER(name) ASC"
  );
  return result.rows.map(mapCategory);
}

async function resolveCategory({ categoryId, categoryName }) {
  const hasId =
    categoryId !== undefined && categoryId !== null && categoryId !== "";
  const hasName =
    categoryName !== undefined && categoryName !== null && categoryName !== "";

  if (hasId) {
    const category = await findCategoryById(categoryId);
    if (!category) {
      const err = new Error(`Category with id ${categoryId} not found`);
      err.code = "NOT_FOUND";
      throw err;
    }
    return category;
  }

  if (hasName) {
    const { category } = await createCategory(categoryName);
    return category;
  }

  return null;
}

module.exports = {
  createCategory,
  listCategories,
  findCategoryById,
  findCategoryByName,
  resolveCategory,
};
