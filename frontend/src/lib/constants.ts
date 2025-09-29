export const APP_METADATA = {
  name: "Hashvertise",
  description: "Decentralized advertising on Hedera network",
  url: "https://hashvertise.app",
  icons: ["https://hashvertise.app/logo.png"],
};

// Pagination constants
export const CAMPAIGNS_PER_PAGE = 6;
export const TOPIC_MESSAGES_PER_PAGE = 10;

// Time constants
export const MESSAGE_REFRESH_DELAY_MS = 5000; // 5 seconds
export const X_HANDLE_INPUT_DELAY_MS = 700; // 0.7 seconds
export const TOAST_DURATION_MS = 3000; // 3 seconds
export const COUNTDOWN_REFRESH_INTERVAL_MS = 1000; // 1 second
export const DEFAULT_START_TO_END_TIME_DIFF_HOURS = 12; // only set at the rendering of the CreateCampaign page
export const DEBOUNCE_DELAY_MS = 500; // 0.5 seconds
export const DEFAULT_START_TIME_OFFSET_MINUTES = 10;
export const CAMPAIGN_START_DATE_BUFFER_MINUTES = 10;
export const MIN_CAMPAIGN_DURATION_MINUTES = 5;
export const MAX_CAMPAIGN_DURATION_DAYS = 30;

// Input length constraints
export const MAX_CAMPAIGN_NAME_LENGTH = 40;
export const MAX_REQUIREMENT_LENGTH = 2000;

// Prize pool constants
export const MAX_PRIZE_POOL_HBAR = 10000000000; // 10 billion HBAR

// Campaign completion message constant (must match backend)
export const CAMPAIGN_COMPLETION_MESSAGE_PREFIX = "Campaign over for topic";

// Hashscan URLs
export const HASHSCAN_URLS = {
  MAINNET: "https://hashscan.io/mainnet",
  TESTNET: "https://hashscan.io/testnet",
};

// Fee calculator constants
export const TINYBARS_PER_HBAR = 100_000_000;
export const BASIS_POINTS_DIVISOR = 10_000;
