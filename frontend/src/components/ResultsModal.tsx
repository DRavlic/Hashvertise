import { CampaignResultEntry } from "../lib/interfaces";
import { getHashscanTxUrl } from "../lib/url";
import { getLedgerId } from "../lib/wallet";

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: CampaignResultEntry[];
  resultTxId: string;
  noValidApplications?: boolean;
}

export function ResultsModal({
  isOpen,
  onClose,
  results,
  resultTxId,
  noValidApplications,
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
        <h3 className="text-lg font-semibold text-secondary-900 mb-1">
          Campaign Results
        </h3>
        {resultTxId && (
          <a
            href={getHashscanTxUrl(resultTxId, getLedgerId())}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-600 hover:text-primary-700 hover:underline mb-4 inline-block font-semibold"
          >
            View transaction on Hashscan
          </a>
        )}
        {noValidApplications ? (
          <div className="text-center text-secondary-600 py-8">
            <p className="text-lg font-medium text-secondary-900 mb-2">
              No Valid Applications
            </p>
            <p className="text-sm">
              This campaign received no valid applications that met the
              requirements.
            </p>
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
