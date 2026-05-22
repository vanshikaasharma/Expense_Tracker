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
    throw new Error(data.error || `Request failed (${res.status})`);
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
