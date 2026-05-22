/**
 * Date helpers for expenses.
 * All expense dates are stored as YYYY-MM-DD strings.
 */

/** Returns today's date as YYYY-MM-DD (used when user leaves date blank). */
function todayString() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Validates and normalizes a date string.
 * - Empty input → today's date
 * - Must match YYYY-MM-DD and be a real calendar date
 * Returns { ok: true, date } or { ok: false, error }.
 */
function parseExpenseDate(input) {
  const trimmed = input === undefined || input === null ? "" : String(input).trim();

  if (!trimmed) {
    return { ok: true, date: todayString() };
  }

  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return { ok: false, error: "Use date format YYYY-MM-DD (e.g. 2026-05-21)" };
  }

  const [, year, month, day] = match;
  const d = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    d.getFullYear() !== Number(year) ||
    d.getMonth() !== Number(month) - 1 ||
    d.getDate() !== Number(day)
  ) {
    return { ok: false, error: "That date is not valid" };
  }

  return { ok: true, date: trimmed };
}

module.exports = { parseExpenseDate, todayString };
