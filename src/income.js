/**
 * Monthly income and optional savings goals (Option A).
 * Savings this month = income − spending (from expenses).
 * Budget (separate module) = spending cap, not income.
 */

const monthlyIncome = {};
const savingsGoals = {};

function assertMonth(monthKey) {
  const trimmed = String(monthKey).trim();
  if (!/^\d{4}-\d{2}$/.test(trimmed)) {
    const err = new Error("month must be YYYY-MM");
    err.code = "INVALID_MONTH";
    throw err;
  }
  return trimmed;
}

function assertPositiveAmount(amount, label = "amount") {
  const parsed = Number(amount);
  if (Number.isNaN(parsed) || parsed <= 0) {
    const err = new Error(`${label} must be a positive number`);
    err.code = "INVALID_AMOUNT";
    throw err;
  }
  return Math.round(parsed * 100) / 100;
}

function setMonthlyIncome(monthKey, amount) {
  const month = assertMonth(monthKey);
  monthlyIncome[month] = assertPositiveAmount(amount, "income");
  return getMonthlyIncome(month);
}

function getMonthlyIncome(monthKey) {
  const value = monthlyIncome[monthKey];
  return value === undefined ? null : value;
}

function setSavingsGoal(monthKey, amount) {
  const month = assertMonth(monthKey);
  savingsGoals[month] = assertPositiveAmount(amount, "savingsGoal");
  return getSavingsGoal(month);
}

function clearSavingsGoal(monthKey) {
  delete savingsGoals[monthKey];
}

function getSavingsGoal(monthKey) {
  const value = savingsGoals[monthKey];
  return value === undefined ? null : value;
}

function getIncomeStatus(monthKey) {
  const amount = getMonthlyIncome(monthKey);
  if (amount === null) {
    return { set: false, month: monthKey };
  }
  return { set: true, month: monthKey, amount };
}

/**
 * Savings = income − spending. Optional goal for progress bar.
 */
function getSavingsStatus(monthKey, spendingTotal) {
  const incomeAmount = getMonthlyIncome(monthKey);

  if (incomeAmount === null) {
    return {
      set: false,
      month: monthKey,
      formula: "income - spending",
    };
  }

  const spent = Number(spendingTotal) || 0;
  const amount = Math.round((incomeAmount - spent) * 100) / 100;
  const goalAmount = getSavingsGoal(monthKey);

  const result = {
    set: true,
    month: monthKey,
    amount,
    income: incomeAmount,
    spent: Math.round(spent * 100) / 100,
    formula: "income - spending",
    overIncome: amount < 0,
  };

  if (goalAmount !== null) {
    result.goal = {
      set: true,
      amount: goalAmount,
      percentOfGoal:
        goalAmount > 0
          ? Math.round((amount / goalAmount) * 1000) / 10
          : 0,
    };
  } else {
    result.goal = { set: false };
  }

  return result;
}

module.exports = {
  setMonthlyIncome,
  getMonthlyIncome,
  setSavingsGoal,
  clearSavingsGoal,
  getSavingsGoal,
  getIncomeStatus,
  getSavingsStatus,
};
