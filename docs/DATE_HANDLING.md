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
- `parseUtcDate()`: Parses a date string to a UTC date object
  - _Use for: parsing API input, reading dates from external sources_
- `formatUtcIsoString()`: Formats a date as an ISO string in UTC
  - _Use for: API responses, logging, serialization_
- `isValidIsoDate()`: Validates if a string is a valid ISO date
  - _Use for: input validation, preventing parsing errors_

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
- `formatRelativeTime()`: Formats UTC date strings as relative time (e.g., "5 minutes ago")
  - _Use for: social-style timestamps, recent activity_
- `getLocalTimezone()`: Returns the local timezone identifier
  - _Use for: debugging, displaying settings, sending timezone info_

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
import { formatUtcDateTime } from "../lib/date";

// Display a UTC timestamp in local timezone
<div className="timestamp">
  {formatUtcDateTime(message.consensusTimestamp)}
</div>;
```
