import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff, ShieldAlert, CloudSun, MapPin } from 'lucide-react';
import { PageWrapper } from '@/components/PageWrapper';
import { LoadingSpinner } from '@/components/DataBadges';
import { useApp } from '@/context/AppContext';
import { checkDisasterAlerts, type DisasterAlertResult } from '@/services/disasterAlertService';
import { getNotificationSettings, requestNotificationPermission } from '@/services/notificationService';

export function NotificationsPage() {
  const { location, locationError } = useApp();
  const [result, setResult] = useState<DisasterAlertResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
  );
  const settings = getNotificationSettings();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        if (location.latitude !== null && location.longitude !== null) {
          const r = await checkDisasterAlerts(location.latitude, location.longitude);
          if (!cancelled) setResult(r);
        } else if (!cancelled) setResult(null);
      } catch {
        if (!cancelled) setResult(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [location.latitude, location.longitude]);

  const handleEnable = async () => {
    await requestNotificationPermission();
    setPermission(typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported');
  };

  const warnings = result?.warnings ?? [];
  const locationText = [location.city, location.district, location.state].filter(Boolean).join(', ');

  return (
    <PageWrapper title="Notifications">
      <p className="text-sm text-stone-600 mb-4">Weather, safety and farm alerts for your location appear here.</p>
      <div className="card mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            {permission === 'granted' ? <Bell className="w-5 h-5 text-amber-700" /> : <BellOff className="w-5 h-5 text-stone-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-stone-800 text-sm">Alert notifications</p>
            <p className="text-xs text-stone-500">
              {permission === 'unsupported' ? 'This browser does not support notifications.'
                : permission === 'granted' ? 'Enabled.'
                : permission === 'denied' ? 'Blocked in browser settings.'
                : 'Not enabled yet.'}
              {!settings.notifications && ' (Turned off in Settings)'}
            </p>
          </div>
        </div>
        {permission !== 'granted' && permission !== 'unsupported' && (
          <button onClick={handleEnable} className="btn btn-primary text-sm w-full mt-3 touch-target">Enable Notifications</button>
        )}
        <Link to="/settings" className="btn btn-outline text-sm w-full mt-2 touch-target">Open Notification Settings</Link>
      </div>
      <div className="card mb-4 flex items-center gap-2 text-sm text-stone-600">
        <MapPin className="w-4 h-4 text-green-700 flex-shrink-0" />
        {locationText ? (<span>Alerts for <strong className="text-stone-800">{locationText}</strong></span>)
          : (<span>{locationError || 'Location not set yet.'} <Link to="/settings" className="text-green-700 font-semibold underline">Set location</Link></span>)}
      </div>
      {loading ? (<LoadingSpinner label="Checking alerts..." />)
        : warnings.length > 0 ? (
          <div className="space-y-3">
            {warnings.map((w) => (
              <div key={w.id} className="card border-l-4 border-red-500">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-800">{w.title}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{w.level} - {w.area}</p>
                    <Link to="/safety" className="btn btn-primary text-sm px-4 py-2 mt-3 touch-target inline-flex">View Alert</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-8">
            <CloudSun className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="font-semibold text-stone-800 mb-1">No notifications right now</h3>
            <p className="text-sm text-stone-600 mb-4">No severe weather or safety alerts for your location.</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link to="/safety" className="btn btn-outline text-sm touch-target">Check Safety Center</Link>
              <Link to="/weather" className="btn btn-outline text-sm touch-target">Check Weather</Link>
            </div>
          </div>
        )}
    </PageWrapper>
  );
}
