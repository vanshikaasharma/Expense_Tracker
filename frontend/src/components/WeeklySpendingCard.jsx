import { useEffect, useMemo, useState } from "react";
import {
  getCalendarWeek,
  isWeekInFuture,
  spendingForWeek,
  weekAnchorForMonth,
} from "../utils/spending";
import WeeklyBars from "./WeeklyBars";

function formatMoney(amount) {
  return `$${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** YYYY-MM-DD → DD-MM-YYYY */
function formatDDMMYYYY(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${d}-${m}-${y}`;
}

export default function WeeklySpendingCard({ expenses, monthKey }) {
  const [weekOffset, setWeekOffset] = useState(0);

  const anchor = useMemo(() => weekAnchorForMonth(monthKey), [monthKey]);

  useEffect(() => {
    setWeekOffset(0);
  }, [monthKey]);

  const week = useMemo(
    () => getCalendarWeek(weekOffset, anchor),
    [weekOffset, anchor]
  );

  const data = useMemo(
    () => spendingForWeek(expenses, week.from, week.to),
    [expenses, week.from, week.to]
  );

  const weekTotal = data.reduce((sum, d) => sum + d.amount, 0);
  const canGoForward = !isWeekInFuture(
    getCalendarWeek(weekOffset + 1, anchor).from
  );

  const weekRangeLabel = `${formatDDMMYYYY(week.from)} to ${formatDDMMYYYY(week.to)}`;

  return (
    <div className="card expense-breakdown-card weekly-spending-card">
      <div className="weekly-spending-head">
        <h3 className="subsection-title weekly-spending-title">Weekly spending</h3>

        <div className="week-picker" role="group" aria-label="Change week">
        <button
          type="button"
          className="week-picker-btn"
          onClick={() => setWeekOffset((o) => o - 1)}
          aria-label="Previous week"
        >
          &lt;
        </button>
        <span className="week-picker-range">{weekRangeLabel}</span>
        <button
          type="button"
          className="week-picker-btn"
          onClick={() => setWeekOffset((o) => o + 1)}
          disabled={!canGoForward}
          aria-label="Next week"
        >
          &gt;
        </button>
        </div>
      </div>

      {weekTotal > 0 && (
        <p className="week-total">
          Week total: <strong>{formatMoney(weekTotal)}</strong>
        </p>
      )}

      <WeeklyBars
        data={data}
        emptyMessage={`No expenses ${week.from} – ${week.to}.`}
      />
    </div>
  );
}
