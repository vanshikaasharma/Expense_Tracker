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
  month,
  onMonthChange,
  loading,
}) {
  return (
    <section className="spending-section">
      <div className="spending-header">
        <div>
          <h2 className="section-title">Spending summary</h2>
          <p className="section-sub">
            Expenses add up to your total spending
            {spending?.period?.month
              ? ` · ${monthLabel(spending.period.month)}`
              : ""}
          </p>
        </div>
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

      {loading ? (
        <p className="loading">Loading summary…</p>
      ) : !spending ? null : (
        <>
          <div className="spending-stats">
            <div className="stat-card stat-card--primary">
              <span className="stat-label">Total spending</span>
              <span className="stat-value">{formatMoney(spending.total)}</span>
              <span className="stat-hint">
                {spending.transactionCount} expense
                {spending.transactionCount === 1 ? "" : "s"}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Individual</span>
              <span className="stat-value stat-value--sm">
                {formatMoney(spending.byExpenseType.individual)}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Shared</span>
              <span className="stat-value stat-value--sm">
                {formatMoney(spending.byExpenseType.shared)}
              </span>
            </div>
          </div>

          <div className="card spending-by-category">
            <h3 className="subsection-title">By category</h3>
            {spending.byCategory.length === 0 ? (
              <p className="chart-empty">
                No spending in this period. Add expenses to see breakdown.
              </p>
            ) : (
              <ul className="category-breakdown">
                {spending.byCategory.map((row) => (
                  <li key={row.categoryId ?? "uncategorized"}>
                    <div className="breakdown-row">
                      <span className="breakdown-name">{row.categoryName}</span>
                      <span className="breakdown-amt">
                        {formatMoney(row.amount)}
                        <span className="breakdown-pct">{row.percent}%</span>
                      </span>
                    </div>
                    <div className="breakdown-track">
                      <div
                        className="breakdown-fill"
                        style={{ width: `${row.percent}%` }}
                      />
                    </div>
                    <span className="breakdown-meta">
                      {row.count} transaction{row.count === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
