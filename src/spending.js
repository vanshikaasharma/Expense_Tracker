/**
 * Spending totals — every expense amount counts as spending.
 * Aggregates total and breakdown by category (e.g. Groceries).
 */

const { listExpenses } = require("./expenses");

/** Returns YYYY-MM for today. */
function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

/** First and last calendar day for a YYYY-MM month string. */
function monthToDateRange(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    from: `${monthKey}-01`,
    to: `${monthKey}-${String(lastDay).padStart(2, "0")}`,
    month: monthKey,
  };
}

/** Resolve query filters into a concrete from/to range and month label. */
function resolvePeriod({ month, from, to }) {
  if (from && to) {
    return { from, to, month: month || null };
  }

  const monthKey =
    month && /^\d{4}-\d{2}$/.test(month) ? month : currentMonthKey();
  const range = monthToDateRange(monthKey);
  return range;
}

/** Keep expenses whose date falls within from/to (inclusive). */
function filterByDateRange(expenseList, from, to) {
  return expenseList.filter((e) => e.date >= from && e.date <= to);
}

/**
 * Builds spending summary from expenses.
 * All expense rows count toward spending (individual + shared).
 */
function getSpendingSummary({ month, from, to, expenseType, categoryId } = {}) {
  const period = resolvePeriod({ month, from, to });

  let items = listExpenses({ categoryId, expenseType });
  items = filterByDateRange(items, period.from, period.to);

  const total = items.reduce((sum, e) => sum + Number(e.amount), 0);

  const byCategoryMap = new Map();
  for (const e of items) {
    const key = e.categoryId ?? "uncategorized";
    const name = e.categoryName || "Uncategorized";
    const existing = byCategoryMap.get(key) || {
      categoryId: e.categoryId,
      categoryName: name,
      amount: 0,
      count: 0,
    };
    existing.amount += Number(e.amount);
    existing.count += 1;
    byCategoryMap.set(key, existing);
  }

  const byCategory = [...byCategoryMap.values()]
    .map((row) => ({
      ...row,
      amount: Math.round(row.amount * 100) / 100,
      percent: total > 0 ? Math.round((row.amount / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const byExpenseType = { individual: 0, shared: 0 };
  for (const e of items) {
    if (byExpenseType[e.expenseType] !== undefined) {
      byExpenseType[e.expenseType] += Number(e.amount);
    }
  }
  byExpenseType.individual = Math.round(byExpenseType.individual * 100) / 100;
  byExpenseType.shared = Math.round(byExpenseType.shared * 100) / 100;

  return {
    total: Math.round(total * 100) / 100,
    transactionCount: items.length,
    period,
    byCategory,
    byExpenseType,
  };
}

module.exports = {
  getSpendingSummary,
  currentMonthKey,
};
