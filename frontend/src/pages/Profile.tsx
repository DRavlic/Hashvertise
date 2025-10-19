import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { API_ENDPOINTS } from "../lib/environment";
import { showError, getErrorMessage } from "../lib/toast";
import { getCampaignStatus } from "../lib/date";
import {
  UserParticipation,
  UserCreatedCampaign,
  CampaignStatus,
} from "../lib/interfaces";
import { StatusBadge } from "../components/StatusBadge";

type TabType = "participations" | "created";

export function Profile() {
  const { accountId } = useWallet();
  const [activeTab, setActiveTab] = useState<TabType>("participations");
  const [participations, setParticipations] = useState<UserParticipation[]>([]);
  const [createdCampaigns, setCreatedCampaigns] = useState<
    UserCreatedCampaign[]
  >([]);
  const [filteredParticipations, setFilteredParticipations] = useState<
    UserParticipation[]
  >([]);
  const [filteredCreatedCampaigns, setFilteredCreatedCampaigns] = useState<
    UserCreatedCampaign[]
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

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [participationsResponse, createdCampaignsResponse] =
          await Promise.all([
            fetch(API_ENDPOINTS.GET_PARTICIPATIONS(accountId)),
            fetch(API_ENDPOINTS.GET_CREATED_CAMPAIGNS(accountId)),
          ]);

        const participationsData = await participationsResponse.json();
        const createdCampaignsData = await createdCampaignsResponse.json();

        if (!participationsResponse.ok) {
          throw new Error(
            participationsData.error || "Failed to fetch participations"
          );
        }

        if (!createdCampaignsResponse.ok) {
          throw new Error(
            createdCampaignsData.error || "Failed to fetch created campaigns"
          );
        }

        setParticipations(participationsData.participations || []);
        setCreatedCampaigns(createdCampaignsData.campaigns || []);
      } catch (error) {
        console.error("Error fetching profile data:", getErrorMessage(error));
        showError(`Error fetching profile data: ${getErrorMessage(error)}`);
        setParticipations([]);
        setCreatedCampaigns([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [accountId]);

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

  useEffect(() => {
    if (selectedStatuses.length === 0) {
      setFilteredCreatedCampaigns(createdCampaigns);
      return;
    }

    const filtered = createdCampaigns.filter((campaign) => {
      const status = getCampaignStatus(
        campaign.startDateUtc,
        campaign.endDateUtc
      );
      return selectedStatuses.includes(status);
    });

    setFilteredCreatedCampaigns(filtered);
  }, [createdCampaigns, selectedStatuses]);

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

  const currentList =
    activeTab === "participations"
      ? filteredParticipations
      : filteredCreatedCampaigns;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-600 mb-2">Profile</h1>
        <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-200">
          <p className="text-sm text-secondary-600">Account ID</p>
          <p className="text-lg font-mono text-secondary-800">{accountId}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
        <div className="flex items-center gap-6 mb-6 border-b border-secondary-200 pb-4">
          <button
            onClick={() => setActiveTab("participations")}
            className={`text-lg font-semibold pb-2 border-b-2 transition-colors ${
              activeTab === "participations"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-secondary-600 hover:text-secondary-800"
            }`}
          >
            My Participations
          </button>
          <button
            onClick={() => setActiveTab("created")}
            className={`text-lg font-semibold pb-2 border-b-2 transition-colors ${
              activeTab === "created"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-secondary-600 hover:text-secondary-800"
            }`}
          >
            My Campaigns
          </button>
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-3">
            {statusOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(option.value)}
                  onChange={() => handleStatusChange(option.value)}
                  className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-secondary-700">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-secondary-600">Loading...</p>
          </div>
        ) : currentList.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-secondary-600 mb-4">
              {activeTab === "participations"
                ? "No campaign participations found."
                : "No created campaigns found."}
            </p>
            {activeTab === "created" && (
              <Link
                to="/campaign/new"
                className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Create Campaign
              </Link>
            )}
            {activeTab === "participations" && (
              <Link
                to="/campaigns"
                className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Browse Campaigns
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {activeTab === "participations" &&
              filteredParticipations.map((participation) => {
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

            {activeTab === "created" &&
              filteredCreatedCampaigns.map((campaign) => {
                const campaignStatus = getCampaignStatus(
                  campaign.startDateUtc,
                  campaign.endDateUtc
                );

                return (
                  <div
                    key={campaign._id}
                    className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold text-secondary-800 truncate">
                            {campaign.name}
                          </h3>
                          <StatusBadge
                            status={campaignStatus}
                            className="flex-shrink-0"
                          />
                        </div>
                        <p className="text-sm text-secondary-600">
                          Participants:{" "}
                          <span className="font-medium text-secondary-800">
                            {campaign.participantCount}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-6 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-xs text-secondary-500 mb-1">
                            Prize Pool
                          </div>
                          <div className="text-base font-semibold text-secondary-800">
                            {campaign.prizePool.toFixed(2)} HBAR
                          </div>
                        </div>

                        <Link
                          to={`/campaign/${campaign.topicId}`}
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
