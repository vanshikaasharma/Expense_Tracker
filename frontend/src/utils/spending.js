/** Client-side spending math when the summary API is unavailable. */

function normalizeCostType(value) {
  if (!value || value === "") return "variable";
  return value;
}

function buildCategoryBreakdown(items, basisTotal) {
  const total =
    basisTotal !== undefined
      ? basisTotal
      : items.reduce((sum, e) => sum + Number(e.amount), 0);

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

  return [...byCategoryMap.values()]
    .map((row) => ({
      ...row,
      amount: Math.round(row.amount * 100) / 100,
      percent: total > 0 ? Math.round((row.amount / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function sumByCostType(items) {
  const totals = { fixed: 0, variable: 0 };
  for (const e of items) {
    const kind = normalizeCostType(e.costType);
    totals[kind] += Number(e.amount);
  }
  return {
    fixed: Math.round(totals.fixed * 100) / 100,
    variable: Math.round(totals.variable * 100) / 100,
  };
}

export function computeSpendingFromExpenses(expenses, monthKey) {
  const items = expenses.filter((e) => e.date && e.date.startsWith(monthKey));

  const total = items.reduce((sum, e) => sum + Number(e.amount), 0);
  const byCostType = sumByCostType(items);
  const fixedItems = items.filter(
    (e) => normalizeCostType(e.costType) === "fixed"
  );
  const variableItems = items.filter(
    (e) => normalizeCostType(e.costType) === "variable"
  );

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
    byCategory: buildCategoryBreakdown(items, total),
    byCategoryFixed: buildCategoryBreakdown(fixedItems, byCostType.fixed),
    byCategoryVariable: buildCategoryBreakdown(
      variableItems,
      byCostType.variable
    ),
    byCostType,
    byExpenseType: {
      individual: Math.round(byExpenseType.individual * 100) / 100,
      shared: Math.round(byExpenseType.shared * 100) / 100,
    },
  };
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Monday-based calendar week; weekOffset 0 = week containing anchorDate. */
export function getCalendarWeek(weekOffset = 0, anchorDate = new Date()) {
  const ref = new Date(anchorDate);
  ref.setHours(12, 0, 0, 0);
  const dow = ref.getDay();
  const toMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() + toMonday + weekOffset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const from = toDateString(monday);
  const to = toDateString(sunday);

  const fmt = { month: "short", day: "numeric", year: "numeric" };
  const label = `${monday.toLocaleDateString("default", fmt)} – ${sunday.toLocaleDateString("default", fmt)}`;

  return { from, to, label };
}

/** Pick anchor day for week navigation when a dashboard month is selected. */
export function weekAnchorForMonth(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const lastDay = new Date(y, m, 0).getDate();
  const monthStart = `${monthKey}-01`;
  const monthEnd = `${monthKey}-${String(lastDay).padStart(2, "0")}`;
  const todayStr = toDateString(today);

  if (todayStr >= monthStart && todayStr <= monthEnd) {
    return today;
  }
  if (todayStr > monthEnd) {
    return new Date(`${monthEnd}T12:00:00`);
  }
  return new Date(`${monthStart}T12:00:00`);
}

/** True if the week starting `from` is entirely after today. */
export function isWeekInFuture(from) {
  const todayStr = toDateString(new Date());
  return from > todayStr;
}

/** Spending per weekday for one calendar week (Mon–Sun). */
export function spendingForWeek(expenses, from, to) {
  const sums = [0, 0, 0, 0, 0, 0, 0];

  for (const e of expenses) {
    if (!e.date || e.date < from || e.date > to) continue;
    const day = new Date(`${e.date}T12:00:00`).getDay();
    const idx = day === 0 ? 6 : day - 1;
    sums[idx] += Number(e.amount);
  }

  return WEEKDAY_LABELS.map((label, i) => ({
    label,
    amount: Math.round(sums[i] * 100) / 100,
  }));
}

/** @deprecated Month-wide weekday totals; use spendingForWeek with navigation. */
export function spendingByWeekday(expenses, monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const from = `${monthKey}-01`;
  const to = `${monthKey}-${String(lastDay).padStart(2, "0")}`;
  return spendingForWeek(expenses, from, to);
}
