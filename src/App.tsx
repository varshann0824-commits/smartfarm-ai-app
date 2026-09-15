import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { IntroGate } from '@/components/intro/IntroGate';
import { BackdropSwitcher } from '@/components/ui/PageBackdrop';
import { BottomNav } from '@/components/BottomNav';
import { WelcomePage } from '@/pages/WelcomePage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { FarmerDetailsPage } from '@/pages/FarmerDetailsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TalkPage } from '@/pages/TalkPage';
import { MarketPage } from '@/pages/MarketPage';
import { CropHealthPage } from '@/pages/CropHealthPage';
import { SellCropPage } from '@/pages/SellCropPage';
import { WeatherPage } from '@/pages/WeatherPage';
import { SafetyPage } from '@/pages/SafetyPage';
import { ProfitPage } from '@/pages/ProfitPage';
import { SchemesPage } from '@/pages/SchemesPage';
import { SupportPage } from '@/pages/SupportPage';
import { SoilTestPage } from '@/pages/SoilTestPage';
import { CropRecommendationPage } from '@/pages/CropRecommendationPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { MorePage } from '@/pages/MorePage';
import { FarmTasksPage } from '@/pages/FarmTasksPage';
import { HistoryPage } from '@/pages/HistoryPage';

function AppRoutes() {
  const { hasOnboarded } = useApp();

  return (
    <>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/farmer-details" element={<FarmerDetailsPage />} />
        <Route path="/dashboard" element={hasOnboarded ? <DashboardPage /> : <Navigate to="/onboarding" />} />
        <Route path="/talk" element={<TalkPage />} />
        <Route path="/market" element={<MarketPage />} />
        <Route path="/crop-health" element={<CropHealthPage />} />
        <Route path="/sell-crop" element={<SellCropPage />} />
        <Route path="/weather" element={<WeatherPage />} />
        <Route path="/safety" element={<SafetyPage />} />
        <Route path="/profit" element={<ProfitPage />} />
        <Route path="/schemes" element={<SchemesPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/soil" element={<SoilTestPage />} />
        <Route path="/crop-recommendation" element={<CropRecommendationPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/more" element={<MorePage />} />
        <Route path="/farm-tasks" element={<FarmTasksPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <BackdropSwitcher />
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <IntroGate>
          <AppRoutes />
        </IntroGate>
      </AppProvider>
    </BrowserRouter>
  );
}
