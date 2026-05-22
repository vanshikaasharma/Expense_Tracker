/** Browser fallback when the API has no budget routes yet. */

const KEY_PREFIX = "expense-tracker-budget-";

export function getLocalBudgetAmount(monthKey) {
  const raw = localStorage.getItem(`${KEY_PREFIX}${monthKey}`);
  if (raw == null) return null;
  const amount = Number(raw);
  return Number.isNaN(amount) || amount <= 0 ? null : amount;
}

export function setLocalBudgetAmount(monthKey, amount) {
  localStorage.setItem(`${KEY_PREFIX}${monthKey}`, String(amount));
}

export function computeBudgetStatus(monthKey, budgetAmount, spendingTotal) {
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
    localOnly: true,
  };
}

export function mergeBudgetWithLocal(monthKey, apiBudget, spendingTotal) {
  if (apiBudget?.set) return apiBudget;
  const local = getLocalBudgetAmount(monthKey);
  if (local == null) return apiBudget ?? { set: false, month: monthKey };
  return computeBudgetStatus(monthKey, local, spendingTotal);
}
