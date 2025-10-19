import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { HashConnectConnectionState } from "hashconnect";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { connectionStatus, connectWallet, disconnectWallet } = useWallet();

  const isPaired = connectionStatus === HashConnectConnectionState.Paired;

  const handleWalletAction = async () => {
    if (isPaired) {
      await disconnectWallet();
    } else {
      await connectWallet();
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link to="/" className="text-2xl font-bold text-primary-600">
                Hashvertise
              </Link>
              <nav className="flex items-center gap-4">
                <Link
                  to="/campaigns"
                  className="text-secondary-600 hover:text-primary-600 font-medium transition-colors"
                >
                  Campaigns
                </Link>
                <Link
                  to="/profile"
                  className="text-secondary-600 hover:text-primary-600 font-medium transition-colors"
                >
                  Profile
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleWalletAction}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                {isPaired ? "Disconnect Wallet" : "Connect Wallet"}
              </button>
              {isPaired && (
                <span className="text-sm text-success-600">● Connected</span>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
