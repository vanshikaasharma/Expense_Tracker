/** Map Postgres rows to the JSON shape the API already uses. */

function formatDate(value) {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function formatTimestamp(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function toNumber(value) {
  return value === null || value === undefined ? null : Number(value);
}

function mapCategory(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    createdAt: formatTimestamp(row.created_at),
  };
}

function mapExpense(row) {
  if (!row) return null;
  return {
    id: row.id,
    amount: toNumber(row.amount),
    description: row.description || "",
    expenseType: row.expense_type,
    costType: row.cost_type || "variable",
    date: formatDate(row.date),
    categoryId: row.category_id ?? null,
    categoryName: row.category_name ?? null,
    createdAt: formatTimestamp(row.created_at),
  };
}

module.exports = {
  mapCategory,
  mapExpense,
  formatDate,
};
