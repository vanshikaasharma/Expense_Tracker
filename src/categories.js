/**
 * Categories (tags) — saved labels you can reuse on expenses.
 * e.g. Food, Transport, Rent
 */

const categories = [];

let nextCategoryId = 1;

/** Trims whitespace from a category/tag name. */
function normalizeName(name) {
  return String(name).trim();
}

/** Finds one category by its numeric id. Returns null if not found. */
function findCategoryById(id) {
  return categories.find((c) => c.id === Number(id)) || null;
}

/** Finds one category by name (case-insensitive). Returns null if not found. */
function findCategoryByName(name) {
  const normalized = normalizeName(name).toLowerCase();
  if (!normalized) return null;
  return (
    categories.find((c) => c.name.toLowerCase() === normalized) || null
  );
}

/**
 * Saves a new category, or returns the existing one if the name already exists.
 * Returns { category, created } where created is true only for a brand-new tag.
 */
function createCategory(name) {
  const trimmed = normalizeName(name);
  if (!trimmed) {
    const err = new Error("Category name cannot be empty");
    err.code = "EMPTY_NAME";
    throw err;
  }

  const existing = findCategoryByName(trimmed);
  if (existing) {
    return { category: existing, created: false };
  }

  const category = {
    id: nextCategoryId++,
    name: trimmed,
    createdAt: new Date().toISOString(),
  };

  categories.push(category);
  return { category, created: true };
}

/** Returns all categories sorted alphabetically by name. */
function listCategories() {
  return [...categories].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}

/**
 * Figures out which category to attach to an expense.
 * - categoryId → use that existing tag
 * - categoryName → use that tag, or create it if new
 * - neither → no category (null)
 */
function resolveCategory({ categoryId, categoryName }) {
  const hasId = categoryId !== undefined && categoryId !== null && categoryId !== "";
  const hasName =
    categoryName !== undefined && categoryName !== null && categoryName !== "";

  if (hasId) {
    const category = findCategoryById(categoryId);
    if (!category) {
      const err = new Error(`Category with id ${categoryId} not found`);
      err.code = "NOT_FOUND";
      throw err;
    }
    return category;
  }

  if (hasName) {
    return createCategory(categoryName).category;
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
