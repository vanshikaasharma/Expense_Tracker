/**
 * Entry point — starts the Express web server (HTTP API).
 * The frontend or tools like curl send requests to these routes.
 */

const express = require("express");
const {
  createCategory,
  listCategories,
} = require("./categories");
const {
  createExpense,
  updateExpense,
  deleteExpense,
  findExpenseById,
  listExpenses,
  isValidExpenseType,
  isValidCostType,
  VALID_TYPES,
  VALID_COST_TYPES,
} = require("./expenses");
const { setMonthlyBudget, getBudgetStatus } = require("./budgets");
const {
  setMonthlyIncome,
  setSavingsGoal,
  getIncomeStatus,
  getSavingsStatus,
} = require("./income");
const { getSpendingSummary } = require("./spending");

const app = express();
const PORT = 3000;

// Allow the React dev server to call this API from the browser
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];
  if (origin && allowed.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Converts JSON request bodies into req.body (JavaScript objects)
app.use(express.json());

/** GET / — simple info page listing available API routes */
app.get("/", (req, res) => {
  res.json({
    message: "Expense Tracker API",
    endpoints: {
      expenses: "GET/POST /api/expenses, GET/PATCH/DELETE /api/expenses/:id",
      spending: "GET /api/spending/summary",
      budgets: "GET/POST/PUT /api/budgets",
      income: "GET/POST /api/income",
      categories: "GET/POST /api/categories",
      cli: "npm run cli",
    },
  });
});

// --- Categories (tags) ---

/** GET /api/categories — returns all saved tags */
app.get("/api/categories", (req, res) => {
  res.json({ categories: listCategories() });
});

/** POST /api/categories — creates a tag (body: { name }) */
app.post("/api/categories", (req, res) => {
  const { name } = req.body;

  try {
    const { category, created } = createCategory(name);
    res.status(created ? 201 : 200).json({ category, created });
  } catch (err) {
    if (err.code === "EMPTY_NAME") {
      return res.status(400).json({ error: "name is required" });
    }
    throw err;
  }
});

// --- Spending (expenses add up to spending) ---

/**
 * GET /api/spending/summary
 * Query: month=2026-05 (default: current month), or from & to (YYYY-MM-DD)
 * Optional: expenseType=individual|shared, categoryId=1
 */
app.get("/api/spending/summary", (req, res) => {
  try {
    const { month, from, to, expenseType, categoryId } = req.query;

    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: "month must be YYYY-MM" });
    }

    if (expenseType && !isValidExpenseType(expenseType)) {
      return res.status(400).json({
        error: `expenseType must be one of: ${VALID_TYPES.join(", ")}`,
      });
    }

    const spending = getSpendingSummary({
      month,
      from,
      to,
      expenseType,
      categoryId,
    });

    const monthKey = spending.period.month || month;
    const budget = getBudgetStatus(monthKey, spending.total);
    const income = getIncomeStatus(monthKey);
    const savings = getSavingsStatus(monthKey, spending.total);

    res.json({ spending, budget, income, savings });
  } catch (err) {
    console.error("GET /api/spending/summary failed:", err);
    res.status(500).json({
      error: err.message || "Failed to build spending summary",
    });
  }
});

/** GET /api/budgets?month=2026-05 — budget for one month */
app.get("/api/budgets", (req, res) => {
  const { month } = req.query;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "month query is required (YYYY-MM)" });
  }

  const spending = getSpendingSummary({ month });
  const budget = getBudgetStatus(month, spending.total);

  res.json({ budget });
});

function handleSetBudget(req, res) {
  const { month, amount } = req.body;

  try {
    setMonthlyBudget(month, amount);
    const spending = getSpendingSummary({ month });
    const budget = getBudgetStatus(month, spending.total);

    res.json({ budget });
  } catch (err) {
    if (err.code === "INVALID_MONTH" || err.code === "INVALID_AMOUNT") {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
}

/** PUT or POST /api/budgets — set monthly budget (body: { month, amount }) */
app.put("/api/budgets", handleSetBudget);
app.post("/api/budgets", handleSetBudget);

// --- Income & savings (Option A: savings = income − spending) ---

/** GET /api/income?month=2026-05 */
app.get("/api/income", (req, res) => {
  const { month } = req.query;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "month query is required (YYYY-MM)" });
  }

  const spending = getSpendingSummary({ month });
  res.json({
    income: getIncomeStatus(month),
    savings: getSavingsStatus(month, spending.total),
  });
});

