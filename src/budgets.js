/**
 * Monthly budgets — one total budget per month (YYYY-MM).
 * Remaining = budget - total spending for that month.
 */

const budgets = {};

/** Save or update the budget for a month. */
function setMonthlyBudget(monthKey, amount) {
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

  budgets[trimmed] = Math.round(parsed * 100) / 100;
  return getMonthlyBudget(trimmed);
}

/** Get budget for a month, or null if not set. */
function getMonthlyBudget(monthKey) {
  const value = budgets[monthKey];
  return value === undefined ? null : value;
}

/**
 * Compare budget to spending for the month.
 * Returns { set: false } if no budget saved yet.
 */
function getBudgetStatus(monthKey, spendingTotal) {
  const budgetAmount = getMonthlyBudget(monthKey);

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
