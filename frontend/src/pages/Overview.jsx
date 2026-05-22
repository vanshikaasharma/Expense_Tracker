import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteExpense,
  getCategories,
  getExpenses,
} from "../api";

export default function Overview() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterId, setFilterId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [expData, catData] = await Promise.all([
        getExpenses(filterId || undefined),
        getCategories(),
      ]);
      setExpenses(expData.expenses || []);
      setCategories(catData.categories || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterId]);

  useEffect(() => {
    load();
  }, [load]);

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
        <p>Your recent transactions and spending log.</p>
      </header>

      <div className="card">
        <div className="toolbar">
          <h2 className="section-title">Recent transactions</h2>
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

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <p className="loading">Loading…</p>
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <p>No expenses yet. Add your first one to get started.</p>
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
                {expenses.map((e) => (
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
