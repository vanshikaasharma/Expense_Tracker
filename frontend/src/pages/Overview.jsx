import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  currentMonthKey,
  deleteExpense,
  getCategories,
  getExpenses,
  getSpendingSummary,
} from "../api";
import SpendingSummary from "../components/SpendingSummary";
import { mergeBudgetWithLocal } from "../utils/budgetStorage";
import { computeSpendingFromExpenses } from "../utils/spending";

function monthLabel(monthKey) {
  const [y, m] = monthKey.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
}

export default function Overview() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [spending, setSpending] = useState(null);
  const [budget, setBudget] = useState(null);
  const [summaryMonth, setSummaryMonth] = useState(currentMonthKey);
  const [filterId, setFilterId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiWarning, setApiWarning] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setApiWarning("");

    try {
      const [expData, catData] = await Promise.all([
        getExpenses(filterId || undefined),
        getCategories(),
      ]);
      const list = expData.expenses || [];
      setExpenses(list);
      setCategories(catData.categories || []);

      try {
        const data = await getSpendingSummary({
          month: summaryMonth,
          categoryId: filterId || undefined,
        });
        const spendingData = data.spending || null;
        setSpending(spendingData);
        setBudget(
          mergeBudgetWithLocal(
            summaryMonth,
            data.budget ?? { set: false, month: summaryMonth },
            spendingData?.total ?? 0
          )
        );
      } catch (summaryErr) {
        const localSpending = computeSpendingFromExpenses(list, summaryMonth);
        setSpending(localSpending);
        setBudget(
          mergeBudgetWithLocal(
            summaryMonth,
            { set: false, month: summaryMonth },
            localSpending.total
          )
        );
        setApiWarning(
          summaryErr.message.includes("404")
            ? "Using local totals — restart the API (npm start) for budgets and full summary."
            : `Using local totals — ${summaryErr.message}`
        );
      }
    } catch (err) {
      setError(err.message);
      setSpending(null);
      setBudget(null);
    } finally {
      setLoading(false);
    }
  }, [filterId, summaryMonth]);

  useEffect(() => {
    load();
  }, [load]);

  const monthExpenses = expenses.filter((e) =>
    e.date.startsWith(summaryMonth)
  );

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteExpense(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <h1>Welcome back!</h1>
        <p>Your personal finance dashboard · {monthLabel(summaryMonth)}</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {/* Dashboard: spending, budget, donut — before transactions */}
      <SpendingSummary
        spending={spending}
        budget={budget}
        month={summaryMonth}
        monthExpenses={monthExpenses}
        onMonthChange={setSummaryMonth}
        onBudgetSaved={load}
        loading={loading}
        apiWarning={apiWarning}
      />

      <div className="card transactions-card">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Recent transactions</h2>
            <p className="section-sub">Showing {summaryMonth}</p>
          </div>
          <div className="toolbar-actions">
            <div className="filter-bar">
              <label htmlFor="filter">Category</label>
              <select
                id="filter"
                value={filterId}
                onChange={(e) => setFilterId(e.target.value)}
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Link to="/add" className="btn btn-primary">
              + Add expense
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="loading">Loading…</p>
        ) : monthExpenses.length === 0 ? (
          <div className="empty-state">
            <p>No expenses this month. Add one or pick another month.</p>
            <Link to="/add" className="btn btn-primary">
              Add expense
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {monthExpenses.map((e) => (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td>{e.description || "—"}</td>
                    <td>
                      {e.categoryName ? (
                        <span className="badge badge-category">
                          {e.categoryName}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${e.expenseType}`}>
                        {e.expenseType}
                      </span>
                    </td>
                    <td className="amount-cell">
                      ${Number(e.amount).toFixed(2)}
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link
                          to={`/edit/${e.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeleteTarget(e)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={(ev) => ev.stopPropagation()}>
            <h2>Delete expense?</h2>
            <p>
              Remove ${Number(deleteTarget.amount).toFixed(2)} on{" "}
              {deleteTarget.date}
              {deleteTarget.description
                ? ` — ${deleteTarget.description}`
                : ""}
              ? This cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
