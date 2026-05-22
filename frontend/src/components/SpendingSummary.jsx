import { useState } from "react";
import { setMonthlyBudget, setMonthlyIncome } from "../api";
import { setLocalBudgetAmount } from "../utils/budgetStorage";
import {
  setLocalIncomeAmount,
  setLocalSavingsGoal,
} from "../utils/incomeStorage";
import CategoryDonut from "./CategoryDonut";
import WeeklyBars from "./WeeklyBars";
import { spendingByWeekday } from "../utils/spending";

function formatMoney(amount) {
  const n = Number(amount);
  const abs = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return n < 0 ? `−$${abs}` : `$${abs}`;
}

function monthLabel(monthKey) {
  const [y, m] = monthKey.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
}

export default function SpendingSummary({
  spending,
  budget,
  savings,
  month,
  monthExpenses,
  onMonthChange,
  onFinancialsSaved,
  loading,
  apiWarning,
}) {
  const [budgetInput, setBudgetInput] = useState("");
  const [incomeInput, setIncomeInput] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);
  const [savingIncome, setSavingIncome] = useState(false);
  const [budgetError, setBudgetError] = useState("");
  const [incomeError, setIncomeError] = useState("");
  const [showIncomeForm, setShowIncomeForm] = useState(false);

  const weeklyData = spending ? spendingByWeekday(monthExpenses, month) : [];

  async function handleSaveBudget(e) {
    e.preventDefault();
    setBudgetError("");

    const amount = Number(budgetInput);
    if (Number.isNaN(amount) || amount <= 0) {
      setBudgetError("Enter a positive budget amount.");
      return;
    }

    setSavingBudget(true);
    try {
      await setMonthlyBudget({ month, amount });
      setBudgetInput("");
      onFinancialsSaved();
    } catch (err) {
      if (err.message.includes("404")) {
        setLocalBudgetAmount(month, amount);
        setBudgetInput("");
        onFinancialsSaved();
        return;
      }
      setBudgetError(err.message);
    } finally {
      setSavingBudget(false);
    }
  }

  async function handleSaveIncome(e) {
    e.preventDefault();
    setIncomeError("");

    const amount = Number(incomeInput);
    if (Number.isNaN(amount) || amount <= 0) {
      setIncomeError("Enter a positive income amount.");
      return;
    }

    const goalRaw = goalInput.trim();
    const savingsGoal =
      goalRaw === "" ? undefined : Number(goalRaw);
    if (goalRaw !== "" && (Number.isNaN(savingsGoal) || savingsGoal <= 0)) {
      setIncomeError("Savings goal must be a positive number, or leave blank.");
      return;
    }

    setSavingIncome(true);
    try {
      await setMonthlyIncome({ month, amount, savingsGoal });
      setIncomeInput("");
      setGoalInput("");
      setShowIncomeForm(false);
      onFinancialsSaved();
    } catch (err) {
      if (err.message.includes("404")) {
        setLocalIncomeAmount(month, amount);
        if (savingsGoal !== undefined) {
          setLocalSavingsGoal(month, savingsGoal);
        }
        setIncomeInput("");
        setGoalInput("");
        setShowIncomeForm(false);
        onFinancialsSaved();
        return;
      }
      setIncomeError(err.message);
    } finally {
      setSavingIncome(false);
    }
  }

  if (loading) {
    return <p className="loading">Loading dashboard…</p>;
  }

  if (!spending) {
    return (
      <div className="error-banner">
        Could not load spending data. Make sure the API is running.
      </div>
    );
  }

  return (
    <section className="dashboard-section">
      <div className="dashboard-toolbar">
        <div className="filter-bar">
          <label htmlFor="summary-month">Month</label>
          <input
            id="summary-month"
            type="month"
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
          />
        </div>
      </div>

      {apiWarning && (
        <div className="warning-banner">{apiWarning}</div>
      )}

      <div className="spending-stats spending-stats--four">
        <div className="stat-card stat-card--helir">
          <span className="stat-label">Total monthly spending</span>
          <span className="stat-value">{formatMoney(spending.total)}</span>
          <span className="stat-hint">
            {spending.transactionCount} transaction
            {spending.transactionCount === 1 ? "" : "s"} · {monthLabel(month)}
          </span>
        </div>

        <div
          className={`stat-card stat-card--helir stat-card--budget${
            budget?.set && budget.overBudget ? " stat-card--over" : ""
          }`}
        >
          <span className="stat-label">Remaining budget</span>
          {budget?.set ? (
            <>
              <span className="stat-value">{formatMoney(budget.remaining)}</span>
              <div className="budget-progress-row">
                <div className="budget-progress" aria-hidden>
                  <div
                    className="budget-progress-fill"
                    style={{
                      width: `${Math.min(budget.percentUsed, 100)}%`,
                    }}
                  />
                </div>
                <span className="budget-percent">{budget.percentUsed}%</span>
              </div>
              <span className="stat-hint">
                of {formatMoney(budget.amount)} spending limit
                {budget.localOnly ? " · saved on this device" : ""}
              </span>
              {budget.overBudget && (
                <span className="stat-warn">Over budget</span>
              )}
              <button
                type="button"
                className="btn-link"
                onClick={() => setBudgetInput(String(budget.amount))}
              >
                Change limit
              </button>
            </>
          ) : (
            <>
              <span className="stat-value stat-value--empty">—</span>
              <span className="stat-hint">Spending cap (not income)</span>
            </>
          )}

          {(!budget?.set || budgetInput) && (
            <form className="budget-form" onSubmit={handleSaveBudget}>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Spending limit"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                aria-label="Monthly spending limit"
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={savingBudget}
              >
                {savingBudget ? "Saving…" : "Set limit"}
              </button>
            </form>
          )}
          {budgetError && (
            <span className="budget-form-error">{budgetError}</span>
          )}
        </div>

        <div
          className={`stat-card stat-card--helir stat-card--savings${
            savings?.set && savings.overIncome ? " stat-card--over" : ""
          }`}
        >
          <span className="stat-label">Savings this month</span>
          {savings?.set ? (
            <>
              <span className="stat-value">{formatMoney(savings.amount)}</span>
              {savings.goal?.set && (
                <div className="budget-progress-row">
                  <div className="budget-progress" aria-hidden>
                    <div
                      className="budget-progress-fill budget-progress-fill--savings"
                      style={{
                        width: `${Math.min(savings.goal.percentOfGoal, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="budget-percent">
                    {savings.goal.percentOfGoal}%
                  </span>
                </div>
              )}
              <span className="stat-hint">
                {formatMoney(savings.income)} income −{" "}
                {formatMoney(savings.spent)} spent
                {savings.goal?.set
                  ? ` · goal ${formatMoney(savings.goal.amount)}`
                  : ""}
                {savings.localOnly ? " · saved on this device" : ""}
              </span>
              {savings.overIncome && (
                <span className="stat-warn">Over income</span>
              )}
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setIncomeInput(String(savings.income));
                  setGoalInput(
                    savings.goal?.set ? String(savings.goal.amount) : ""
                  );
                  setShowIncomeForm(true);
                }}
              >
                Update income
              </button>
            </>
          ) : (
            <>
              <span className="stat-value stat-value--empty">—</span>
              <span className="stat-hint">Add income to calculate savings</span>
            </>
          )}

          {(!savings?.set || showIncomeForm) && (
            <form className="budget-form" onSubmit={handleSaveIncome}>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Monthly income"
                value={incomeInput}
                onChange={(e) => setIncomeInput(e.target.value)}
                aria-label="Monthly income"
              />
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Savings goal (optional)"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                aria-label="Monthly savings goal"
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={savingIncome}
              >
                {savingIncome ? "Saving…" : "Set income"}
              </button>
            </form>
          )}
          {incomeError && (
            <span className="budget-form-error">{incomeError}</span>
          )}
        </div>

        <div className="stat-card stat-card--helir">
          <span className="stat-label">Individual vs shared</span>
          <span className="stat-value">
            {formatMoney(spending.byExpenseType.individual)}
          </span>
          <span className="stat-hint">
            {spending.byExpenseType.shared > 0
              ? `${formatMoney(spending.byExpenseType.shared)} shared`
              : "No shared expenses yet"}
          </span>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="card expense-breakdown-card">
          <div className="breakdown-head">
            <h3 className="subsection-title">Expense breakdown</h3>
            <span className="card-sub">By category · this month</span>
          </div>
          <CategoryDonut breakdown={spending.byCategory} />
        </div>

        <div className="card expense-breakdown-card">
          <div className="breakdown-head">
            <h3 className="subsection-title">Weekly spending</h3>
            <span className="card-sub">By day · this month</span>
          </div>
          <WeeklyBars data={weeklyData} />
        </div>
      </div>
    </section>
  );
}
