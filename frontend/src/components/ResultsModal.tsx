import { CampaignResultEntry } from "../lib/interfaces";

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: CampaignResultEntry[];
  isLoading: boolean;
}

export function ResultsModal({
  isOpen,
  onClose,
  results,
  isLoading,
}: ResultsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary-400 hover:text-secondary-600"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          Campaign Results
        </h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center text-secondary-600 py-8">
            Results are being processed. Please check back soon.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Account ID
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    X Handle
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Prize (HBAR)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {results
                  .slice()
                  .sort((a, b) => b.prizeWonHbar - a.prizeWonHbar)
                  .map((winner) => (
                    <tr key={winner.accountId + winner.xHandle}>
                      <td className="px-4 py-2 text-secondary-900 font-mono text-xs">
                        {winner.accountId}
                      </td>
                      <td className="px-4 py-2 text-secondary-900">
                        {winner.xHandle}
                      </td>
                      <td className="px-4 py-2 text-secondary-900">
                        {winner.prizeWonHbar}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
