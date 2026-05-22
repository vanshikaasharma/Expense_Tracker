function formatMoney(amount) {
  return `$${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function WeeklyBars({ data }) {
  const max = Math.max(...data.map((d) => d.amount), 1);

  if (data.every((d) => d.amount === 0)) {
    return (
      <p className="chart-empty">Spending by day appears as you add expenses.</p>
    );
  }

  return (
    <div className="bar-chart">
      {data.map((d) => (
        <div key={d.label} className="bar-col">
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ height: `${(d.amount / max) * 100}%` }}
              title={formatMoney(d.amount)}
            />
          </div>
          <span className="bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
