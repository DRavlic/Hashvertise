import { Link } from "react-router-dom";

export function Home() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-primary-600 mb-4">
          Hashvertise
        </h1>
        <p className="text-xl text-secondary-600 mb-8 max-w-3xl mx-auto">
          Decentralized advertising platform built on the Hedera network
        </p>

        <div className="flex justify-center gap-4">
          <Link
            to="/campaign/new"
            className="px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
          >
            Create Campaign
          </Link>
          <Link
            to="/campaigns"
            className="px-6 py-3 bg-white text-primary-600 font-medium rounded-md border border-primary-600 hover:bg-secondary-50 transition-colors"
          >
            Browse Campaigns
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
          <h3 className="text-lg font-semibold text-secondary-800 mb-3">
            Decentralized
          </h3>
          <p className="text-secondary-600">
            All campaigns are stored on the Hedera distributed ledger, ensuring
            transparency and immutability.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
          <h3 className="text-lg font-semibold text-secondary-800 mb-3">
            Verifiable
          </h3>
          <p className="text-secondary-600">
            Social media promotions can be verified on-chain, ensuring authentic
            engagement and fair rewards.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
          <h3 className="text-lg font-semibold text-secondary-800 mb-3">
            Cost-Effective
          </h3>
          <p className="text-secondary-600">
            Leverage Hedera's low transaction costs for affordable advertising
            campaigns with real impact.
          </p>
        </div>
      </div>

      <div className="bg-secondary-50 p-8 rounded-lg border border-secondary-200 my-8">
        <h2 className="text-2xl font-semibold text-secondary-800 mb-4">
          How It Works
        </h2>
        <ol className="list-decimal list-inside space-y-4 text-secondary-600">
          <li>Connect your Hedera wallet (HashPack or Blade)</li>
          <li>Create and sign your advertising campaign</li>
          <li>Your campaign is stored on the Hedera network</li>
          <li>Users promote your content with required hashtags/text</li>
          <li>Our system verifies social media posts on-chain</li>
          <li>Verified promoters receive rewards automatically</li>
        </ol>
      </div>
    </div>
  );
}
