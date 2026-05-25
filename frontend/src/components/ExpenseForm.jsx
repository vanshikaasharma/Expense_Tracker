import { useEffect, useState } from "react";
import { getCategories, todayString } from "../api";

const CREATE_NEW = "__create_new__";

const EMPTY = {
  amount: "",
  description: "",
  date: todayString(),
  expenseType: "individual",
  costType: "variable",
  categorySelection: "none",
  newCategoryName: "",
};

export default function ExpenseForm({ initial, onSubmit, submitLabel = "Save" }) {
  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!initial) {
      setForm({ ...EMPTY, date: todayString() });
      return;
    }

    setForm({
      amount: String(initial.amount),
      description: initial.description || "",
      date: initial.date || todayString(),
      expenseType: initial.expenseType || "individual",
      categorySelection: initial.categoryId
        ? String(initial.categoryId)
        : "none",
      newCategoryName: "",
    });
  }, [initial]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const showNewCategoryInput = form.categorySelection === CREATE_NEW;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const amount = Number(form.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      setError("Enter a valid positive amount.");
      return;
    }

    const body = {
      amount,
      description: form.description,
      expenseType: form.expenseType,
      costType: form.costType,
      date: form.date || todayString(),
    };

    if (form.categorySelection === CREATE_NEW) {
      const name = form.newCategoryName.trim();
      if (!name) {
        setError("Enter a name for the new category.");
        return;
      }
      body.categoryName = name;
    } else if (
      form.categorySelection !== "none" &&
      form.categorySelection !== ""
    ) {
      body.categoryId = Number(form.categorySelection);
    }

    setSaving(true);
    try {
      await onSubmit(body);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}

      <div className="form-field">
        <label htmlFor="amount">Amount</label>
        <input
          id="amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="42.50"
          value={form.amount}
          onChange={(e) => update("amount", e.target.value)}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="date">Date</label>
        <input
          id="date"
          type="date"
          value={form.date}
          onChange={(e) => update("date", e.target.value)}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          placeholder="Coffee, groceries, dinner…"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={form.categorySelection}
          onChange={(e) => update("categorySelection", e.target.value)}
        >
          <option value="none">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
          <option value={CREATE_NEW}>+ Create new category</option>
        </select>
      </div>

      {showNewCategoryInput && (
        <div className="form-field">
          <label htmlFor="newCategoryName">New category name</label>
          <input
            id="newCategoryName"
            type="text"
            placeholder="Food, Transport…"
            value={form.newCategoryName}
            onChange={(e) => update("newCategoryName", e.target.value)}
            required
          />
        </div>
      )}

      <div className="form-field">
        <label>Shared or individual?</label>
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              name="expenseType"
              value="individual"
              checked={form.expenseType === "individual"}
              onChange={() => update("expenseType", "individual")}
            />
            Individual
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="expenseType"
              value="shared"
              checked={form.expenseType === "shared"}
              onChange={() => update("expenseType", "shared")}
            />
            Shared
          </label>
        </div>
      </div>

      <div className="form-field">
        <label>Fixed or variable?</label>
        <p className="field-hint">
          Fixed = rent, bills (same each month). Variable = groceries, dining
          (habits you can change).
        </p>
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              name="costType"
              value="fixed"
              checked={form.costType === "fixed"}
              onChange={() => update("costType", "fixed")}
            />
            Fixed
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="costType"
              value="variable"
              checked={form.costType === "variable"}
              onChange={() => update("costType", "variable")}
            />
            Variable
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
