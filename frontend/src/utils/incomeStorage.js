/** Browser fallback when income API is unavailable. */

const INCOME_PREFIX = "expense-tracker-income-";
const GOAL_PREFIX = "expense-tracker-savings-goal-";

export function getLocalIncomeAmount(monthKey) {
  const raw = localStorage.getItem(`${INCOME_PREFIX}${monthKey}`);
  if (raw == null) return null;
  const amount = Number(raw);
  return Number.isNaN(amount) || amount <= 0 ? null : amount;
}

export function setLocalIncomeAmount(monthKey, amount) {
  localStorage.setItem(`${INCOME_PREFIX}${monthKey}`, String(amount));
}

export function getLocalSavingsGoal(monthKey) {
  const raw = localStorage.getItem(`${GOAL_PREFIX}${monthKey}`);
  if (raw == null) return null;
  const amount = Number(raw);
  return Number.isNaN(amount) || amount <= 0 ? null : amount;
}

export function setLocalSavingsGoal(monthKey, amount) {
  localStorage.setItem(`${GOAL_PREFIX}${monthKey}`, String(amount));
}

export function computeSavingsStatus(monthKey, incomeAmount, spendingTotal, goalAmount) {
  const spent = Number(spendingTotal) || 0;
  const amount = Math.round((incomeAmount - spent) * 100) / 100;

  const result = {
    set: true,
    month: monthKey,
    amount,
    income: incomeAmount,
    spent: Math.round(spent * 100) / 100,
    formula: "income - spending",
    overIncome: amount < 0,
    localOnly: true,
  };

  if (goalAmount != null && goalAmount > 0) {
    result.goal = {
      set: true,
      amount: goalAmount,
      percentOfGoal: Math.round((amount / goalAmount) * 1000) / 10,
    };
  } else {
    result.goal = { set: false };
  }

  return result;
}

export function mergeSavingsWithLocal(monthKey, apiSavings, spendingTotal) {
  if (apiSavings?.set) return apiSavings;

  const income = getLocalIncomeAmount(monthKey);
  if (income == null) {
    return apiSavings ?? { set: false, month: monthKey, formula: "income - spending" };
  }

  return computeSavingsStatus(
    monthKey,
    income,
    spendingTotal,
    getLocalSavingsGoal(monthKey)
  );
}
