# Date and Timezone Handling Strategy

This document outlines the standardized approach for handling dates and timezones throughout the Hashvertise application.

## Core Principles

1. **Backend: UTC only**

   - All dates stored in the database are in UTC
   - All date manipulations on the backend use UTC
   - All dates sent from backend to frontend are in UTC ISO format (e.g., `2023-05-15T14:30:45.123Z`)

2. **Frontend: Convert to local for display only**
   - UTC dates from the backend are converted to local timezone only for display purposes
   - User inputs for dates are converted from local to UTC before sending to the backend
   - All date processing logic still uses UTC

## Implementation Details

### Backend

The backend uses utility functions in `common.dates.ts` to ensure consistent date handling:

- `createUtcDate()`: Creates a Date object guaranteed to be in UTC (can convert existing dates or create current UTC time)
  - _Use for: timestamps in new records, standardizing external dates, getting current UTC time_

MongoDB automatically sets `createdAt` and `updatedAt` timestamps in UTC through the `timestamps: true` option in our models.

### Frontend

The frontend uses utility functions in `lib/date.ts` to handle dates:

- `utcToLocal()`: Converts UTC date strings to local Date objects
  - _Use for: preparing API dates for display, working with date pickers_
- `localToUtc()`: Converts local Date objects to UTC strings
  - _Use for: sending dates to backend, timezone-independent comparisons_
- `formatUtcDate()`: Formats UTC date strings as localized date strings
  - _Use for: displaying just the date part, listing creation dates_
- `formatUtcDateTime()`: Formats UTC date strings as localized date and time strings
  - _Use for: full timestamps, transaction history_

#### Form Date Handling

For forms that involve date/time input, we use these additional utilities:

- `isSameDay()`: Checks if two dates fall on the same calendar day
  - _Use for: validating date ranges, applying same-day constraints_
- `isAfterOrEqual()`: Checks if one date is after or equal to another
  - _Use for: validating date sequences, preventing invalid date combinations_
- `formatDateForDateInput()`: Formats dates for HTML date inputs (YYYY-MM-DD)
  - _Use for: populating date input fields_
- `formatDateForTimeInput()`: Formats dates for HTML time inputs (HH:mm)
  - _Use for: populating time input fields_
- `getMinStartDate()`: Gets current date formatted for date inputs
  - _Use for: setting minimum allowed date in date inputs_
- `getMinEndDate()`: Gets minimum allowed date for end date inputs
  - _Use for: ensuring end date is not before start date_
- `getMinEndTime()`: Gets minimum allowed time for end time inputs
  - _Use for: ensuring end time is not before start time plus required gap_

### Hedera Consensus Timestamps

Hedera consensus timestamps are immediately converted to UTC Date objects when received and stored in the database as UTC dates.

## Benefits

- **Consistency**: All internal date handling uses the same timezone (UTC)
- **Clarity**: Clear separation between storage format (UTC) and display format (local)
- **Simplicity**: Simplified date comparison and manipulation logic by using a single timezone
- **User Experience**: Users see dates in their local timezone
- **Data Integrity**: Consistent date storage format regardless of server or user timezone

## Usage Examples

### Backend Example

```typescript
import { createUtcDate } from "../common/common.dates";

// Store a timestamp in UTC
const utcTimestamp = createUtcDate(timestamp);
await TopicMessageModel.create({
  topicId,
  message,
  consensusTimestamp: utcTimestamp,
});
```

### Frontend Example

```typescript
import { formatUtcDateTime, getMinEndDate } from "../lib/date";

// Display a UTC timestamp in local timezone
<div className="timestamp">
  {formatUtcDateTime(message.consensusTimestamp)}
</div>;

// Set minimum end date in a date range picker
<input
  type="date"
  value={formatDateForDateInput(endDate)}
  min={getMinEndDate(startDate)}
/>;
```
