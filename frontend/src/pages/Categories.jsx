import { useCallback, useEffect, useState } from "react";
import { createCategory, getCategories } from "../api";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCategories();
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError("");
    try {
      await createCategory(name.trim());
      setName("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <h1>Categories</h1>
        <p>Tags you can attach to expenses — Food, Transport, Rent, etc.</p>
      </header>

      <div className="card">
        <form className="category-form" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="New category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Adding…" : "Add tag"}
          </button>
        </form>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <p className="loading">Loading…</p>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <p>No categories yet. Create one above.</p>
          </div>
        ) : (
          <ul className="category-list">
            {categories.map((c) => (
              <li key={c.id} className="category-item">
                <span>{c.name}</span>
                <span className="category-id">id {c.id}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
