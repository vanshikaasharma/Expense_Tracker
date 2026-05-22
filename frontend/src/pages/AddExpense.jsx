import { Link, useNavigate } from "react-router-dom";
import { createExpense } from "../api";
import ExpenseForm from "../components/ExpenseForm";

export default function AddExpense() {
  const navigate = useNavigate();

  async function handleSubmit(body) {
    await createExpense(body);
    navigate("/");
  }

  return (
    <>
      <header className="page-header">
        <h1>Add expense</h1>
        <p>Log amount, date, category, and whether it’s shared or individual.</p>
      </header>

      <div className="card">
        <ExpenseForm onSubmit={handleSubmit} submitLabel="Add expense" />
        <p style={{ marginTop: 20 }}>
          <Link to="/" className="btn btn-secondary">
            ← Back to overview
          </Link>
        </p>
      </div>
    </>
  );
}
