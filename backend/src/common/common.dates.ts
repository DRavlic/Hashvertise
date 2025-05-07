/**
 * Date utility functions for backend
 *
 * All dates in the application should be stored and manipulated in UTC
 * This helps ensure consistency across different timezones
 */

/**
 * Creates a Date object guaranteed to be in UTC
 * Can convert an existing date to UTC or create a new UTC date when no argument is provided
 *
 * USE CASES:
 * - When creating timestamps for new database records
 * - When converting external timestamps to standardized UTC format
 * - When you need the current time in UTC
 * - Before storing any date in the database
 *
 * @param date Optional date to convert (defaults to current time)
 * @returns Date in UTC timezone
 */
export function createUtcDate(date: Date = new Date()): Date {
  // Create a new date using the UTC timestamp to ensure timezone is correct
  return new Date(date.toISOString());
}

/**
 * Converts a date string to a UTC Date object
 *
 * USE CASES:
 * - When parsing date strings from API requests
 * - When reading dates from external sources
 * - When converting user input date strings to Date objects
 *
 * @param dateString Date string to convert
 * @returns Date in UTC timezone
 */
export function parseUtcDate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Formats a date as an ISO string (in UTC)
 *
 * USE CASES:
 * - When returning dates in API responses
 * - When logging date information
 * - When serializing dates for storage or transmission
 *
 * @param date Date to format
 * @returns ISO string representation in UTC
 */
export function formatUtcIsoString(date: Date): string {
  return date.toISOString();
}

/**
 * Validates if a date string is a valid ISO date
 *
 * USE CASES:
 * - When validating date inputs in API requests
 * - Before parsing date strings to prevent errors
 * - When verifying data from external sources
 *
 * @param dateString String to validate
 * @returns True if valid ISO date string
 */
export function isValidIsoDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString() === dateString;
}
