/**
 * Expense storage (in memory for now).
 * All create/read/update/delete logic for expenses lives here.
 */

const { resolveCategory } = require("./categories");
const { parseExpenseDate } = require("./date-utils");

const expenses = [];

let nextId = 1;

const VALID_TYPES = ["shared", "individual"];

/** Looks up a single expense by id. Returns null if it does not exist. */
function findExpenseById(id) {
  return expenses.find((e) => e.id === Number(id)) || null;
}

/**
 * Creates a new expense and adds it to the in-memory list.
 * Validates date, links an optional category, assigns the next id.
 */
function createExpense({
  amount,
  description,
  expenseType,
  categoryId,
  categoryName,
  date,
}) {
  const parsed = parseExpenseDate(date);
  if (!parsed.ok) {
    const err = new Error(parsed.error);
    err.code = "INVALID_DATE";
    throw err;
  }

  let category = null;
  category = resolveCategory({ categoryId, categoryName });

  const expense = {
    id: nextId++,
    amount,
    description: description || "",
    expenseType,
    date: parsed.date,
    categoryId: category ? category.id : null,
    categoryName: category ? category.name : null,
    createdAt: new Date().toISOString(),
  };

  expenses.push(expense);
  return expense;
}

/**
 * Updates an existing expense. Only fields passed in `updates` are changed.
 * Throws if the expense id is not found or the new date is invalid.
 */
function updateExpense(id, updates) {
  const expense = findExpenseById(id);
  if (!expense) {
    const err = new Error(`Expense with id ${id} not found`);
    err.code = "NOT_FOUND";
    throw err;
  }

  if (updates.amount !== undefined) {
    expense.amount = updates.amount;
  }

  if (updates.description !== undefined) {
    expense.description = updates.description;
  }

  if (updates.expenseType !== undefined) {
    expense.expenseType = updates.expenseType;
  }

  if (updates.date !== undefined) {
    const parsed = parseExpenseDate(updates.date);
    if (!parsed.ok) {
      const err = new Error(parsed.error);
      err.code = "INVALID_DATE";
      throw err;
    }
    expense.date = parsed.date;
  }

  if (
    updates.categoryId !== undefined ||
    updates.categoryName !== undefined
  ) {
    const clearCategory =
      updates.categoryId === null && updates.categoryName === null;

    if (clearCategory) {
      expense.categoryId = null;
      expense.categoryName = null;
    } else {
      const category = resolveCategory({
        categoryId: updates.categoryId,
        categoryName: updates.categoryName,
      });
      expense.categoryId = category ? category.id : null;
      expense.categoryName = category ? category.name : null;
    }
  }

  return expense;
}

/** Removes an expense from the list. Returns the deleted expense. Throws if not found. */
function deleteExpense(id) {
  const index = expenses.findIndex((e) => e.id === Number(id));
  if (index === -1) {
    const err = new Error(`Expense with id ${id} not found`);
    err.code = "NOT_FOUND";
    throw err;
  }

  const [removed] = expenses.splice(index, 1);
  return removed;
}

/**
 * Returns all expenses, newest date first.
 * Optional filters: categoryId, expenseType (shared | individual).
 */
function listExpenses({ categoryId, expenseType } = {}) {
  let result = [...expenses];

  if (categoryId !== undefined && categoryId !== null && categoryId !== "") {
    const id = Number(categoryId);
    result = result.filter((e) => e.categoryId === id);
  }

  if (expenseType !== undefined && expenseType !== null && expenseType !== "") {
    result = result.filter((e) => e.expenseType === expenseType);
  }

  return result.sort((a, b) => b.date.localeCompare(a.date));
}

/** Returns true if expenseType is "shared" or "individual". */
function isValidExpenseType(value) {
  return VALID_TYPES.includes(value);
}

module.exports = {
  createExpense,
  updateExpense,
  deleteExpense,
  findExpenseById,
  listExpenses,
  isValidExpenseType,
  VALID_TYPES,
};
