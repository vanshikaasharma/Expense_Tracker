/**
 * Interactive CLI — add, edit, or delete expenses.
 * Run: npm run cli
 */

const readline = require("readline");
const { createCategory, listCategories } = require("./categories");
const { todayString } = require("./date-utils");
const {
  createExpense,
  updateExpense,
  deleteExpense,
  listExpenses,
  isValidExpenseType,
} = require("./expenses");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/** Shows a question in the terminal and waits for the user's typed answer. */
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

/** Prints a readable list of expenses (id, date, amount, type, tag, description). */
function printExpenses(items) {
  if (items.length === 0) {
    console.log("  (none yet)\n");
    return;
  }

  items.forEach((e) => {
    const tag = e.categoryName ? ` [${e.categoryName}]` : "";
    console.log(
      `  #${e.id}  ${e.date}  $${e.amount}  ${e.expenseType}${tag}  ${e.description || "(no description)"}`
    );
  });
  console.log("");
}

/**
 * Asks the user to pick an existing tag by number or type a new tag name.
 * Returns { categoryId, categoryName } for createExpense / updateExpense.
 */
async function pickOrCreateCategory({ allowSkip = true } = {}) {
  const categories = listCategories();

  console.log("\n--- Category (tag) ---\n");

  if (categories.length > 0) {
    console.log("Saved tags:");
    categories.forEach((c) => {
      console.log(`  ${c.id} = ${c.name}`);
    });
    console.log("");
    console.log("Pick a number above, OR type a new tag name to create it.");
    if (allowSkip) {
      console.log("Press Enter to skip (no category).\n");
    }
  } else {
    console.log("No saved tags yet.");
    if (allowSkip) {
      console.log("Type a name to create one, or press Enter to skip.\n");
    } else {
      console.log("Type a name to create one.\n");
    }
  }

  const answer = await ask(
    categories.length > 0 ? "Tag (number or new name): " : "New tag name: "
  );

  if (!answer) {
    if (!allowSkip) {
      console.log("Category is required here. Try again.");
      return pickOrCreateCategory({ allowSkip });
    }
    return { categoryId: null, categoryName: null };
  }

  const asNumber = Number(answer);
  if (!Number.isNaN(asNumber) && String(asNumber) === answer) {
    const match = categories.find((c) => c.id === asNumber);
    if (!match) {
      console.log(`No tag with id ${asNumber}. Try again or type a new name.`);
      return pickOrCreateCategory({ allowSkip });
    }
    return { categoryId: match.id, categoryName: null };
  }

  const { category, created } = createCategory(answer);
  console.log(
    created
      ? `Created new tag: "${category.name}"`
      : `Using existing tag: "${category.name}"`
  );
  return { categoryId: category.id, categoryName: null };
}

/**
 * Asks for an expense date in YYYY-MM-DD format.
 * On add: blank means today. On edit: blank can mean keep current.
 */
async function askDate({ label = "Date", current } = {}) {
  const hint = current ? ` (current: ${current})` : "";
  const defaultHint = ` [Enter = today ${todayString()}]`;
  const raw = await ask(`${label} YYYY-MM-DD${hint}${defaultHint}: `);

  if (!raw && current) {
    return { ok: true, date: current };
  }

  return { ok: true, date: raw };
}

/**
 * Asks whether the expense is shared (1) or individual (2).
 * On edit, pressing Enter keeps the current type.
 */
async function askExpenseType({ current } = {}) {
  console.log("\nShared or individual?");
  console.log("  1 = shared");
  console.log("  2 = individual");
  if (current) {
    console.log(`  (current: ${current})`);
  }
  console.log("  Press Enter to keep current\n");

  const choice = await ask("Enter 1 or 2: ");

  if (!choice && current) {
    return { ok: true, expenseType: current };
  }

  if (choice === "1") {
    return { ok: true, expenseType: "shared" };
  }
  if (choice === "2") {
    return { ok: true, expenseType: "individual" };
  }

  return { ok: false, error: "Use 1 or 2." };
}

/**
 * Shows all expenses and asks the user to type an id.
 * Used before edit and delete. Returns the expense object or null.
 */
async function pickExpenseId(actionLabel) {
  const items = listExpenses();
  console.log(`\n--- ${actionLabel} — pick an expense ---\n`);
  printExpenses(items);

  if (items.length === 0) {
    return null;
  }

  const raw = await ask("Expense id (# from list): ");
  const id = Number(raw);
  if (Number.isNaN(id)) {
    console.log("Invalid id.");
    return null;
  }

  const match = items.find((e) => e.id === id);
  if (!match) {
    console.log(`No expense with id ${id}.`);
    return null;
  }

  return match;
}

