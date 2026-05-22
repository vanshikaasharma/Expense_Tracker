// Empty string = same origin (5173); Vite proxies /api → localhost:3000
const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
  } catch {
    throw new Error(
      "Cannot reach the API. In a terminal, run: npm start (from the project root, not frontend/)."
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const needsRestart =
      res.status === 404 &&
      (path.includes("/spending/") ||
        path.includes("/budgets") ||
        path.includes("/income"));
    const hint = needsRestart
      ? " — restart API: npm start (from project root)"
      : "";
    throw new Error(
      (data.error || `Request failed (${res.status})`) + hint
    );
  }

  return data;
}

export function getExpenses(categoryId) {
  const query = categoryId ? `?categoryId=${categoryId}` : "";
  return request(`/api/expenses${query}`);
}

export function getExpense(id) {
  return request(`/api/expenses/${id}`);
}

export function createExpense(body) {
  return request("/api/expenses", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateExpense(id, body) {
  return request(`/api/expenses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteExpense(id) {
  return request(`/api/expenses/${id}`, { method: "DELETE" });
}

export function getCategories() {
  return request("/api/categories");
}

export function createCategory(name) {
  return request("/api/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

/** Total spending, by category, and remaining budget for a month. */
export function getSpendingSummary({ month, categoryId, expenseType } = {}) {
  const params = new URLSearchParams();
  if (month) params.set("month", month);
  if (categoryId) params.set("categoryId", categoryId);
  if (expenseType) params.set("expenseType", expenseType);
  const query = params.toString();
  return request(`/api/spending/summary${query ? `?${query}` : ""}`);
}

/** Set monthly budget (body: { month: "2026-05", amount: 2000 }). */
export function setMonthlyBudget({ month, amount }) {
  return request("/api/budgets", {
    method: "POST",
    body: JSON.stringify({ month, amount }),
  });
}

/** Set monthly income; optional savingsGoal for progress bar. */
export function setMonthlyIncome({ month, amount, savingsGoal }) {
  const body = { month, amount };
  if (savingsGoal !== undefined && savingsGoal !== "") {
    body.savingsGoal = savingsGoal;
  }
  return request("/api/income", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
