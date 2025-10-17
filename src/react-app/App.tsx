import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";
import HomePage from "@/react-app/pages/Home";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import DashboardPage from "@/react-app/pages/Dashboard";
import ImportPage from "@/react-app/pages/Import";
import CampaignsPage from "@/react-app/pages/Campaigns";
import TemplatesPage from "@/react-app/pages/Templates";


export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/app/dashboard" element={<DashboardPage />} />
          <Route path="/app/import" element={<ImportPage />} />
          <Route path="/app/campaigns" element={<CampaignsPage />} />
          <Route path="/app/templates" element={<TemplatesPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
