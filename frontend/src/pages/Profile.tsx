import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { API_ENDPOINTS } from "../lib/environment";
import { showError, getErrorMessage } from "../lib/toast";
import { getCampaignStatus } from "../lib/date";
import { UserParticipation, CampaignStatus } from "../lib/interfaces";
import { StatusBadge } from "../components/StatusBadge";

export function Profile() {
  const { accountId } = useWallet();
  const [participations, setParticipations] = useState<UserParticipation[]>([]);
  const [filteredParticipations, setFilteredParticipations] = useState<
    UserParticipation[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatuses, setSelectedStatuses] = useState<CampaignStatus[]>([
    CampaignStatus.UPCOMING,
    CampaignStatus.ACTIVE,
    CampaignStatus.ENDED,
  ]);

  useEffect(() => {
    if (!accountId) {
      setIsLoading(false);
      return;
    }

    const fetchParticipations = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          API_ENDPOINTS.GET_PARTICIPATIONS(accountId)
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch participations");
        }

        setParticipations(data.participations);
      } catch (error) {
        console.error("Error fetching participations:", getErrorMessage(error));
        showError(`Error fetching participations: ${getErrorMessage(error)}`);
        setParticipations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipations();
  }, [accountId]);

  // Filter participations based on selected statuses
  useEffect(() => {
    if (selectedStatuses.length === 0) {
      setFilteredParticipations(participations);
      return;
    }

    const filtered = participations.filter((participation) => {
      const status = getCampaignStatus(
        participation.campaign.startDateUtc,
        participation.campaign.endDateUtc
      );
      return selectedStatuses.includes(status);
    });

    setFilteredParticipations(filtered);
  }, [participations, selectedStatuses]);

  const handleStatusChange = (status: CampaignStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const statusOptions: { label: string; value: CampaignStatus }[] = [
    { label: "Upcoming", value: CampaignStatus.UPCOMING },
    { label: "Active", value: CampaignStatus.ACTIVE },
    { label: "Ended", value: CampaignStatus.ENDED },
  ];

  if (!accountId) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-secondary-50 p-8 rounded-lg border border-secondary-200 text-center">
          <h2 className="text-xl font-semibold text-secondary-800 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-secondary-600">
            Please connect your wallet to view your profile and participations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-600 mb-2">Profile</h1>
        <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-200">
          <p className="text-sm text-secondary-600">Account ID</p>
          <p className="text-lg font-mono text-secondary-800">{accountId}</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-secondary-800 mb-4">
          My Participations
        </h2>

        {/* Filter Bar */}
        <div className="bg-white p-3 rounded-lg shadow-sm border border-secondary-200 mb-6">
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Filter by Status
          </label>
          <div className="flex items-center space-x-4">
            {statusOptions.map(({ label, value }) => (
              <label key={value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(value)}
                  onChange={() => handleStatusChange(value)}
                  className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredParticipations.length === 0 ? (
          <div className="bg-secondary-50 p-8 rounded-lg border border-secondary-200 text-center">
            <h3 className="text-lg font-semibold text-secondary-800 mb-2">
              No Participations Found
            </h3>
            <p className="text-secondary-600 mb-6">
              {selectedStatuses.length === 0
                ? "Select at least one status to see participations."
                : participations.length === 0
                ? "You haven't participated in any campaigns yet."
                : "No participations match the selected filters."}
            </p>
            {participations.length === 0 && (
              <Link
                to="/campaigns"
                className="px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors inline-block"
              >
                Browse Campaigns
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredParticipations.map((participation) => {
              const campaignStatus = getCampaignStatus(
                participation.campaign.startDateUtc,
                participation.campaign.endDateUtc
              );

              return (
                <div
                  key={participation._id}
                  className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Campaign Name and Status */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-secondary-800 truncate">
                          {participation.campaign.name}
                        </h3>
                        <StatusBadge
                          status={campaignStatus}
                          className="flex-shrink-0"
                        />
                      </div>
                      <p className="text-sm text-secondary-600">
                        Applied with:{" "}
                        <span className="font-medium text-secondary-800">
                          {participation.xHandle}
                        </span>
                      </p>
                    </div>

                    {/* Prize Info */}
                    <div className="flex items-center gap-6 flex-shrink-0">
                      {campaignStatus === CampaignStatus.ENDED ? (
                        <div className="text-right min-w-[120px]">
                          <div className="text-xs text-secondary-500 mb-1">
                            Your Prize
                          </div>
                          {participation.prizeWonHbar === null ? (
                            <div className="text-sm text-warning-600 font-medium">
                              Pending...
                            </div>
                          ) : participation.prizeWonHbar === 0 ? (
                            <div className="text-sm text-secondary-600">
                              No prize
                            </div>
                          ) : (
                            <div className="text-base font-semibold text-success-600">
                              {participation.prizeWonHbar.toFixed(2)} HBAR
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-right">
                          <div className="text-xs text-secondary-500 mb-1">
                            Prize Pool
                          </div>
                          <div className="text-base font-semibold text-secondary-800">
                            {participation.campaign.prizePool.toFixed(2)} HBAR
                          </div>
                        </div>
                      )}

                      {/* View Campaign Link */}
                      <Link
                        to={`/campaign/${participation.campaign.topicId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 font-medium hover:text-primary-700 whitespace-nowrap"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
