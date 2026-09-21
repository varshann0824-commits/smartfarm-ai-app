import { Link } from 'react-router-dom';
import { UserRound, MapPin, Languages, Bell, FlaskConical, Settings as SettingsIcon } from 'lucide-react';
import { PageWrapper } from '@/components/PageWrapper';
import { useApp, LANGUAGES } from '@/context/AppContext';
import { getNotificationSettings } from '@/services/notificationService';

export function ProfilePage() {
  const { farmerDetails, location, language, demoMode } = useApp();
  const settings = getNotificationSettings();
  const langName = LANGUAGES.find((l) => l.code === language)?.nativeName || language;
  const locationText = [location.city, location.district, location.state].filter(Boolean).join(', ');
  const hasProfile = farmerDetails && (farmerDetails.name || farmerDetails.crop);

  return (
    <PageWrapper title="Farmer Profile">
      <p className="text-sm text-stone-600 mb-4">Your farmer profile, farm information and account preferences.</p>
      <div className="card mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-green-700 flex items-center justify-center flex-shrink-0">
            <UserRound className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-stone-800">{farmerDetails?.name || 'Farmer'}</h3>
            <p className="text-xs text-stone-500">{farmerDetails?.crop ? `Growing: ${farmerDetails.crop}` : 'No crop set yet'}</p>
          </div>
        </div>
        {hasProfile ? (
          <dl className="text-sm divide-y divide-stone-100">
            {farmerDetails?.phone && (<div className="flex justify-between py-1.5"><dt className="text-stone-500">Phone</dt><dd className="font-medium text-stone-800">{farmerDetails.phone}</dd></div>)}
            {farmerDetails?.landArea && (<div className="flex justify-between py-1.5"><dt className="text-stone-500">Land</dt><dd className="font-medium text-stone-800">{farmerDetails.landArea} {farmerDetails.landUnit}</dd></div>)}
            {farmerDetails?.season && (<div className="flex justify-between py-1.5"><dt className="text-stone-500">Season</dt><dd className="font-medium text-stone-800 capitalize">{farmerDetails.season}</dd></div>)}
            {farmerDetails?.waterAvailability && (<div className="flex justify-between py-1.5"><dt className="text-stone-500">Water</dt><dd className="font-medium text-stone-800 capitalize">{farmerDetails.waterAvailability}</dd></div>)}
          </dl>
        ) : (
          <p className="text-sm text-stone-600">No farmer details saved yet. Add your farm information to get personalised advice.</p>
        )}
        <Link to="/farmer-details" className="btn btn-primary text-sm w-full mt-3 touch-target">
          {hasProfile ? 'Edit Farmer Details' : 'Enter Farmer Details'}
        </Link>
      </div>
      <div className="card mb-4">
        <h3 className="font-bold text-stone-800 mb-2 flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-green-700" /> Farm Location</h3>
        <p className="text-sm text-stone-700">{locationText || 'Location not set yet.'}</p>
        <p className="text-xs text-stone-500 mt-0.5">{location.source === 'manual' ? 'Manual location' : location.source === 'gps' ? 'GPS location' : 'Not detected yet'}</p>
        <Link to="/settings" className="btn btn-outline text-sm w-full mt-3 touch-target">Change Location</Link>
      </div>
      <div className="card mb-4">
        <h3 className="font-bold text-stone-800 mb-2 text-sm">Preferences</h3>
        <div className="space-y-1.5 text-sm text-stone-700">
          <p className="flex items-center gap-2"><Languages className="w-4 h-4 text-stone-400" /> Language: {langName}</p>
          <p className="flex items-center gap-2"><Bell className="w-4 h-4 text-stone-400" /> Notifications: {settings.notifications ? 'On' : 'Off'}</p>
          <p className="flex items-center gap-2"><FlaskConical className="w-4 h-4 text-stone-400" /> Demo Mode: {demoMode ? 'On (sample data)' : 'Off'}</p>
        </div>
        <Link to="/settings" className="btn btn-outline text-sm w-full mt-3 touch-target"><SettingsIcon className="w-4 h-4" /> Open Settings</Link>
      </div>
    </PageWrapper>
  );
}
