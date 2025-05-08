import { format, parseISO, formatISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

/**
 * Converts a UTC date string to a Date object in the local timezone
 *
 * USE CASES:
 * - When displaying UTC dates from the API in the user's local timezone
 * - Before applying date-fns formatting functions to UTC date strings
 * - When working with calendar or date picker components that expect local dates
 *
 * @param dateString - ISO date string in UTC
 * @returns Date object adjusted to local timezone
 */
export function utcToLocal(dateString: string): Date {
  const date =
    typeof dateString === "string"
      ? parseISO(dateString)
      : new Date(dateString);
  return toZonedTime(date, Intl.DateTimeFormat().resolvedOptions().timeZone);
}

/**
 * Converts a local Date object to a UTC ISO string
 *
 * USE CASES:
 * - When sending dates from user inputs back to the server
 * - When storing dates in localStorage or other client-side storage
 * - When comparing dates that should be timezone-independent
 *
 * @param date - Local date object
 * @returns ISO string in UTC
 */
export function localToUtc(date: Date): string {
  return formatISO(new Date(date.toISOString()));
}

/**
 * Formats a UTC date string to a localized date string
 *
 * USE CASES:
 * - When showing only the date portion of timestamps (e.g., "Apr 15, 2023")
 * - For listing creation dates in user content
 * - When date and time are separate in the UI
 *
 * @param dateString - ISO date string or timestamp in UTC
 * @param formatStr - date-fns format string (defaults to local date format)
 * @returns Formatted date string in local timezone
 */
export function formatUtcDate(
  dateString: string,
  formatStr: string = "PP"
): string {
  const localDate = utcToLocal(dateString);
  return format(localDate, formatStr);
}

/**
 * Formats a UTC date string to a localized date and time string
 *
 * USE CASES:
 * - When showing full timestamps with both date and time
 * - For transaction/event history displays
 * - For precise time-sensitive information
 *
 * @param dateString - ISO date string or timestamp in UTC
 * @param formatStr - date-fns format string (defaults to local date and time format)
 * @returns Formatted date and time string in local timezone
 */
export function formatUtcDateTime(
  dateString: string,
  formatStr: string = "PPpp"
): string {
  const localDate = utcToLocal(dateString);
  return format(localDate, formatStr);
}

/**
 * Checks if two dates fall on the same calendar day
 *
 * @param date1 - First date to compare
 * @param date2 - Second date to compare
 * @returns Boolean indicating if both dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Checks if the first date is after or equal to the second date
 *
 * @param date1 - First date to compare
 * @param date2 - Second date to compare
 * @returns Boolean indicating if date1 is after or equal to date2
 */
export function isAfterOrEqual(date1: Date, date2: Date): boolean {
  return date1.getTime() >= date2.getTime();
}

/**
 * Formats a date for HTML date input (YYYY-MM-DD)
 *
 * USE CASES:
 * - When populating HTML date input fields
 * - When preparing dates for form submissions
 *
 * @param date - Date object to format (or null)
 * @returns Formatted date string in YYYY-MM-DD format or empty string if null
 */
export function formatDateForDateInput(date: Date | null): string {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
}

/**
 * Formats a date for HTML time input (HH:mm)
 *
 * USE CASES:
 * - When populating HTML time input fields
 * - When preparing times for form submissions
 *
 * @param date - Date object to format (or null)
 * @returns Formatted time string in HH:mm format or empty string if null
 */
export function formatDateForTimeInput(date: Date | null): string {
  if (!date) return "";
  return format(date, "HH:mm");
}

/**
 * Gets the current date formatted for HTML date input
 *
 * USE CASES:
 * - When setting minimum date values in date inputs
 * - For initializing date fields with the current date
 * - When enforcing that dates cannot be in the past
 *
 * @returns Current date formatted as YYYY-MM-DD
 */
export function getMinStartDate(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Gets the minimum allowed date for an end date input
 *
 * USE CASES:
 * - To ensure end date is not before start date
 * - When implementing validation rules for date ranges
 * - For form interfaces with dependent date fields
 *
 * @param startDate - The start date that determines the minimum (or null)
 * @returns The minimum date formatted as YYYY-MM-DD
 */
export function getMinEndDate(startDate: Date | null): string {
  if (startDate) {
    return format(startDate, "yyyy-MM-dd");
  }
  return getMinStartDate();
}

/**
 * Gets the minimum allowed time for an end time input when dates are the same day
 *
 * USE CASES:
 * - When implementing time range constraints on same-day events
 * - For ensuring end time is after start time plus a minimum gap
 * - In scheduling interfaces where time gaps are required
 *
 * @param startDate - The start date and time (or null)
 * @param endDate - The end date and time (or null)
 * @param minGapMinutes - Minimum gap required between start and end times in minutes (default: 1)
 * @returns Minimum time formatted as HH:mm or null if dates are not on the same day
 */
export function getMinEndTime(
  startDate: Date | null,
  endDate: Date | null,
  minGapMinutes: number = 1
): string | null {
  if (startDate && endDate && isSameDay(startDate, endDate)) {
    // If on the same day, end time must be after start time
    const startHours = startDate.getHours();
    const startMinutes = startDate.getMinutes() + minGapMinutes; // At least minGapMinutes later

    const hours = startMinutes >= 60 ? (startHours + 1) % 24 : startHours;
    const minutes = startMinutes >= 60 ? startMinutes - 60 : startMinutes;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  }
  return null;
}
