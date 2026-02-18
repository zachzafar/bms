/**
 * Date utilities for consistent date handling across the app.
 *
 * The backend stores dates in UTC. These utilities display dates
 * in the user's local timezone automatically.
 */

/**
 * Formats a date for display in the user's local timezone.
 *
 * @param date - Date string or Date object from the API
 * @param options - Intl.DateTimeFormat options (defaults to short date format)
 * @returns Formatted date string
 */
export function formatDisplayDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Formats a date as YYYY-MM-DD for form inputs, using local timezone.
 *
 * @param date - Date string or Date object from the API
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForInput(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Creates a Date object from a date input string (YYYY-MM-DD) as UTC.
 * This ensures the date is interpreted as UTC, not local time.
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object representing midnight UTC on that date
 */
export function parseDateInputAsUTC(dateString: string): Date {
  // Append T00:00:00.000Z to force UTC interpretation
  return new Date(`${dateString}T00:00:00.000Z`);
}

/**
 * Formats a date range for display.
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted date range string
 */
export function formatDateRange(startDate: string | Date, endDate: string | Date): string {
  return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
}


// Helper: Parse date string to local Date, handling both formats:
// - datetime with timezone: "2026-02-09T04:00:00.000Z" -> extract UTC date
// - date-only: "2026-02-09" -> treat as local date
export function parseAsLocalDate(dateStr: string): Date {
  if (dateStr.includes("T")) {
    const d = new Date(dateStr);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Helper: Add days to a date and return new Date
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
