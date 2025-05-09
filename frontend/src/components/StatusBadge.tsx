import { CampaignStatus } from "../lib/interfaces";
import { useState } from "react";

interface StatusBadgeProps {
  status: CampaignStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Define badge styles based on status
  const getBadgeStyles = () => {
    switch (status) {
      case CampaignStatus.UPCOMING:
        return "bg-warning-50 text-warning-700 border-warning-200";
      case CampaignStatus.ACTIVE:
        return "bg-success-50 text-success-600 border-success-200";
      case CampaignStatus.ENDED:
        return "bg-secondary-100 text-secondary-600 border-secondary-200";
      default:
        return "bg-secondary-100 text-secondary-600 border-secondary-200";
    }
  };

  // Get status label
  const getStatusLabel = () => {
    switch (status) {
      case CampaignStatus.UPCOMING:
        return "Upcoming";
      case CampaignStatus.ACTIVE:
        return "Active";
      case CampaignStatus.ENDED:
        return "Ended";
      default:
        return "Unknown";
    }
  };

  // Get tooltip text
  const getTooltipText = () => {
    switch (status) {
      case CampaignStatus.UPCOMING:
        return "This campaign is upcoming. Check back when it begins!";
      case CampaignStatus.ACTIVE:
        return "This campaign is currently active and accepting applications.";
      case CampaignStatus.ENDED:
        return "This campaign has ended and is no longer accepting applications.";
      default:
        return "Campaign status is unknown.";
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case CampaignStatus.UPCOMING:
        return "🔴";
      case CampaignStatus.ACTIVE:
        return "🟢";
      case CampaignStatus.ENDED:
        return "⚫";
      default:
        return "⚪";
    }
  };

  return (
    <div className="relative inline-block">
      <div
        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getBadgeStyles()} ${className} cursor-help transition-colors duration-150 hover:shadow-sm`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
      >
        <span className="mr-1">{getStatusIcon()}</span>
        {getStatusLabel()}
      </div>

      {showTooltip && (
        <div className="absolute z-10 mt-2 px-3 py-2 w-48 rounded-md shadow-lg bg-secondary-800 text-white text-xs leading-tight">
          {getTooltipText()}
          <div className="absolute -top-1 left-4 w-2 h-2 bg-secondary-800 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
}
