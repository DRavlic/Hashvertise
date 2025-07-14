import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { API_ENDPOINTS } from "../lib/environment";
import { showError, getErrorMessage } from "../lib/toast";
import { CAMPAIGNS_PER_PAGE } from "../lib/constants";
import { getCampaignStatus } from "../lib/date";
import { Campaign, CampaignFilters, CampaignStatus } from "../lib/interfaces";
import { StatusBadge } from "../components/StatusBadge";
import { CampaignsFilterBar } from "../components/CampaignsFilterBar";
import { CampaignSortOption } from "../lib/enums";

// Used for remembering filters and page number between pages
const CAMPAIGNS_STATE_KEY = "campaignsState";

export function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize state from sessionStorage or use defaults
  const [currentPage, setCurrentPage] = useState(() => {
    const savedState = sessionStorage.getItem(CAMPAIGNS_STATE_KEY);
    return savedState ? JSON.parse(savedState).page : 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<CampaignFilters>(() => {
    const savedState = sessionStorage.getItem(CAMPAIGNS_STATE_KEY);
    if (savedState) {
      return JSON.parse(savedState).filters;
    }
    return {
      searchTerm: "",
      sortOption: CampaignSortOption.NEWEST,
      selectedStatuses: [CampaignStatus.UPCOMING, CampaignStatus.ACTIVE],
    };
  });

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      page: currentPage,
      filters: filters,
    };
    sessionStorage.setItem(CAMPAIGNS_STATE_KEY, JSON.stringify(stateToSave));
  }, [currentPage, filters]);

  const handleFilterChange = useCallback((newFilters: CampaignFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to page 1 when filters change
  }, []);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: CAMPAIGNS_PER_PAGE.toString(),
          sortBy: filters.sortOption.split("-")[0],
          sortOrder: filters.sortOption.split("-")[1],
        });

        if (filters.searchTerm) {
          params.append("name", filters.searchTerm);
        }

        if (filters.selectedStatuses.length > 0) {
          params.append("statuses", filters.selectedStatuses.join(","));
        }

        const response = await fetch(
          `${API_ENDPOINTS.GET_CAMPAIGNS}?${params.toString()}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch campaigns");
        }

        setCampaigns(data.campaigns);
        setTotalPages(Math.ceil(data.total / CAMPAIGNS_PER_PAGE));
      } catch (error) {
        console.error("Error fetching campaigns:", getErrorMessage(error));
        showError(`Error fetching campaigns: ${getErrorMessage(error)}`);
        setCampaigns([]);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, [currentPage, filters]);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-primary-600">Campaigns</h1>
        <Link
          to="/campaign/new"
          className="px-4 py-2 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
        >
          Create Campaign
        </Link>
      </div>

      <CampaignsFilterBar
        initialFilters={filters}
        onFilterChange={handleFilterChange}
      />

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
            Try adjusting your filters or be the first to create a campaign!
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
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-secondary-800 line-clamp-2 mr-2 break-words">
                    {campaign.name}
                  </h3>
                  <StatusBadge
                    status={getCampaignStatus(
                      campaign.startDateUtc,
                      campaign.endDateUtc
                    )}
                    className="flex-shrink-0"
                  />
                </div>
                <div className="mb-4">
                  <div className="font-medium text-success-600">
                    Prize: ${campaign.prizePool.toFixed(2)}
                  </div>
                </div>
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
