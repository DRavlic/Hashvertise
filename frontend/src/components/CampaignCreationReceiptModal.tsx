import { CampaignCreationReceipt } from "../lib/interfaces";
import { formatFeePercentage } from "../lib/campaign-receipt";
import { formatHbar } from "../lib/hbar-utils";
import { formatUtcDateTime } from "../lib/date";

interface CampaignCreationReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  receipt: CampaignCreationReceipt | null;
  isLoading: boolean;
}

export function CampaignCreationReceiptModal({
  isOpen,
  onClose,
  onConfirm,
  receipt,
  isLoading,
}: CampaignCreationReceiptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">
            Campaign Creation Receipt
          </h3>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600 transition-colors"
            disabled={isLoading}
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
        </div>

        {receipt ? (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg px-4 py-2 border border-slate-200">
              <div className="flex justify-between items-center py-2 border-b border-slate-200 last:border-b-0">
                <span className="text-sm text-slate-600 font-semibold">
                  Start:
                </span>
                <span className="text-sm text-slate-800 font-medium">
                  {formatUtcDateTime(receipt.startDate.toISOString())}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-600 font-semibold">
                  End:
                </span>
                <span className="text-sm text-slate-800 font-medium">
                  {formatUtcDateTime(receipt.endDate.toISOString())}
                </span>
              </div>
            </div>

            <div className="bg-secondary-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-secondary-700">
                  Prize Pool:
                </span>
                <span className="text-sm text-secondary-900">
                  {formatHbar(receipt.prizeAmountHbar)} HBAR
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-secondary-700">
                  Platform Fee ({formatFeePercentage(receipt.feeBasisPoints)}):
                </span>
                <span className="text-sm text-secondary-900">
                  {formatHbar(receipt.feeAmountHbar)} HBAR
                </span>
              </div>

              <div className="border-t border-secondary-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-secondary-900">
                    Total Cost:
                  </span>
                  <span className="text-base font-semibold text-primary-600">
                    {formatHbar(receipt.totalAmountHbar)} HBAR
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-secondary-500">
              <p>
                • The prize pool amount will be distributed to campaign
                participants
              </p>
              <p>• The platform fee helps maintain and improve Hashvertise</p>
              <p>• Network gas fees are additional and handled automatically</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-secondary-300 text-secondary-700 rounded-md hover:bg-secondary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:bg-secondary-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </>
            ) : (
              "Confirm & Create"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
