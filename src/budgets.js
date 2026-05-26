/**
 * Monthly budgets — PostgreSQL.
 */

const { pool } = require("./db/pool");

async function setMonthlyBudget(monthKey, amount) {
  const trimmed = String(monthKey).trim();
  if (!/^\d{4}-\d{2}$/.test(trimmed)) {
    const err = new Error("month must be YYYY-MM");
    err.code = "INVALID_MONTH";
    throw err;
  }

  const parsed = Number(amount);
  if (Number.isNaN(parsed) || parsed <= 0) {
    const err = new Error("amount must be a positive number");
    err.code = "INVALID_AMOUNT";
    throw err;
  }

  const rounded = Math.round(parsed * 100) / 100;

  await pool.query(
    `INSERT INTO monthly_budgets (month_key, amount)
     VALUES ($1, $2)
     ON CONFLICT (month_key)
     DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()`,
    [trimmed, rounded]
  );

  return getMonthlyBudget(trimmed);
}

async function getMonthlyBudget(monthKey) {
  const result = await pool.query(
    "SELECT amount FROM monthly_budgets WHERE month_key = $1",
    [monthKey]
  );
  if (result.rowCount === 0) return null;
  return Number(result.rows[0].amount);
}

async function getBudgetStatus(monthKey, spendingTotal) {
  const budgetAmount = await getMonthlyBudget(monthKey);

  if (budgetAmount === null) {
    return { set: false, month: monthKey };
  }

  const total = Number(spendingTotal) || 0;
  const remaining = Math.round((budgetAmount - total) * 100) / 100;
  const percentUsed =
    budgetAmount > 0
      ? Math.round((total / budgetAmount) * 1000) / 10
      : 0;

  return {
    set: true,
    month: monthKey,
    amount: budgetAmount,
    spent: Math.round(total * 100) / 100,
    remaining,
    percentUsed,
    overBudget: remaining < 0,
  };
}

module.exports = {
  setMonthlyBudget,
  getMonthlyBudget,
  getBudgetStatus,
};
