import { format, formatDistance, parseISO, formatISO } from "date-fns";
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
  // Create a new UTC date by converting the local date's timestamp to UTC
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
 * Returns a relative time string (e.g., "5 minutes ago")
 *
 * USE CASES:
 * - For social media-style timestamps
 * - When showing recent activity
 * - When exact time is less important than recency
 *
 * @param dateString - ISO date string or timestamp in UTC
 * @returns Human-readable relative time string
 */
export function formatRelativeTime(dateString: string): string {
  const localDate = utcToLocal(dateString);
  return formatDistance(localDate, new Date(), { addSuffix: true });
}

/**
 * Returns the local timezone identifier (e.g., "America/New_York")
 *
 * USE CASES:
 * - For debugging timezone issues
 * - To display the user's current timezone in settings
 * - When timezone information needs to be sent to the server
 *
 * @returns Local timezone string
 */
export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
