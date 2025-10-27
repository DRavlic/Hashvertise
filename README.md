# Hashvertise

Decentralized advertising platform built on the Hedera network, allowing advertisers to create campaigns and reward participants for social media posts.

## Overview

Hashvertise connects advertisers with social media users through a decentralized platform on Hedera. Advertisers create campaigns with required hashtags, deposit HBAR as rewards, and participants earn rewards by including these hashtags in their posts.

### Key Features

- Create advertising campaigns with specific requirements
- Deposit HBAR rewards for campaign participants
- Automatically verify social media posts with requirements
- Securely distribute rewards to participants
- Wallet-based authentication using HashConnect

## Tech Stack

### Backend

- Node.js with Express
- TypeScript
- Hedera SDK for topic creation and listening
- MongoDB for data storage
- Pino for logging

### Frontend

- React 19
- TypeScript
- HashConnect (WalletConnect) for wallet integration
- TailwindCSS for styling

### Smart Contracts

- Solidity (v0.8.28)
- Hardhat development environment
- Deployed on Hedera network

## Architecture Overview

The project follows a client-server architecture for interacting with the Hedera network:

- **Frontend** uses React and connects to Hedera wallets using HashConnect
- **Backend** handles topic listeners and authenticated Hedera transactions
- **Smart Contracts** manage HBAR deposits and prize distribution

## Monorepo and Workspaces

This repository is an npm workspaces monorepo. The root `package.json` defines workspaces for:

- `frontend/` – React + Vite app (browser)
- `backend/` – Express + TypeScript API (Node)
- `smart-contracts/` – Hardhat + Solidity (Node)

Key behavior and tips:

- Single install and lockfile: run `npm install` at the repo root. It creates one `package-lock.json` for all workspaces.
- Hoisted dependencies: npm hoists shared packages to the root `node_modules`. It’s normal if a workspace (e.g., `smart-contracts/`) has no local `node_modules` folder — it will resolve from the root.
- Per-workspace commands: use `npm run <script> --workspace=<name>` or `npm exec --workspace=<name> <bin>` to run tasks in a specific workspace.
- Do not run `npm install` inside workspace folders when using workspaces; always install from the root.


## Installing and Running

## Installation

### Prerequisites

- Node.js (v16+)
- Docker and Docker Compose (for MongoDB)
- Hedera testnet account

### Setup

1. Clone the repository

   ```bash
   git clone https://github.com/DRavlic/hashvertise.git
   cd hashvertise
   ```

2. Install dependencies (root, for all workspaces)

   ```bash
   npm install
   ```

3. Set up environment variables:

   Create a `.env` file in the backend directory:

   ```
   # Hedera network
   HEDERA_NETWORK=testnet
   HEDERA_OPERATOR_ID=your-hedera-account-id  # e.g., 0.0.123456
   HEDERA_OPERATOR_KEY=your-private-key

   # MongoDB
   MONGODB_URI=mongodb://root:example@localhost:27017/hashvertise

   # Server
   PORT=3001
   ```

   Create a `.env` file in the frontend directory:

   ```
   # HashConnect integration
   VITE_WALLET_CONNECT_PROJECT_ID=your-walletconnect-project-id

   # API endpoint
   VITE_API_URL=http://localhost:3001/api
   ```

   Create a `.env` file in the smart-contracts directory:

   ```
   # Hedera JSON RPC relay URLs
   TESTNET_JSON_RPC_RELAY_URL=https://testnet.hashio.io/api
   MAINNET_JSON_RPC_RELAY_URL=https://mainnet.hashio.io/api

   # Hedera accounts
   TESTNET_ACCOUNT_ID=your-testnet-account-id
   TESTNET_PRIVATE_KEY=your-testnet-private-key
   MAINNET_ACCOUNT_ID=your-mainnet-account-id
   MAINNET_PRIVATE_KEY=your-mainnet-private-key
   ```

4. Start MongoDB:
   ```bash
   docker-compose up -d
   ```

## Running the Application

### Development Mode

- Run both backend and frontend together (via `concurrently`):

  ```bash
  npm run dev
  ```

- Run a single workspace:

  ```bash
  # Frontend dev server
  npm run dev --workspace=frontend

  # Backend dev server
  npm run dev --workspace=backend
  ```

## Smart Contract Tasks

Smart contracts are a workspace. Prefer running via workspace-aware npm commands:

```bash
# Compile
npm run compile --workspace=smart-contracts

# Run tests
npm run test --workspace=smart-contracts

# Run a Hardhat binary directly in the workspace
npm exec --workspace=smart-contracts hardhat --version
```

Hashvertise also includes Hardhat tasks you can invoke directly with Hardhat (workspace context assumed by `npm exec`):

### Deposit HBAR to a Campaign

```bash
npm exec --workspace=smart-contracts hardhat deposit \
  --contract 0.0.1140000 \
  --topicId 0.0.6006038 \
  --amount 0.02 \
  --chain testnet
```

### Check Deposit Balance

```bash
npm exec --workspace=smart-contracts hardhat check-deposit \
  --contract 0.0.1140000 \
  --address 0.0.5532673 \
  --topicId 0.0.6006038 \
  --chain testnet
```

### Distribute Prize to Participants

```bash
npm exec --workspace=smart-contracts hardhat distribute-prize \
  --contract 0.0.1140000 \
  --advertiser 0.0.5532673 \
  --topicId 0.0.6006038 \
  --participants 0.0.5532673,0.0.5919443 \
  --amounts 0.005,0.005 \
  --chain testnet
```

## Database

The project uses MongoDB for data storage:

- Docker Compose configuration is provided for easy setup
- Mongo Express web interface for database management

### MongoDB Setup

```bash
# Start MongoDB and Mongo Express
docker-compose up -d
```

Access Mongo Express at http://localhost:8081 with:

- Username: root
- Password: example

**Note:** These are development credentials. Use different credentials for production.

## Authentication and Campaign Verification

The platform uses Hedera wallet-based authentication:

1. Users sign up with their Hedera account ID and public key
2. When creating a campaign, the frontend:
   - Creates a new Hedera topic
   - Signs a message containing topic details using the connected wallet
   - Sends the signed message to the backend
3. The backend verifies:
   - The user exists in the database
   - The signature is valid using HashConnect's verification
   - The topic exists on the Hedera network
4. After verification, the backend sets up a topic listener for the campaign

## Contributing

Contribution to Hashvertise is welcomed! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests if applicable
4. Commit your changes: `git commit -m 'Add some amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Add appropriate tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting a PR

### Reporting Issues

If you find a bug or have a feature request, please open an issue on GitHub with:
- A clear description of the problem or feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Your environment details

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions or support, please open an issue on GitHub or contact the maintainers.
