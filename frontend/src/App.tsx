import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./providers/WalletProvider";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { CreateCampaign } from "./pages/CreateCampaign";
import { Campaigns } from "./pages/Campaigns";
import { CampaignDetails } from "./pages/CampaignDetails";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <Router>
      <WalletProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/campaign/new" element={<CreateCampaign />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaign/:topicId" element={<CampaignDetails />} />
            {/* Add more routes as needed */}
          </Routes>
        </Layout>
        <ToastContainer />
      </WalletProvider>
    </Router>
  );
}

export default App;
