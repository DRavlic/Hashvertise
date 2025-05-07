import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { HashConnectConnectionState } from "hashconnect";
import { API_ENDPOINTS } from "../lib/environment";
import { TOPIC_MESSAGES_PER_PAGE } from "../lib/constants";
import { showError, showSuccess } from "../lib/toast";
import { signMessage, submitTopicMessage } from "../lib/wallet";

interface Campaign {
  _id: string;
  topicId: string;
  name: string;
  accountId: string;
  prizePool: number;
  requirement: string;
  createdAt: string;
}

interface TopicMessage {
  _id: string;
  topicId: string;
  message: string;
  consensusTimestamp: string;
  createdAt: string;
}

export function CampaignDetails() {
  const { topicId } = useParams<{ topicId: string }>();
  const { connectionStatus } = useWallet();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [messages, setMessages] = useState<TopicMessage[]>([]);
  const [twitterHandle, setTwitterHandle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isPaired = connectionStatus === HashConnectConnectionState.Paired;

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
        console.error("Error fetching campaign data:", error);
        showError(
          `Error fetching campaign data: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
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

    if (!twitterHandle.trim()) {
      showError("Please enter your Twitter handle");
      return;
    }

    if (!topicId || !campaign) {
      showError("Campaign information is missing");
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if this Twitter handle already exists in messages
      const alreadyApplied = messages.some(
        (msg) => msg.message.toLowerCase() === twitterHandle.toLowerCase()
      );

      if (alreadyApplied) {
        showError("You have already applied to this campaign");
        setIsSubmitting(false);
        return;
      }

      // Submit topic message
      const consensusTimestamp = await submitTopicMessage(
        twitterHandle,
        topicId
      );

      if (!consensusTimestamp) {
        // If submitTopicMessage returns null, it already showed error messages
        setIsSubmitting(false);
        return;
      }

      // Create message for signature
      const message = `${topicId}, ${consensusTimestamp}, ${twitterHandle}`;

      // Sign the message
      const signature = await signMessage(message);

      if (!signature) {
        // If signMessage returns null, it already showed error messages
        setIsSubmitting(false);
        return;
      }

      // Verify the message with backend
      const response = await fetch(API_ENDPOINTS.VERIFY_TOPIC_MESSAGE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          signature,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify message");
      }

      showSuccess("Successfully applied to the campaign!");
      setTwitterHandle("");

      // Refresh messages list
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error applying to campaign:", error);
      showError(
        `Error applying to campaign: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
            to="/"
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
        to="/"
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
        {/* Campaign Details */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
            <h1 className="text-2xl font-bold text-primary-600 mb-4">
              {campaign.name}
            </h1>

            <div className="flex items-center text-sm text-secondary-500 mb-4">
              <span className="mr-4">
                Created: {new Date(campaign.createdAt).toLocaleDateString()}
              </span>
              <span>Topic ID: {campaign.topicId}</span>
            </div>

            <div className="text-lg font-medium text-success-600 mb-4">
              Prize Pool: ${campaign.prizePool.toFixed(2)}
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-secondary-800 mb-2">
                Requirement
              </h2>
              <p className="text-secondary-600 whitespace-pre-line">
                {campaign.requirement}
              </p>
            </div>

            {/* Apply Form */}
            <div className="border-t border-secondary-200 pt-6">
              <h2 className="text-lg font-semibold text-secondary-800 mb-4">
                Apply for this Campaign
              </h2>

              {!isPaired ? (
                <div className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-md text-warning-700">
                  Please connect your wallet first to apply for this campaign.
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-4">
                  <div>
                    <label
                      htmlFor="twitterHandle"
                      className="block text-sm font-medium text-secondary-700 mb-1"
                    >
                      Your Twitter Handle
                    </label>
                    <input
                      type="text"
                      id="twitterHandle"
                      value={twitterHandle}
                      onChange={(e) => setTwitterHandle(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="@yourtwitterhandle"
                    />
                    <p className="mt-1 text-sm text-secondary-500">
                      This will be publicly visible on the Hedera network
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !isPaired}
                    className="px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors disabled:bg-secondary-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Submitting..." : "Apply Now"}
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
                {messages.length} Total
              </span>
            </h2>

            {messages.length === 0 ? (
              <p className="text-secondary-500 text-center py-4">
                No applicants yet. Be the first!
              </p>
            ) : (
              <ul className="divide-y divide-secondary-200">
                {messages.map((message) => (
                  <li key={message._id} className="py-3">
                    <div className="font-medium text-secondary-800">
                      {message.message}
                    </div>
                    <div className="text-xs text-secondary-500 mt-1">
                      {new Date(message.consensusTimestamp).toLocaleString()}
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
