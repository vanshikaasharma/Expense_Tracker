/**
 * Monthly income and savings goals — PostgreSQL.
 */

const { pool } = require("./db/pool");

function assertMonth(monthKey) {
  const trimmed = String(monthKey).trim();
  if (!/^\d{4}-\d{2}$/.test(trimmed)) {
    const err = new Error("month must be YYYY-MM");
    err.code = "INVALID_MONTH";
    throw err;
  }
  return trimmed;
}

function assertPositiveAmount(amount, label = "amount") {
  const parsed = Number(amount);
  if (Number.isNaN(parsed) || parsed <= 0) {
    const err = new Error(`${label} must be a positive number`);
    err.code = "INVALID_AMOUNT";
    throw err;
  }
  return Math.round(parsed * 100) / 100;
}

async function getIncomeRow(monthKey) {
  const result = await pool.query(
    "SELECT amount, savings_goal FROM monthly_income WHERE month_key = $1",
    [monthKey]
  );
  return result.rows[0] || null;
}

async function setMonthlyIncome(monthKey, amount) {
  const month = assertMonth(monthKey);
  const incomeAmount = assertPositiveAmount(amount, "income");

  await pool.query(
    `INSERT INTO monthly_income (month_key, amount)
     VALUES ($1, $2)
     ON CONFLICT (month_key)
     DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()`,
    [month, incomeAmount]
  );

  return getMonthlyIncome(month);
}

async function getMonthlyIncome(monthKey) {
  const row = await getIncomeRow(monthKey);
  return row ? Number(row.amount) : null;
}

async function setSavingsGoal(monthKey, amount) {
  const month = assertMonth(monthKey);
  const goalAmount = assertPositiveAmount(amount, "savingsGoal");

  const existing = await getIncomeRow(month);
  if (!existing) {
    const err = new Error("Set monthly income before adding a savings goal");
    err.code = "NO_INCOME";
    throw err;
  }

  await pool.query(
    `UPDATE monthly_income
     SET savings_goal = $2, updated_at = NOW()
     WHERE month_key = $1`,
    [month, goalAmount]
  );

  return getSavingsGoal(month);
}

async function getSavingsGoal(monthKey) {
  const row = await getIncomeRow(monthKey);
  if (!row || row.savings_goal === null) return null;
  return Number(row.savings_goal);
}

async function getIncomeStatus(monthKey) {
  const amount = await getMonthlyIncome(monthKey);
  if (amount === null) {
    return { set: false, month: monthKey };
  }
  return { set: true, month: monthKey, amount };
}

async function getSavingsStatus(monthKey, spendingTotal) {
  const incomeAmount = await getMonthlyIncome(monthKey);

  if (incomeAmount === null) {
    return {
      set: false,
      month: monthKey,
      formula: "income - spending",
    };
  }

  const spent = Number(spendingTotal) || 0;
  const amount = Math.round((incomeAmount - spent) * 100) / 100;
  const goalAmount = await getSavingsGoal(monthKey);

  const result = {
    set: true,
    month: monthKey,
    amount,
    income: incomeAmount,
    spent: Math.round(spent * 100) / 100,
    formula: "income - spending",
    overIncome: amount < 0,
  };

  if (goalAmount !== null) {
    result.goal = {
      set: true,
      amount: goalAmount,
      percentOfGoal:
        goalAmount > 0
          ? Math.round((amount / goalAmount) * 1000) / 10
          : 0,
    };
  } else {
    result.goal = { set: false };
  }

  return result;
}

/** Upsert income; optionally set savings goal in the same request. */
async function setMonthlyIncomeWithGoal(monthKey, amount, savingsGoal) {
  const month = assertMonth(monthKey);
  const incomeAmount = assertPositiveAmount(amount, "income");

  let goalValue = null;
  if (savingsGoal !== undefined && savingsGoal !== null && savingsGoal !== "") {
    goalValue = assertPositiveAmount(savingsGoal, "savingsGoal");
  }

  if (goalValue !== null) {
    await pool.query(
      `INSERT INTO monthly_income (month_key, amount, savings_goal)
       VALUES ($1, $2, $3)
       ON CONFLICT (month_key)
       DO UPDATE SET
         amount = EXCLUDED.amount,
         savings_goal = EXCLUDED.savings_goal,
         updated_at = NOW()`,
      [month, incomeAmount, goalValue]
    );
  } else {
    await pool.query(
      `INSERT INTO monthly_income (month_key, amount)
       VALUES ($1, $2)
       ON CONFLICT (month_key)
       DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()`,
      [month, incomeAmount]
    );
  }

  return getMonthlyIncome(month);
}

module.exports = {
  setMonthlyIncome,
  setMonthlyIncomeWithGoal,
  getMonthlyIncome,
  setSavingsGoal,
  getSavingsGoal,
  getIncomeStatus,
  getSavingsStatus,
};
