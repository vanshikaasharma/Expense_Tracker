import { useState } from "react";
import { setMonthlyBudget } from "../api";
import { setLocalBudgetAmount } from "../utils/budgetStorage";
import CategoryDonut from "./CategoryDonut";
import WeeklyBars from "./WeeklyBars";
import { spendingByWeekday } from "../utils/spending";

function formatMoney(amount) {
  return `$${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
  month,
  monthExpenses,
  onMonthChange,
  onBudgetSaved,
  loading,
  apiWarning,
}) {
  const [budgetInput, setBudgetInput] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);
  const [budgetError, setBudgetError] = useState("");

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
      onBudgetSaved();
    } catch (err) {
      if (err.message.includes("404")) {
        setLocalBudgetAmount(month, amount);
        setBudgetInput("");
        onBudgetSaved();
        return;
      }
      setBudgetError(err.message);
    } finally {
      setSavingBudget(false);
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
                of {formatMoney(budget.amount)} monthly limit
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
                Change budget
              </button>
            </>
          ) : (
            <>
              <span className="stat-value stat-value--empty">—</span>
              <span className="stat-hint">Set your monthly limit</span>
            </>
          )}

          {(!budget?.set || budgetInput) && (
            <form className="budget-form" onSubmit={handleSaveBudget}>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="$400"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                aria-label="Monthly budget amount"
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={savingBudget}
              >
                {savingBudget ? "Saving…" : "Set budget"}
              </button>
            </form>
          )}
          {budgetError && (
            <span className="budget-form-error">{budgetError}</span>
          )}
        </div>

        <div className="stat-card stat-card--helir stat-card--muted">
          <span className="stat-label">Savings this month</span>
          <span className="stat-value stat-value--empty">—</span>
          <span className="stat-hint">Coming later</span>
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
