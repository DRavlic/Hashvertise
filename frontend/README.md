# Hashvertise Frontend

React web application for the Hashvertise platform. This application allows advertisers to create campaigns on the Hedera network.

## Features

- Connect to Hedera wallets using HashConnect
- Create advertising campaigns
- Browse existing campaigns
- Responsive design with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory
3. Install dependencies:

```bash
npm install
```

4. Create an `.env` file in the root directory:

```
# Copy from .env.example
VITE_API_URL=http://localhost:3000
VITE_WALLET_CONNECT_PROJECT_ID=
```

### Development

Run the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Build for Production

Build the application:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Tech Stack

- React
- Vite (for fast development and optimized builds)
- TypeScript (for type safety)
- React Router (for client-side routing)
- Tailwind CSS (for styling)
- HashConnect (for connecting to Hedera wallets)

## Project Structure

- `src/components`: UI components
- `src/lib`: Utility functions
- `src/pages`: Page components
- `src/providers`: Context providers
- `src/styles`: CSS styles
