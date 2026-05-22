const SLICES = [
  "#4b3935",
  "#6b534e",
  "#8a726c",
  "#a89488",
  "#c4b5a8",
  "#ddd0c4",
];

function formatMoney(amount) {
  return `$${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Donut chart for expense breakdown by category (CSS only, no chart library). */
export default function CategoryDonut({ breakdown }) {
  const total = breakdown.reduce((s, x) => s + x.amount, 0);

  if (total === 0) {
    return (
      <p className="chart-empty">
        No spending this month. Add expenses to see the breakdown.
      </p>
    );
  }

  let cursor = 0;
  const stops = breakdown.map((item, i) => {
    const pct = (item.amount / total) * 100;
    const start = cursor;
    cursor += pct;
    return `${SLICES[i % SLICES.length]} ${start}% ${cursor}%`;
  });

  return (
    <div className="donut-block">
      <div
        className="donut"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
        role="img"
        aria-label={`Expense breakdown by category, total ${formatMoney(total)}`}
      >
        <div className="donut-hole">
          <span className="donut-hole-label">Total</span>
          <span className="donut-hole-value">{formatMoney(total)}</span>
        </div>
      </div>
      <ul className="donut-legend">
        {breakdown.map((item, i) => (
          <li key={item.categoryId ?? "uncategorized"}>
            <span
              className="legend-swatch"
              style={{ background: SLICES[i % SLICES.length] }}
            />
            <span className="legend-name">{item.categoryName}</span>
            <span className="legend-meta">
              {formatMoney(item.amount)}
              <span className="legend-pct">{item.percent}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
