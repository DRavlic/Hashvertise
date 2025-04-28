# Hashvertise

Decentralized advertising platform built on the Hedera network.

## Project Structure

The project is organized into the following parts:

- **frontend**: React web application for advertisers to create campaigns
- **backend**: Express server that manages topic listeners and handles Hedera transactions
- **crypto**: Backend shared library for Hedera interactions

### Architecture Overview

The project follows a client-server architecture for interacting with the Hedera network:

- **frontend** uses React and connects to Hedera wallets using the **hashconnect** library
- **backend** handles all authenticated Hedera transactions through the **crypto** module
- The **crypto** module uses `@hashgraph/sdk` for Hedera interactions

> **Important**: Cryptographic operations that require authentication with private keys should always be performed on the backend. The frontend should only use hashconnect for wallet connections and signing.

## Setup

1. Clone the repository
2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables:

   - Copy `.env.example` to `.env` in each directory (crypto, backend, frontend)
   - Add your Hedera testnet account ID, private key and other sensitive information to the crypto and backend `.env` files
   - Add your WalletConnect project ID to the frontend `.env` file (required for HashConnect wallet integration)

## Running the Application

Start all services:

```
# In separate terminals:
npm run dev:crypto    # Run crypto module demo
npm run dev:backend   # Start backend server
npm run dev:frontend  # Start frontend development server
```

Or use the combined script:

```
npm run dev
```

## Usage

1. Open the frontend at http://localhost:3000
2. Connect your Hedera wallet using the "Connect Wallet" button
3. Fill out the campaign form with:
   - Advertiser name
   - Campaign description (max 100 characters)
   - Required text for posts (max 50 characters)
4. Submit the campaign
5. The backend will automatically start listening for posts that include your required text

## Development

- The crypto module needs to be rebuilt after changes:

  ```
  npm run build:crypto
  ```

- The frontend and backend will automatically reload when changes are made

## License

[MIT](LICENSE)

## Database

The project uses MongoDB for data storage. A Docker Compose configuration is provided for easy setup.

### Running MongoDB

1. Make sure Docker and Docker Compose are installed on your system
2. Run the following command from the root of the project:

   ```
   docker-compose up -d
   ```

3. This will start:

   - MongoDB server on port 27017
   - Mongo Express (web-based MongoDB admin interface) on port 8081

4. To stop the database services:

   ```
   docker-compose down
   ```

5. Access Mongo Express at http://localhost:8081
   - Username: root
   - Password: example

**Note:** These are development credentials. For production, modify the credentials in docker-compose.yaml.
