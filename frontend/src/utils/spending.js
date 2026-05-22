/** Client-side spending math when the summary API is unavailable. */

export function computeSpendingFromExpenses(expenses, monthKey) {
  const items = expenses.filter((e) => e.date && e.date.startsWith(monthKey));

  const total = items.reduce((sum, e) => sum + Number(e.amount), 0);

  const byCategoryMap = new Map();
  for (const e of items) {
    const key = e.categoryId ?? "uncategorized";
    const name = e.categoryName || "Uncategorized";
    const row = byCategoryMap.get(key) || {
      categoryId: e.categoryId,
      categoryName: name,
      amount: 0,
      count: 0,
    };
    row.amount += Number(e.amount);
    row.count += 1;
    byCategoryMap.set(key, row);
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

  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();

  return {
    total: Math.round(total * 100) / 100,
    transactionCount: items.length,
    period: {
      from: `${monthKey}-01`,
      to: `${monthKey}-${String(lastDay).padStart(2, "0")}`,
      month: monthKey,
    },
    byCategory,
    byExpenseType: {
      individual: Math.round(byExpenseType.individual * 100) / 100,
      shared: Math.round(byExpenseType.shared * 100) / 100,
    },
  };
}

export function spendingByWeekday(expenses, monthKey) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const sums = [0, 0, 0, 0, 0, 0, 0];

  for (const e of expenses) {
    if (!e.date?.startsWith(monthKey)) continue;
    const day = new Date(`${e.date}T12:00:00`).getDay();
    const idx = day === 0 ? 6 : day - 1;
    sums[idx] += Number(e.amount);
  }

  return labels.map((label, i) => ({ label, amount: sums[i] }));
}