function handleSetIncome(req, res) {
  const { month, amount, savingsGoal } = req.body;

  try {
    setMonthlyIncome(month, amount);
    if (savingsGoal !== undefined && savingsGoal !== null && savingsGoal !== "") {
      setSavingsGoal(month, savingsGoal);
    }

    const spending = getSpendingSummary({ month });
    res.json({
      income: getIncomeStatus(month),
      savings: getSavingsStatus(month, spending.total),
    });
  } catch (err) {
    if (err.code === "INVALID_MONTH" || err.code === "INVALID_AMOUNT") {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
}

/** POST /api/income — body: { month, amount, savingsGoal? } */
app.post("/api/income", handleSetIncome);

// --- Expenses ---

/** GET /api/expenses — list all; optional ?categoryId=1 to filter by tag */
app.get("/api/expenses", (req, res) => {
  const { categoryId } = req.query;
  res.json({ expenses: listExpenses({ categoryId }) });
});

/** GET /api/expenses/:id — returns one expense by id */
app.get("/api/expenses/:id", (req, res) => {
  const expense = findExpenseById(req.params.id);
  if (!expense) {
    return res.status(404).json({ error: "Expense not found" });
  }
  res.json({ expense });
});

/**
 * POST /api/expenses — creates a new expense
 * Body: amount, expenseType, optional description, date, categoryId, categoryName
 */
app.post("/api/expenses", (req, res) => {
  const {
    amount,
    description,
    expenseType,
    costType,
    categoryId,
    categoryName,
    date,
  } = req.body;

  if (amount === undefined || amount === null || amount === "") {
    return res.status(400).json({ error: "amount is required" });
  }

  const parsedAmount = Number(amount);
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  if (!expenseType) {
    return res.status(400).json({
      error: "You must choose whether this is a shared or individual expense",
      allowedValues: VALID_TYPES,
    });
  }

  if (!isValidExpenseType(expenseType)) {
    return res.status(400).json({
      error: `expenseType must be one of: ${VALID_TYPES.join(", ")}`,
      received: expenseType,
    });
  }

  if (costType !== undefined && costType !== null && costType !== "") {
    if (!isValidCostType(costType)) {
      return res.status(400).json({
        error: `costType must be one of: ${VALID_COST_TYPES.join(", ")}`,
        received: costType,
      });
    }
  }

  try {
    const expense = createExpense({
      amount: parsedAmount,
      description,
      expenseType,
      costType,
      categoryId,
      categoryName,
      date,
    });

    res.status(201).json({ expense });
  } catch (err) {
    if (err.code === "NOT_FOUND") {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === "INVALID_DATE") {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
});

/**
 * PATCH /api/expenses/:id — updates only the fields you send in the body
 * e.g. { "amount": 30 } or { "date": "2026-05-21", "expenseType": "shared" }
 */
app.patch("/api/expenses/:id", (req, res) => {
  const {
    amount,
    description,
    expenseType,
    costType,
    categoryId,
    categoryName,
    date,
  } = req.body;

  const updates = {};

  if (amount !== undefined) {
    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "amount must be a positive number" });
    }
    updates.amount = parsedAmount;
  }

  if (description !== undefined) {
    updates.description = description;
  }

  if (expenseType !== undefined) {
    if (!isValidExpenseType(expenseType)) {
      return res.status(400).json({
        error: `expenseType must be one of: ${VALID_TYPES.join(", ")}`,
      });
    }
    updates.expenseType = expenseType;
  }

  if (costType !== undefined) {
    if (!isValidCostType(costType)) {
      return res.status(400).json({
        error: `costType must be one of: ${VALID_COST_TYPES.join(", ")}`,
      });
    }
    updates.costType = costType;
  }

  if (date !== undefined) {
    updates.date = date;
  }

  if (categoryId !== undefined || categoryName !== undefined) {
    updates.categoryId = categoryId;
    updates.categoryName = categoryName;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    const expense = updateExpense(req.params.id, updates);
    res.json({ expense });
  } catch (err) {
    if (err.code === "NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    if (err.code === "INVALID_DATE") {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
});

/** DELETE /api/expenses/:id — removes the expense permanently */
app.delete("/api/expenses/:id", (req, res) => {
  try {
    const expense = deleteExpense(req.params.id);
    res.json({ expense, deleted: true });
  } catch (err) {
    if (err.code === "NOT_FOUND") {
      return res.status(404).json({ error: err.message });
    }
    throw err;
  }
});

/** Starts listening for HTTP requests on port 3000 */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log("Try: npm run cli");
});
