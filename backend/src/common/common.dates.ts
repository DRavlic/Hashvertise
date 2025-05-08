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
