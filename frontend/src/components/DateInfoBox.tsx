import { CountdownTimer } from "./CountdownTimer";
import { formatUtcDate } from "../lib/date";
import { CampaignStatus } from "../lib/interfaces";

interface DateInfoBoxProps {
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  className?: string;
}

export function DateInfoBox({
  startDate,
  endDate,
  status,
  className = "",
}: DateInfoBoxProps) {
  // Determine if we should show countdown
  const shouldShowCountdown =
    status === CampaignStatus.UPCOMING || status === CampaignStatus.ACTIVE;

  // Determine the countdown target date and prefix
  let countdownTarget = "";
  let countdownPrefix = "";
  let countdownClass = "";

  if (status === CampaignStatus.UPCOMING) {
    countdownTarget = startDate;
    countdownPrefix = "Starts in:";
    countdownClass = "text-warning-700";
  } else if (status === CampaignStatus.ACTIVE) {
    countdownTarget = endDate;
    countdownPrefix = "Ends in:";
    countdownClass = "text-success-600";
  }

  return (
    <div
      className={`bg-secondary-50 rounded-md border border-secondary-200 p-4 ${className}`}
    >
      <div className="space-y-3">
        <div className="flex items-center">
          <span className="inline-block w-5 text-secondary-500 mr-2">📅</span>
          <div>
            <span className="text-sm font-medium text-secondary-700 mr-2">
              Start Date:
            </span>
            <span className="text-sm text-secondary-800">
              {formatUtcDate(startDate)}
            </span>
          </div>
        </div>

        <div className="flex items-center">
          <span className="inline-block w-5 text-secondary-500 mr-2">🏁</span>
          <div>
            <span className="text-sm font-medium text-secondary-700 mr-2">
              End Date:
            </span>
            <span className="text-sm text-secondary-800">
              {formatUtcDate(endDate)}
            </span>
          </div>
        </div>

        {shouldShowCountdown && (
          <div className="border-t border-secondary-200 pt-3 mt-2">
            <div className="flex items-center">
              <span className="inline-block w-5 text-secondary-500 mr-2">
                ⏳
              </span>
              <div className="flex-1">
                <CountdownTimer
                  targetDate={countdownTarget}
                  prefix={countdownPrefix}
                  className={`text-base font-bold ${countdownClass}`}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
