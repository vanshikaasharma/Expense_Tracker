/**
 * Expense storage — PostgreSQL via Supabase.
 */

const { resolveCategory } = require("./categories");
const { pool } = require("./db/pool");
const { mapExpense } = require("./db/mappers");
const { parseExpenseDate } = require("./date-utils");

const VALID_TYPES = ["shared", "individual"];
const VALID_COST_TYPES = ["fixed", "variable"];

const EXPENSE_SELECT = `
  SELECT
    e.id,
    e.amount,
    e.description,
    e.expense_type,
    e.cost_type,
    e.date,
    e.category_id,
    e.created_at,
    c.name AS category_name
  FROM expenses e
  LEFT JOIN categories c ON e.category_id = c.id
`;

function normalizeCostType(value) {
  if (value === undefined || value === null || value === "") {
    return "variable";
  }
  return value;
}

async function findExpenseById(id) {
  const result = await pool.query(`${EXPENSE_SELECT} WHERE e.id = $1`, [
    Number(id),
  ]);
  return mapExpense(result.rows[0]);
}

async function createExpense({
  amount,
  description,
  expenseType,
  costType,
  categoryId,
  categoryName,
  date,
}) {
  const parsed = parseExpenseDate(date);
  if (!parsed.ok) {
    const err = new Error(parsed.error);
    err.code = "INVALID_DATE";
    throw err;
  }

  const category = await resolveCategory({ categoryId, categoryName });

  const result = await pool.query(
    `INSERT INTO expenses
      (amount, description, expense_type, cost_type, date, category_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      amount,
      description || "",
      expenseType,
      normalizeCostType(costType),
      parsed.date,
      category ? category.id : null,
    ]
  );

  return findExpenseById(result.rows[0].id);
}

async function updateExpense(id, updates) {
  const existing = await findExpenseById(id);
  if (!existing) {
    const err = new Error(`Expense with id ${id} not found`);
    err.code = "NOT_FOUND";
    throw err;
  }

  const fields = [];
  const values = [];
  let param = 1;

  if (updates.amount !== undefined) {
    fields.push(`amount = $${param++}`);
    values.push(updates.amount);
  }

  if (updates.description !== undefined) {
    fields.push(`description = $${param++}`);
    values.push(updates.description);
  }

  if (updates.expenseType !== undefined) {
    fields.push(`expense_type = $${param++}`);
    values.push(updates.expenseType);
  }

  if (updates.costType !== undefined) {
    fields.push(`cost_type = $${param++}`);
    values.push(normalizeCostType(updates.costType));
  }

  if (updates.date !== undefined) {
    const parsed = parseExpenseDate(updates.date);
    if (!parsed.ok) {
      const err = new Error(parsed.error);
      err.code = "INVALID_DATE";
      throw err;
    }
    fields.push(`date = $${param++}`);
    values.push(parsed.date);
  }

  if (
    updates.categoryId !== undefined ||
    updates.categoryName !== undefined
  ) {
    const clearCategory =
      updates.categoryId === null && updates.categoryName === null;

    if (clearCategory) {
      fields.push(`category_id = $${param++}`);
      values.push(null);
    } else {
      const category = await resolveCategory({
        categoryId: updates.categoryId,
        categoryName: updates.categoryName,
      });
      fields.push(`category_id = $${param++}`);
      values.push(category ? category.id : null);
    }
  }

  if (fields.length === 0) {
    return existing;
  }

  values.push(Number(id));
  await pool.query(
    `UPDATE expenses SET ${fields.join(", ")} WHERE id = $${param}`,
    values
  );

  return findExpenseById(id);
}

async function deleteExpense(id) {
  const existing = await findExpenseById(id);
  if (!existing) {
    const err = new Error(`Expense with id ${id} not found`);
    err.code = "NOT_FOUND";
    throw err;
  }

  await pool.query("DELETE FROM expenses WHERE id = $1", [Number(id)]);
  return existing;
}

async function listExpenses({ categoryId, expenseType } = {}) {
  const conditions = [];
  const values = [];
  let param = 1;

  if (categoryId !== undefined && categoryId !== null && categoryId !== "") {
    conditions.push(`e.category_id = $${param++}`);
    values.push(Number(categoryId));
  }

  if (expenseType !== undefined && expenseType !== null && expenseType !== "") {
    conditions.push(`e.expense_type = $${param++}`);
    values.push(expenseType);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `${EXPENSE_SELECT} ${where} ORDER BY e.date DESC, e.id DESC`,
    values
  );

  return result.rows.map(mapExpense);
}

function isValidExpenseType(value) {
  return VALID_TYPES.includes(value);
}

function isValidCostType(value) {
  return VALID_COST_TYPES.includes(value);
}

module.exports = {
  createExpense,
  updateExpense,
  deleteExpense,
  findExpenseById,
  listExpenses,
  isValidExpenseType,
  isValidCostType,
  VALID_TYPES,
  VALID_COST_TYPES,
  normalizeCostType,
};
