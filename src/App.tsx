import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import { IntroGate } from '@/components/intro/IntroGate';
import { BackdropSwitcher } from '@/components/ui/PageBackdrop';
import { BottomNav } from '@/components/BottomNav';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { WelcomePage } from '@/pages/WelcomePage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { FarmerDetailsPage } from '@/pages/FarmerDetailsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TalkPage } from '@/pages/TalkPage';
import { MarketPage } from '@/pages/MarketPage';
import { CropHealthPage } from '@/pages/CropHealthPage';
import { CropMonitoringPage } from '@/pages/CropMonitoringPage';
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
import { NotificationsPage } from '@/pages/NotificationsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AuthPage } from '@/pages/AuthPage';
import { DevelopmentSensorTestPage } from '@/pages/DevelopmentSensorTestPage';
import { DevelopmentFarmSetupPage } from '@/pages/DevelopmentFarmSetupPage';
import { DevelopmentFieldSetupPage } from '@/pages/DevelopmentFieldSetupPage';
import { DevelopmentDeviceSetupPage } from '@/pages/DevelopmentDeviceSetupPage';

function AppRoutes() {
  const { hasOnboarded } = useApp();
  // hasOnboarded state can lag one render behind the localStorage write made
  // by onboarding CTAs (state update -> re-render -> navigate). Reading the
  // persistent flag too keeps /dashboard reachable immediately after the user
  // completes onboarding, instead of bouncing back to /onboarding (blank).
  let onboardedPersisted = false;
  try {
    onboardedPersisted = localStorage.getItem('smartfarm_onboarded') === 'true';
  } catch {
    onboardedPersisted = false;
  }
  const canAccessDashboard = hasOnboarded || onboardedPersisted;

  return (
    <>
      {/* ROOT CAUSE FIX (blank page): <BackdropSwitcher /> below renders a
          `fixed inset-0 z-0` decorative layer. A positioned element with
          z-index:0 paints ABOVE static in-flow content, so any route whose
          root element does not create its own stacking context (Farmer
          Details was a plain static `min-h-screen` div) was fully covered by
          the backdrop — the URL changed but the screen looked blank white.
          This wrapper gives every route its own stacking layer above it. */}
      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<RouteErrorBoundary><WelcomePage /></RouteErrorBoundary>} />
          <Route path="/auth" element={<RouteErrorBoundary><AuthPage /></RouteErrorBoundary>} />
          {import.meta.env.DEV && <Route path="/dev/sensor-test" element={<RouteErrorBoundary><DevelopmentSensorTestPage /></RouteErrorBoundary>} />}
          {import.meta.env.DEV && <Route path="/dev/farm-setup" element={<RouteErrorBoundary><DevelopmentFarmSetupPage /></RouteErrorBoundary>} />}
          {import.meta.env.DEV && <Route path="/dev/field-setup" element={<RouteErrorBoundary><DevelopmentFieldSetupPage /></RouteErrorBoundary>} />}
          {import.meta.env.DEV && <Route path="/dev/device-setup" element={<RouteErrorBoundary><DevelopmentDeviceSetupPage /></RouteErrorBoundary>} />}
          <Route path="/onboarding" element={<RouteErrorBoundary><OnboardingPage /></RouteErrorBoundary>} />
          <Route path="/farmer-details" element={<RouteErrorBoundary><FarmerDetailsPage /></RouteErrorBoundary>} />
          <Route path="/dashboard" element={canAccessDashboard ? <RouteErrorBoundary><DashboardPage /></RouteErrorBoundary> : <Navigate to="/onboarding" replace />} />
          <Route path="/talk" element={<RouteErrorBoundary><TalkPage /></RouteErrorBoundary>} />
          <Route path="/market" element={<RouteErrorBoundary><MarketPage /></RouteErrorBoundary>} />
          <Route path="/crop-monitoring" element={<RouteErrorBoundary><CropMonitoringPage /></RouteErrorBoundary>} />
          <Route path="/crop-health" element={<RouteErrorBoundary><CropHealthPage /></RouteErrorBoundary>} />
          <Route path="/sell-crop" element={<RouteErrorBoundary><SellCropPage /></RouteErrorBoundary>} />
          <Route path="/weather" element={<RouteErrorBoundary><WeatherPage /></RouteErrorBoundary>} />
          <Route path="/safety" element={<RouteErrorBoundary><SafetyPage /></RouteErrorBoundary>} />
          <Route path="/profit" element={<RouteErrorBoundary><ProfitPage /></RouteErrorBoundary>} />
          <Route path="/schemes" element={<RouteErrorBoundary><SchemesPage /></RouteErrorBoundary>} />
          <Route path="/support" element={<RouteErrorBoundary><SupportPage /></RouteErrorBoundary>} />
          <Route path="/soil" element={<RouteErrorBoundary><SoilTestPage /></RouteErrorBoundary>} />
          <Route path="/crop-recommendation" element={<RouteErrorBoundary><CropRecommendationPage /></RouteErrorBoundary>} />
          <Route path="/settings" element={<RouteErrorBoundary><SettingsPage /></RouteErrorBoundary>} />
          <Route path="/more" element={<RouteErrorBoundary><MorePage /></RouteErrorBoundary>} />
          <Route path="/farm-tasks" element={<RouteErrorBoundary><FarmTasksPage /></RouteErrorBoundary>} />
          <Route path="/history" element={<RouteErrorBoundary><HistoryPage /></RouteErrorBoundary>} />
          <Route path="/notifications" element={<RouteErrorBoundary><NotificationsPage /></RouteErrorBoundary>} />
          <Route path="/profile" element={<RouteErrorBoundary><ProfilePage /></RouteErrorBoundary>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BackdropSwitcher />
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <IntroGate>
            <AppRoutes />
          </IntroGate>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
