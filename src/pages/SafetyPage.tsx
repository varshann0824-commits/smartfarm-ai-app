import { useState, useEffect, useCallback } from 'react';
import { PageWrapper } from '@/components/PageWrapper';
import { DataBadge, LoadingSpinner } from '@/components/DataBadges';
import { useApp } from '@/context/AppContext';
import { checkDisasterAlerts, WARNING_LEVELS, type DisasterAlertResult } from '@/services/disasterAlertService';
import { getNotificationSettings, playAlertSound, playEmergencySiren } from '@/services/notificationService';
import { OFFICIAL_SOURCES } from '@/services/sourceMetadata';
import { ShieldAlert, Bell, Volume2, ExternalLink, Info } from 'lucide-react';

export function SafetyPage() {
  const { t, location } = useApp();
  const [result, setResult] = useState<DisasterAlertResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const settings = getNotificationSettings();

  const loadData = useCallback(async () => {
    setLoading(true);
    if (location.latitude && location.longitude) {
      const r = await checkDisasterAlerts(location.latitude, location.longitude);
      setResult(r);
      if (r.warnings.some(w => w.level === 'RED') && !muted && settings.alertSound) {
        playEmergencySiren();
      }
    } else {
      setResult({ warnings: [], available: false, officialSourceUrl: OFFICIAL_SOURCES.IMD.url });
    }
    setLoading(false);
  }, [location.latitude, location.longitude, muted, settings.alertSound]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const monitoredTypes = [
    { emoji: '🌧', name: 'Heavy Rain' },
    { emoji: '🌀', name: 'Cyclone' },
    { emoji: '⚡', name: 'Thunderstorm' },
    { emoji: '🔥', name: 'Heatwave' },
    { emoji: '❄', name: 'Cold Wave' },
    { emoji: '💨', name: 'Strong Winds' },
  ];

  return (
    <PageWrapper title={`\u26A0\uFE0F ${t('safety')}`}>
      {/* Settings Summary */}
      <div className="card mb-4">
        <h3 className="font-semibold text-stone-800 mb-2">Alert Settings</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-stone-500" /> Notifications: {settings.notifications ? 'ON' : 'OFF'}
          </span>
          <span className="flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-stone-500" /> Alert Sound: {settings.alertSound ? 'ON' : 'OFF'}
          </span>
        </div>
        <button onClick={playAlertSound} className="btn btn-outline text-sm px-3 py-2 mt-2">
          Test Alert Sound
        </button>
      </div>

      {/* Monitored Types */}
      <div className="card mb-4">
        <h3 className="font-semibold text-stone-800 mb-3">What We Monitor</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {monitoredTypes.map((m, i) => (
            <div key={i} className="bg-stone-50 rounded-lg p-3 text-center">
              <span className="text-2xl block mb-1">{m.emoji}</span>
              <span className="text-xs font-medium text-stone-700">{m.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Info */}
      <div className="card mb-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-stone-700">
            <p className="font-medium mb-1">Alert Priority:</p>
            <p>1. OFFICIAL WARNING (highest priority)</p>
            <p>2. VERIFIED WEATHER DATA</p>
            <p>3. AI RISK ESTIMATE (lowest priority)</p>
          </div>
        </div>
      </div>

      {/* Warning Levels */}
      <div className="card mb-4">
        <h3 className="font-semibold text-stone-800 mb-3">Warning Levels</h3>
        <div className="space-y-2">
          {Object.entries(WARNING_LEVELS).map(([key, val]) => (
            <div key={key} className={`rounded-lg px-3 py-2 text-sm font-medium ${val.color}`}>
              {val.emoji} {val.label}
            </div>
          ))}
        </div>
      </div>

      {/* Current Warnings */}
      {loading && <LoadingSpinner label="Checking for alerts..." />}

      {!loading && result && (
        <>
          {result.warnings.length > 0 ? (
            <div className="space-y-3 mb-4">
              {result.warnings.map((w, i) => {
                const level = WARNING_LEVELS[w.level];
                return (
                  <div key={i} className={`card border-2 ${level.color.replace('text-white', 'border-red-300').replace('text-stone-900', 'border-yellow-300')}`}>
                    <div className={`rounded-lg px-3 py-1.5 text-sm font-bold ${level.color} inline-block mb-2`}>
                      {level.emoji} {level.label}
                    </div>
                    <h4 className="font-bold text-stone-800">{w.title}</h4>
                    <p className="text-sm text-stone-600 mt-1">Area: {w.area}</p>
                    <p className="text-xs text-stone-500 mt-2">Issue time: {w.issueTime}</p>
                    <p className="text-xs text-stone-500">Valid until: {w.validUntil}</p>
                    <p className="text-xs text-stone-500">Source: {w.source}</p>
                    {w.actions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-stone-700">Recommended Actions:</p>
                        <ul className="space-y-1 mt-1">
                          {w.actions.map((a, ai) => <li key={ai} className="text-sm text-stone-700 flex gap-2"><span className="text-green-600">•</span> {a}</li>)}
                        </ul>
                      </div>
                    )}
                    {w.level === 'RED' && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button onClick={() => playEmergencySiren()} className="btn btn-primary text-sm px-3 py-2">
                          <Volume2 className="w-4 h-4" /> 🔊 Hear Alert
                        </button>
                        <button onClick={() => setMuted(true)} className="btn btn-outline text-sm px-3 py-2">
                          🔇 Mute
                        </button>
                        <a href={OFFICIAL_SOURCES.IMD.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline text-sm px-3 py-2">
                          <ExternalLink className="w-4 h-4" /> 🌐 View Official Warning
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card mb-4 text-center">
              <ShieldAlert className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-stone-800 mb-1">No Active Warnings</h3>
              <p className="text-sm text-stone-600 mb-3">
                No official weather warnings are currently available through the fallback source. For official IMD warnings, please check the IMD website directly.
              </p>
              <a href={result.officialSourceUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary text-sm px-4 py-2">
                <ExternalLink className="w-4 h-4" /> Check IMD Official Warnings
              </a>
            </div>
          )}
        </>
      )}
    </PageWrapper>
  );
}
