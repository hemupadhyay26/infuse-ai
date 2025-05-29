import { DateTime } from "luxon";

const TIMEZONE = process.env.APP_TIMEZONE || "UTC";

/**
 * Format a given date/time to a specific timezone and format string.
 *
 * @param {Date | string | number} dateInput - The date input (Date object, ISO string, timestamp).
 * @param {string} formatStr - Luxon format string. Default: 'ff' (full date + time).
 * @returns {string} Formatted date string in the configured timezone.
 */
export function formatDateTime(dateInput = new Date(), formatStr = "ff") {
  // Parse the input into a Luxon DateTime
  let dt = DateTime.fromJSDate(new Date(dateInput), { zone: TIMEZONE });

  if (!dt.isValid) {
    throw new Error("Invalid date input");
  }

  return dt.toLocaleString(DateTime[formatStr] || DateTime.DATETIME_MED);
}
