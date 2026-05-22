import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getExpense, updateExpense } from "../api";
import ExpenseForm from "../components/ExpenseForm";

export default function EditExpense() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getExpense(id)
      .then((data) => setExpense(data.expense))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(body) {
    await updateExpense(id, body);
    navigate("/");
  }

  if (loading) {
    return <p className="loading">Loading expense…</p>;
  }

  if (error || !expense) {
    return (
      <>
        <div className="error-banner">{error || "Expense not found"}</div>
        <Link to="/" className="btn btn-secondary">
          ← Back to overview
        </Link>
      </>
    );
  }

  return (
    <>
      <header className="page-header">
        <h1>Edit expense</h1>
        <p>Update #{expense.id} and save your changes.</p>
      </header>

      <div className="card">
        <ExpenseForm
          key={expense.id}
          initial={expense}
          onSubmit={handleSubmit}
          submitLabel="Save changes"
        />
        <p style={{ marginTop: 20 }}>
          <Link to="/" className="btn btn-secondary">
            ← Back to overview
          </Link>
        </p>
      </div>
    </>
  );
}
