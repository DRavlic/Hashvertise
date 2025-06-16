import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { HashConnectConnectionState } from "hashconnect";
import { API_ENDPOINTS } from "../lib/environment";
import {
  TOPIC_MESSAGES_PER_PAGE,
  MESSAGE_REFRESH_DELAY_MS,
  X_HANDLE_INPUT_DELAY_MS,
  COUNTDOWN_REFRESH_INTERVAL_MS,
  CAMPAIGN_COMPLETION_MESSAGE_PREFIX,
} from "../lib/constants";
import { showError, showSuccess, getErrorMessage } from "../lib/toast";
import { submitTopicMessage, getLedgerId } from "../lib/wallet";
import { formatUtcDateTime, getCampaignStatusInfo } from "../lib/date";
import {
  Campaign,
  TopicMessage,
  CampaignStatus,
  SubmissionStep,
} from "../lib/interfaces";
import { StatusBadge } from "../components/StatusBadge";
import { DateInfoBox } from "../components/DateInfoBox";
import { getHashscanTopicUrl } from "../lib/url";

export function CampaignDetails() {
  const { topicId } = useParams<{ topicId: string }>();
  const { connectionStatus, accountId } = useWallet();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [messages, setMessages] = useState<TopicMessage[]>([]);
  const [XHandle, setXHandle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<SubmissionStep>(
    SubmissionStep.IDLE
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showXHandleInput, setShowXHandleInput] = useState(false);
  const [xHandleError, setXHandleError] = useState<string>("");
  const [campaignStatusInfo, setCampaignStatusInfo] = useState<ReturnType<
    typeof getCampaignStatusInfo
  > | null>(null);

  const isPaired = connectionStatus === HashConnectConnectionState.Paired;

  // Validate X handle format
  const validateXHandle = (handle: string): string => {
    if (!handle.trim()) {
      return "";
    }

    // Remove @ if present for validation
    const cleanHandle = handle.replace(/^@/, "");

    // Check allowed characters (letters, numbers, underscore only)
    const validFormat = /^[A-Za-z0-9_]+$/;
    if (!validFormat.test(cleanHandle)) {
      return "X handle can only contain letters, numbers, and underscores";
    }

    // Check that it's not all numbers
    const allNumbers = /^[0-9_]+$/;
    if (allNumbers.test(cleanHandle)) {
      return "X handle must contain at least one letter";
    }

    // Check length (4-15 characters)
    if (cleanHandle.length < 4) {
      return "X handle must be at least 4 characters long";
    }
    if (cleanHandle.length > 15) {
      return "X handle cannot be longer than 15 characters";
    }

    return "";
  };

  // Update campaign status periodically
  useEffect(() => {
    if (!campaign?.startDate || !campaign?.endDate) return;

    const updateStatus = () => {
      setCampaignStatusInfo(
        getCampaignStatusInfo(campaign.startDate, campaign.endDate)
      );
    };

    // Initial update
    updateStatus();

    // Update every minute to keep timers accurate
    const interval = setInterval(updateStatus, COUNTDOWN_REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [campaign?.startDate, campaign?.endDate]);

  useEffect(() => {
    // Delay showing the form to prevent flashing
    const timer = setTimeout(() => {
      setShowXHandleInput(true);
    }, X_HANDLE_INPUT_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!topicId) return;

    const fetchCampaignData = async () => {
      setIsLoading(true);
      try {
        // Fetch campaign details
        const campaignResponse = await fetch(
          API_ENDPOINTS.GET_CAMPAIGN(topicId)
        );
        const campaignData = await campaignResponse.json();

        if (!campaignResponse.ok) {
          throw new Error(campaignData.error || "Failed to fetch campaign");
        }

        setCampaign(campaignData.campaign);

        // Fetch topic messages
        const messagesResponse = await fetch(
          `${API_ENDPOINTS.GET_TOPIC_MESSAGES(
            topicId
          )}?limit=${TOPIC_MESSAGES_PER_PAGE}`
        );
        const messagesData = await messagesResponse.json();

        if (!messagesResponse.ok) {
          throw new Error(messagesData.error || "Failed to fetch messages");
        }

        setMessages(messagesData.messages || []);
      } catch (error) {
        console.info(
          "Campaign data could not be fetched:",
          getErrorMessage(error)
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaignData();
  }, [topicId, refreshTrigger]);

  const handleApply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isPaired) {
      showError("Please connect your wallet first");
      return;
    }

    if (!XHandle.trim()) {
      showError("Please enter your X handle");
      return;
    }

    if (!topicId || !campaign) {
      showError("Campaign information is missing");
      return;
    }

    // Check if campaign is active
    if (campaignStatusInfo?.status !== CampaignStatus.ACTIVE) {
      showError("You can only apply to active campaigns");
      return;
    }

    setIsSubmitting(true);

    try {
      // Remove @ if present and add it back for consistency
      const normalizedXHandle = XHandle.replace(/^@/, "");
      const formattedXHandle = `@${normalizedXHandle}`;

      // Validate X handle format
      const validationError = validateXHandle(normalizedXHandle);
      if (validationError) {
        showError(validationError);
        setIsSubmitting(false);
        return;
      }

      // Check if this X handle already exists in applicant messages
      const alreadyApplied = applicantMessages.some((msg) => {
        const [, handle] = msg.message.split(", ");
        return handle?.toLowerCase() === formattedXHandle.toLowerCase();
      });

      if (alreadyApplied) {
        showError("You have already applied to this campaign");
        setIsSubmitting(false);
        return;
      }

      // Step 0: Validate and save user info including X handle - to prevent users from submitting message to topic with invalid X handles
      setSubmissionStep(SubmissionStep.VALIDATING_USER);
      const validateResponse = await fetch(API_ENDPOINTS.VALIDATE_USER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId,
          xHandle: formattedXHandle,
        }),
      });

      const validateData = await validateResponse.json();

      if (!validateResponse.ok) {
        throw new Error(validateData.error || "Failed to validate user info");
      }

      // Step 1: Submit topic message
      setSubmissionStep(SubmissionStep.SUBMITTING_MESSAGE);
      const submitResult = await submitTopicMessage(
        `${accountId}, ${formattedXHandle}`,
        topicId
      );

      if (!submitResult) {
        // If submitTopicMessage returns null, it already showed error messages
        setIsSubmitting(false);
        setSubmissionStep(SubmissionStep.IDLE);
        return;
      }

      showSuccess("Successfully applied to the campaign!");
      setXHandle("");

      // Refresh messages list after MESSAGE_REFRESH_DELAY_MS seconds to give backend time to process the message
      setTimeout(() => {
        setRefreshTrigger((prev) => prev + 1);
      }, MESSAGE_REFRESH_DELAY_MS);
    } catch (error) {
      console.error("Error applying to campaign:", getErrorMessage(error));
      showError(`Error applying to campaign: ${getErrorMessage(error)}`);
    } finally {
      setIsSubmitting(false);
      setSubmissionStep(SubmissionStep.IDLE);
    }
  };

  // Function to get the appropriate button text based on the current step
  const getButtonText = () => {
    if (!isSubmitting) return "Apply Now";

    switch (submissionStep) {
      case SubmissionStep.VALIDATING_USER:
        return "Getting User Info...";
      case SubmissionStep.SUBMITTING_MESSAGE:
        return "Submitting...";
      default:
        return "Processing...";
    }
  };

  // Check if user should be able to apply (only for active campaigns)
  const canApply = campaignStatusInfo?.status === CampaignStatus.ACTIVE;

  // Filter out campaign completion messages to show only applicants
  const applicantMessages = messages.filter(
    (message) => !message.message.includes(CAMPAIGN_COMPLETION_MESSAGE_PREFIX)
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-secondary-50 p-8 rounded-lg border border-secondary-200 text-center">
          <h2 className="text-xl font-semibold text-secondary-800 mb-4">
            Campaign Not Found
          </h2>
          <p className="text-secondary-600 mb-6">
            The campaign you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/campaigns"
            className="px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors inline-block"
          >
            Return to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link
        to="/campaigns"
        className="inline-flex items-center text-primary-600 mb-6 hover:text-primary-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        Back to Campaigns
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
            <div className="flex flex-wrap items-center mb-6">
              <h1 className="text-2xl font-bold text-primary-600 mr-3 break-words">
                {campaign.name}
              </h1>

              {campaignStatusInfo && (
                <StatusBadge
                  status={campaignStatusInfo.status}
                  className="mt-1.5 sm:mt-0"
                />
              )}
            </div>

            <div className="flex items-center group relative mb-4 text-sm text-secondary-500">
              <span className="text-secondary-400 mr-1">🔗</span>
              <span>Topic ID: </span>
              <a
                href={getHashscanTopicUrl(campaign.topicId, getLedgerId())}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-primary-600 hover:text-primary-700 hover:underline flex items-center"
                title="View on Hashscan"
              >
                <span>{campaign.topicId}</span>
              </a>
            </div>

            {campaignStatusInfo && (
              <DateInfoBox
                startDate={campaign.startDate}
                endDate={campaign.endDate}
                status={campaignStatusInfo.status}
                className="mb-6"
              />
            )}

            <div className="text-lg font-medium text-success-600 mb-4 flex items-center">
              <span className="text-success-600 mr-2">💰</span>
              Prize Pool: ${campaign.prizePool.toFixed(2)}
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-secondary-800 mb-2 flex items-center">
                <span className="text-secondary-600 mr-2">📋</span>
                Requirement
              </h2>
              <div
                className="p-4 bg-secondary-50 rounded-md text-secondary-600 border border-secondary-200"
                style={{ whiteSpace: "pre-wrap", overflowWrap: "break-word" }}
              >
                {campaign.requirement}
              </div>
            </div>

            {/* Apply Form */}
            <div className="border-t border-secondary-200 pt-6">
              <h2 className="text-lg font-semibold text-secondary-800 mb-4">
                Apply for this Campaign
              </h2>

              {!showXHandleInput ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              ) : !isPaired ? (
                <div className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-md text-warning-700">
                  Please connect your wallet first to apply for this campaign.
                </div>
              ) : !canApply ? (
                <div className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-md text-warning-700">
                  {campaignStatusInfo?.status === CampaignStatus.UPCOMING
                    ? "This campaign is upcoming. Please wait until the start date to apply."
                    : "This campaign has ended and is no longer accepting applications."}
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-4">
                  <div>
                    <label
                      htmlFor="XHandle"
                      className="block text-sm font-medium text-secondary-700 mb-1"
                    >
                      Your X Handle
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-secondary-500">@</span>
                      </div>
                      <input
                        type="text"
                        id="XHandle"
                        value={XHandle}
                        onChange={(e) => {
                          const value = e.target.value.replace(/^@/, "");
                          setXHandle(value);
                          // Validate on change and set error state
                          const error = validateXHandle(value);
                          setXHandleError(error);
                        }}
                        required
                        className="w-full pl-8 pr-4 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="yourxhandle"
                      />
                    </div>
                    {xHandleError && (
                      <p className="mt-1 text-sm text-red-600">
                        {xHandleError}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-secondary-500">
                      Note: This will be publicly visible on the Hedera network
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !isPaired}
                    className="px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors disabled:bg-secondary-400 disabled:cursor-not-allowed"
                  >
                    {getButtonText()}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Applicants List */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
            <h2 className="text-lg font-semibold text-secondary-800 mb-4 flex justify-between items-center">
              <span>Applicants</span>
              <span className="text-secondary-500 text-sm font-normal">
                {applicantMessages.length} Total
              </span>
            </h2>

            {applicantMessages.length === 0 ? (
              <p className="text-secondary-500 text-center py-4">
                No applicants yet. Be the first!
              </p>
            ) : (
              <ul className="divide-y divide-secondary-200">
                {applicantMessages.map((message) => (
                  <li key={message._id} className="py-3">
                    <div className="font-medium text-secondary-800">
                      {message.message}
                    </div>
                    <div className="text-xs text-secondary-500 mt-1">
                      {formatUtcDateTime(message.consensusTimestamp)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
