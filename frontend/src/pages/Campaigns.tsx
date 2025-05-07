import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_ENDPOINTS } from "../lib/environment";
import { showError } from "../lib/toast";
import { CAMPAIGNS_PER_PAGE } from "../lib/constants";
import { formatUtcDate } from "../lib/date";

interface Campaign {
  _id: string;
  topicId: string;
  name: string;
  accountId: string;
  prizePool: number;
  requirement: string;
  createdAt: string;
}

export function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCampaigns(currentPage);
  }, [currentPage]);

  const fetchCampaigns = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_ENDPOINTS.GET_CAMPAIGNS}?page=${page}&limit=${CAMPAIGNS_PER_PAGE}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch campaigns");
      }

      setCampaigns(data.campaigns);
      setTotalPages(Math.ceil(data.total / CAMPAIGNS_PER_PAGE));
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      showError(
        `Error fetching campaigns: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-primary-600">
          Active Campaigns
        </h1>
        <Link
          to="/campaign/new"
          className="px-4 py-2 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
        >
          Create Campaign
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-secondary-50 p-8 rounded-lg border border-secondary-200 text-center">
          <h2 className="text-xl font-semibold text-secondary-800 mb-4">
            No Campaigns Found
          </h2>
          <p className="text-secondary-600 mb-6">
            Be the first to create an advertising campaign on Hashvertise!
          </p>
          <Link
            to="/campaign/new"
            className="px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors inline-block"
          >
            Create Campaign
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <div
                key={campaign._id}
                className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200 hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold text-secondary-800 mb-2 truncate">
                  {campaign.name}
                </h3>
                <div className="text-sm text-secondary-500 mb-3">
                  Created: {formatUtcDate(campaign.createdAt)}
                </div>
                <div className="mb-4">
                  <div className="font-medium text-success-600">
                    Prize: ${campaign.prizePool.toFixed(2)}
                  </div>
                </div>
                <p className="text-secondary-600 mb-4 line-clamp-2">
                  {campaign.requirement}
                </p>
                <Link
                  to={`/campaign/${campaign.topicId}`}
                  className="text-primary-600 font-medium hover:text-primary-700"
                >
                  View Details →
                </Link>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="inline-flex rounded-md shadow-sm">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-secondary-300 rounded-l-md bg-white text-sm font-medium text-secondary-500 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 border border-secondary-300 bg-white text-sm font-medium ${
                        currentPage === page
                          ? "bg-primary-50 text-primary-600"
                          : "text-secondary-500 hover:bg-secondary-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-secondary-300 rounded-r-md bg-white text-sm font-medium text-secondary-500 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}
