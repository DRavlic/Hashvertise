import { useState, useEffect } from "react";
import { CampaignStatus, CampaignFilters } from "../lib/interfaces";
import { CampaignSortOption } from "../lib/enums";
import { useDebounce } from "../hooks/useDebounce";
import { DEBOUNCE_DELAY_MS } from "../lib/constants";

interface CampaignsFilterBarProps {
  onFilterChange: (filters: CampaignFilters) => void;
}

export function CampaignsFilterBar({
  onFilterChange,
}: CampaignsFilterBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<CampaignSortOption>(
    CampaignSortOption.NEWEST
  );
  const [selectedStatuses, setSelectedStatuses] = useState<CampaignStatus[]>([
    CampaignStatus.UPCOMING,
    CampaignStatus.ACTIVE,
  ]);

  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY_MS);

  useEffect(() => {
    onFilterChange({
      searchTerm: debouncedSearchTerm,
      sortOption,
      selectedStatuses,
    });
  }, [debouncedSearchTerm, sortOption, selectedStatuses, onFilterChange]);

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

  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-secondary-200 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
        {/* Search by Name */}
        <div>
          <label
            htmlFor="search"
            className="block text-sm font-medium text-secondary-700 mb-1"
          >
            Filter by Name
          </label>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter campaign name..."
          />
        </div>

        {/* Sort Options */}
        <div>
          <label
            htmlFor="sort"
            className="block text-sm font-medium text-secondary-700 mb-1"
          >
            Order By
          </label>
          <select
            id="sort"
            value={sortOption}
            onChange={(e) =>
              setSortOption(e.target.value as CampaignSortOption)
            }
            className="w-full px-3 py-1.5 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value={CampaignSortOption.NEWEST}>Newest</option>
            <option value={CampaignSortOption.PRIZE_HIGH_TO_LOW}>
              Prize: High to Low
            </option>
            <option value={CampaignSortOption.PRIZE_LOW_TO_HIGH}>
              Prize: Low to High
            </option>
            <option value={CampaignSortOption.START_DATE_ASC}>
              Start Date: Earliest
            </option>
            <option value={CampaignSortOption.START_DATE_DESC}>
              Start Date: Latest
            </option>
            <option value={CampaignSortOption.END_DATE_ASC}>
              End Date: Earliest
            </option>
            <option value={CampaignSortOption.END_DATE_DESC}>
              End Date: Latest
            </option>
          </select>
        </div>

        {/* Filter by Status */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Filter by Status
          </label>
          <div className="flex items-center space-x-3 py-1.5">
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
      </div>
    </div>
  );
}
