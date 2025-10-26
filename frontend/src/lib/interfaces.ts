import { CampaignSortOption } from "./enums";

/**
 * Campaign-related interfaces
 */

export enum CreationStep {
  IDLE = "IDLE",
  VALIDATING_USER = "VALIDATING_USER",
  CREATING_TOPIC = "CREATING_TOPIC",
  DEPOSITING_HBAR = "DEPOSITING_HBAR",
  SIGNING_DATA = "SIGNING_DATA",
  CREATING_CAMPAIGN = "CREATING_CAMPAIGN",
}

export enum SubmissionStep {
  IDLE = "IDLE",
  VALIDATING_USER = "VALIDATING_USER",
  SUBMITTING_MESSAGE = "SUBMITTING_MESSAGE",
}

export enum CampaignStatus {
  UPCOMING = "UPCOMING",
  ACTIVE = "ACTIVE",
  ENDED = "ENDED",
}

export interface CampaignStatusInfo {
  status: CampaignStatus;
  statusLabel: string;
  statusColor: string;
  timeDisplay: string | null;
}

export interface CampaignResultEntry {
  accountId: string;
  xHandle: string;
  prizeWonHbar: number;
}

export interface Campaign {
  _id: string;
  topicId: string;
  name: string;
  accountId: string;
  prizePool: number;
  requirement: string;
  createdAt: string;
  startDateUtc: string;
  endDateUtc: string;
  rewardsDistributed?: boolean; // TODO: remove this field? We could use resultTxId to determine if rewards were distributed
  resultTxId?: string;
  results?: CampaignResultEntry[];
  noValidApplications?: boolean;
}

export interface CampaignFormData {
  name: string;
  prizePool: number;
  requirement: string;
  startDate: Date | null;
  endDate: Date | null;
}

export interface CampaignsFilterBarProps {
  onFilterChange: (filters: CampaignFilters) => void;
}

export interface CampaignFilters {
  searchTerm: string;
  sortOption: CampaignSortOption;
  selectedStatuses: CampaignStatus[];
}

/**
 * Message-related interfaces
 */

export interface TopicMessage {
  _id: string;
  topicId: string;
  message: string;
  consensusTimestamp: string;
  createdAt: string;
}

/**
 * Hashvertise Configuration interfaces
 */

export interface HashvertiseConfig {
  feeBasisPoints: number; // Fee in basis points (e.g., 1% = 100 basis points, 20% = 2000 basis points)
  minimumDepositInTinybars: number;
  contractAddress: string;
}

export interface CampaignCreationReceipt {
  prizeAmountHbar: number; // Prize amount in HBAR
  feeAmountHbar: number; // Fee amount in HBAR
  totalAmountHbar: number; // Total amount to be paid in HBAR
  feeBasisPoints: number; // Fee rate in basis points
  isAboveMinimum: boolean; // Whether total amount meets minimum deposit
  startDate: Date; // Campaign start date
  endDate: Date; // Campaign end date
}

/**
 * Campaign and participation interfaces
 */

export interface UserParticipation {
  _id: string;
  xHandle: string;
  prizeWonHbar: number | null;
  campaign: {
    topicId: string;
    name: string;
    prizePool: number;
    startDateUtc: string;
    endDateUtc: string;
  };
}
export interface UserCreatedCampaign {
  _id: string;
  topicId: string;
  name: string;
  prizePool: number;
  startDateUtc: string;
  endDateUtc: string;
  participantCount: number;
}
