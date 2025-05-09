/**
 * Campaign-related interfaces
 */

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

export interface Campaign {
  _id: string;
  topicId: string;
  name: string;
  accountId: string;
  prizePool: number;
  requirement: string;
  createdAt: string;
  startDate: string;
  endDate: string;
}

export interface CampaignFormData {
  name: string;
  prizePool: number;
  requirement: string;
  startDate: Date | null;
  endDate: Date | null;
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
