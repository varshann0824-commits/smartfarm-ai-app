import { PageWrapper } from '@/components/PageWrapper';
import { DashboardCard } from '@/components/DashboardCard';
import { useApp } from '@/context/AppContext';
import { Sprout, FlaskConical, Wallet, Landmark, Building, Settings, CalendarClock, History } from 'lucide-react';

export function MorePage() {
  const { t } = useApp();

  return (
    <PageWrapper title={t('more')}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DashboardCard to="/farm-tasks" icon={<CalendarClock className="w-6 h-6" />} title="Farm Tasks" description="Create reminders for irrigation, fertilizer, harvest" actionLabel="Manage Tasks" accent="green" />
        <DashboardCard to="/history" icon={<History className="w-6 h-6" />} title="Analysis History" description="View previous crop health analyses" actionLabel="View History" accent="teal" />
        <DashboardCard to="/crop-recommendation" icon={<Sprout className="w-6 h-6" />} title="Crop Recommendation" description="Find the best crop for your farm" actionLabel={t('getRecommendation')} accent="green" />
        <DashboardCard to="/profit" icon={<Wallet className="w-6 h-6" />} title={t('profit')} description="Estimate costs and profit" actionLabel={t('calculateProfit')} accent="amber" />
        <DashboardCard to="/schemes" icon={<Landmark className="w-6 h-6" />} title={t('schemes')} description="Government schemes for farmers" actionLabel={t('viewSchemes')} accent="purple" />
        <DashboardCard to="/support" icon={<Building className="w-6 h-6" />} title={t('getHelp')} description="Find KVKs and agriculture offices" actionLabel={t('findSupport')} accent="stone" />
        <DashboardCard to="/soil" icon={<FlaskConical className="w-6 h-6" />} title={t('soilTest')} description="Soil testing info and labs" actionLabel={t('checkSoil')} accent="amber" />
        <DashboardCard to="/settings" icon={<Settings className="w-6 h-6" />} title={t('settings')} description="Language, location, and preferences" actionLabel="Open Settings" accent="stone" />
      </div>
    </PageWrapper>
  );
}
