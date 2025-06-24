/**
 * Campaign Sort Options
 * First value is the field to sort by, second value is the sort order
 * Needs to match the backend values in model
 */
export enum CampaignSortOption {
  NEWEST = "createdAt-desc",
  PRIZE_HIGH_TO_LOW = "prizePool-desc",
  PRIZE_LOW_TO_HIGH = "prizePool-asc",
  START_DATE_ASC = "startDateUtc-asc",
  START_DATE_DESC = "startDateUtc-desc",
  END_DATE_ASC = "endDateUtc-asc",
  END_DATE_DESC = "endDateUtc-desc",
}
