import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./providers/WalletProvider";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";

function App() {
  return (
    <Router>
      <WalletProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Add more routes as needed */}
            {/* <Route path="/campaign/new" element={<NewCampaign />} /> */}
            {/* <Route path="/campaigns" element={<Campaigns />} /> */}
          </Routes>
        </Layout>
      </WalletProvider>
    </Router>
  );
}

export default App;
