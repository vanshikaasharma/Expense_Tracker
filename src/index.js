/**
 * Entry point — starts the Express web server (HTTP API).
 * Requires DATABASE_URL in .env (Supabase PostgreSQL).
 */

require("dotenv").config();

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
  setMonthlyIncomeWithGoal,
  getIncomeStatus,
  getSavingsStatus,
} = require("./income");
const { getSpendingSummary } = require("./spending");
const { runMigrations } = require("./db/migrate");
const { checkConnection, pool } = require("./db/pool");

const app = express();
const PORT = process.env.PORT || 3000;

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = ["http://localhost:5173", "http://127.0.0.1:5173"];
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

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Expense Tracker API",
    database: "PostgreSQL (Supabase)",
    endpoints: {
      health: "GET /api/health",
      expenses: "GET/POST /api/expenses, GET/PATCH/DELETE /api/expenses/:id",
      spending: "GET /api/spending/summary",
      budgets: "GET/POST/PUT /api/budgets",
      income: "GET/POST /api/income",
      categories: "GET/POST /api/categories",
      cli: "npm run cli",
    },
  });
});

app.get(
  "/api/health",
  asyncHandler(async (req, res) => {
    const ok = await checkConnection();
    res.json({ ok, database: ok ? "connected" : "unreachable" });
  })
);

app.get(
  "/api/categories",
  asyncHandler(async (req, res) => {
    res.json({ categories: await listCategories() });
  })
);

app.post(
  "/api/categories",
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    try {
      const { category, created } = await createCategory(name);
      res.status(created ? 201 : 200).json({ category, created });
    } catch (err) {
      if (err.code === "EMPTY_NAME") {
        return res.status(400).json({ error: "name is required" });
      }
      throw err;
    }
  })
);

app.get(
  "/api/spending/summary",
  asyncHandler(async (req, res) => {
    const { month, from, to, expenseType, categoryId } = req.query;

    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: "month must be YYYY-MM" });
    }

    if (expenseType && !isValidExpenseType(expenseType)) {
      return res.status(400).json({
        error: `expenseType must be one of: ${VALID_TYPES.join(", ")}`,
      });
    }

    const spending = await getSpendingSummary({
      month,
      from,
      to,
      expenseType,
      categoryId,
    });

    const monthKey = spending.period.month || month;
    const budget = await getBudgetStatus(monthKey, spending.total);
    const income = await getIncomeStatus(monthKey);
    const savings = await getSavingsStatus(monthKey, spending.total);

    res.json({ spending, budget, income, savings });
  })
);

app.get(
  "/api/budgets",
  asyncHandler(async (req, res) => {
    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: "month query is required (YYYY-MM)" });
    }

    const spending = await getSpendingSummary({ month });
    const budget = await getBudgetStatus(month, spending.total);

    res.json({ budget });
  })
);

async function handleSetBudget(req, res) {
  const { month, amount } = req.body;

  try {
    await setMonthlyBudget(month, amount);
    const spending = await getSpendingSummary({ month });
    const budget = await getBudgetStatus(month, spending.total);

    res.json({ budget });
  } catch (err) {
    if (err.code === "INVALID_MONTH" || err.code === "INVALID_AMOUNT") {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
}

app.put("/api/budgets", asyncHandler(handleSetBudget));
app.post("/api/budgets", asyncHandler(handleSetBudget));

app.get(
  "/api/income",
  asyncHandler(async (req, res) => {
    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: "month query is required (YYYY-MM)" });
    }

    const spending = await getSpendingSummary({ month });
    res.json({
      income: await getIncomeStatus(month),
      savings: await getSavingsStatus(month, spending.total),
    });
  })
);

app.post(
  "/api/income",
  asyncHandler(async (req, res) => {
    const { month, amount, savingsGoal } = req.body;

    try {
      await setMonthlyIncomeWithGoal(month, amount, savingsGoal);

      const spending = await getSpendingSummary({ month });
      res.json({
        income: await getIncomeStatus(month),
        savings: await getSavingsStatus(month, spending.total),
      });
    } catch (err) {
      if (err.code === "INVALID_MONTH" || err.code === "INVALID_AMOUNT") {
        return res.status(400).json({ error: err.message });
      }
      throw err;
    }
  })
);

app.get(
  "/api/expenses",
  asyncHandler(async (req, res) => {
    const { categoryId } = req.query;
    res.json({ expenses: await listExpenses({ categoryId }) });
  })
);

app.get(
  "/api/expenses/:id",
  asyncHandler(async (req, res) => {
    const expense = await findExpenseById(req.params.id);
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json({ expense });
  })
);

app.post(
  "/api/expenses",
  asyncHandler(async (req, res) => {
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
      const expense = await createExpense({
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
  })
);

app.patch(
  "/api/expenses/:id",
  asyncHandler(async (req, res) => {
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

    if (description !== undefined) updates.description = description;

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

    if (date !== undefined) updates.date = date;

    if (categoryId !== undefined || categoryName !== undefined) {
      updates.categoryId = categoryId;
      updates.categoryName = categoryName;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    try {
      const expense = await updateExpense(req.params.id, updates);
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
  })
);

app.delete(
  "/api/expenses/:id",
  asyncHandler(async (req, res) => {
    try {
      const expense = await deleteExpense(req.params.id);
      res.json({ expense, deleted: true });
    } catch (err) {
      if (err.code === "NOT_FOUND") {
        return res.status(404).json({ error: err.message });
      }
      throw err;
    }
  })
);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: err.message || "Internal server error",
  });
});

async function start() {
  await runMigrations();
  const ok = await checkConnection();
  if (!ok) {
    throw new Error("Database connection check failed");
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log("Database: PostgreSQL connected");
    console.log("Try: npm run cli");
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  pool.end().finally(() => process.exit(1));
});
