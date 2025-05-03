import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { createTopic, signMessage } from "../lib/wallet";
import { showError, showSuccess } from "../lib/toast";
import { HashConnectConnectionState } from "hashconnect";

interface CampaignFormData {
  name: string;
  prizePool: number;
  requirement: string;
}

export function CreateCampaign() {
  const navigate = useNavigate();
  const { connectionStatus, accountId } = useWallet();
  const [formData, setFormData] = useState<CampaignFormData>({
    name: "",
    prizePool: 0,
    requirement: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPaired = connectionStatus === HashConnectConnectionState.Paired;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "prizePool" ? parseFloat(value) || 0 : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create a new topic
      const topicResponse = await createTopic();

      if (!topicResponse) {
        // If createTopic returns null, it already showed appropriate error messages
        setIsSubmitting(false);
        return;
      }

      const { topicId, txId } = topicResponse;

      const messageContent = `${txId}, ${topicId}, ${formData.name}, ${accountId}, ${formData.prizePool}, ${formData.requirement}`;
      const message = `Hashvertise signed message(${messageContent.length}): ${messageContent}`;

      const signature = await signMessage(message);

      if (!signature) {
        // If signMessage returns null, it already showed appropriate error messages
        setIsSubmitting(false);
        return;
      }

      // Send the message and signature to the backend
      const response = await fetch("/api/topic/campaign/verify", {
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
        throw new Error(data.error || "Failed to verify campaign");
      }

      // If successful, navigate to the home page and show a success message
      navigate("/");
      showSuccess("Campaign created successfully");
    } catch (error) {
      console.error("Error creating campaign:", error);
      showError(
        `Error creating campaign: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-primary-600 mb-6">
        Create New Campaign
      </h1>

      {!isPaired && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
          Please connect your wallet first to create a campaign.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Campaign Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter campaign name"
          />
        </div>

        <div>
          <label
            htmlFor="prizePool"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Prize Pool (USD)
          </label>
          <input
            type="number"
            id="prizePool"
            name="prizePool"
            min="0"
            step="0.01"
            value={formData.prizePool || ""}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter prize amount in USD"
          />
        </div>

        <div>
          <label
            htmlFor="requirement"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Requirement Text
          </label>
          <textarea
            id="requirement"
            name="requirement"
            value={formData.requirement}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter text that promoters need to include in their post"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !isPaired}
          className="w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating Campaign..." : "Create Campaign"}
        </button>
      </form>
    </div>
  );
}