/** CLI flow for menu option 1: prompts for all fields, then calls createExpense. */
async function addExpense() {
  console.log("\n--- Add expense ---\n");

  const amountRaw = await ask("Amount (e.g. 42.50): ");
  const parsedAmount = Number(amountRaw);
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    console.log("Invalid amount. Use a positive number.");
    return;
  }

  const description = await ask("Description (optional): ");

  const dateInput = await askDate({ label: "Expense" });
  const { categoryId, categoryName } = await pickOrCreateCategory();

  const typeResult = await askExpenseType({});
  if (!typeResult.ok) {
    console.log(typeResult.error);
    return;
  }

  if (!isValidExpenseType(typeResult.expenseType)) {
    console.log("Invalid expense type.");
    return;
  }

  try {
    const expense = createExpense({
      amount: parsedAmount,
      description,
      expenseType: typeResult.expenseType,
      categoryId,
      categoryName,
      date: dateInput.date,
    });

    console.log("\nSaved:");
    console.log(expense);
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
}

/** CLI flow for menu option 2: pick an expense, ask what to change, call updateExpense. */
async function editExpense() {
  const existing = await pickExpenseId("Edit");
  if (!existing) {
    return;
  }

  console.log("\nLeave blank and press Enter to keep the current value.\n");

  const amountRaw = await ask(`Amount (current: ${existing.amount}): `);
  let amount = existing.amount;
  if (amountRaw) {
    const parsed = Number(amountRaw);
    if (Number.isNaN(parsed) || parsed <= 0) {
      console.log("Invalid amount. Edit cancelled.");
      return;
    }
    amount = parsed;
  }

  const description = await ask(
    `Description (current: ${existing.description || "(empty)"}): `
  );

  const dateRaw = await ask(
    `Date YYYY-MM-DD (current: ${existing.date}) [Enter to keep]: `
  );

  console.log("\nChange category?  1 = yes, Enter = keep current");
  const changeCat = await ask("Choice: ");
  let categoryUpdates = {};
  if (changeCat === "1") {
    categoryUpdates = await pickOrCreateCategory({ allowSkip: true });
  }

  const typeResult = await askExpenseType({ current: existing.expenseType });
  if (!typeResult.ok) {
    console.log(typeResult.error);
    return;
  }

  try {
    const updates = {
      amount,
      description: description || existing.description,
      expenseType: typeResult.expenseType,
    };

    if (dateRaw) {
      updates.date = dateRaw;
    }

    if (changeCat === "1") {
      updates.categoryId = categoryUpdates.categoryId;
      updates.categoryName = categoryUpdates.categoryName;
    }

    const expense = updateExpense(existing.id, updates);
    console.log("\nUpdated:");
    console.log(expense);
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
}

/** CLI flow for menu option 3: pick an expense, confirm with "yes", call deleteExpense. */
async function deleteExpenseFlow() {
  const existing = await pickExpenseId("Delete");
  if (!existing) {
    return;
  }

  console.log("\nYou are about to delete:");
  console.log(existing);

  const confirm = await ask('\nType "yes" to confirm delete: ');
  if (confirm.toLowerCase() !== "yes") {
    console.log("Delete cancelled.");
    return;
  }

  try {
    const removed = deleteExpense(existing.id);
    console.log(`\nDeleted expense #${removed.id}.`);
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
}

/** CLI flow for menu option 4: prints every expense using printExpenses. */
async function listAll() {
  console.log("\n--- All expenses ---\n");
  printExpenses(listExpenses());
}

/**
 * Shows the main menu (add / edit / delete / list / quit) and runs the chosen action.
 * Calls itself again after each action until the user quits.
 */
async function mainMenu() {
  console.log("\n========== Expense Tracker ==========\n");
  console.log("  1 = Add expense");
  console.log("  2 = Edit expense");
  console.log("  3 = Delete expense");
  console.log("  4 = List all expenses");
  console.log("  q = Quit\n");

  const choice = await ask("What do you want to do? ");

  switch (choice) {
    case "1":
      await addExpense();
      break;
    case "2":
      await editExpense();
      break;
    case "3":
      await deleteExpenseFlow();
      break;
    case "4":
      await listAll();
      break;
    case "q":
    case "Q":
      console.log("Bye!\n");
      rl.close();
      return;
    default:
      console.log("Invalid choice. Use 1, 2, 3, 4, or q.");
  }

  await mainMenu();
}

mainMenu().catch((err) => {
  console.error(err);
  rl.close();
});
