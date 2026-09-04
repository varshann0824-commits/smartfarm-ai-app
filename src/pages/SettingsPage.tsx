import { PageWrapper } from '@/components/PageWrapper';
import { useApp, LANGUAGES, type LanguageCode } from '@/context/AppContext';
import { getNotificationSettings, setNotifications, setAlertSound, requestNotificationPermission, showNotification, playAlertSound } from '@/services/notificationService';
import { clearLocation } from '@/services/geocodingService';
import { OFFICIAL_SOURCES } from '@/services/sourceMetadata';
import { Globe, MapPin, Mic, Bell, Volume2, FlaskConical, Shield, Database, RotateCcw, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function SettingsPage() {
  const { t, language, setLanguage, location, detectLocation, isDetectingLocation, demoMode, setDemoMode, setHasOnboarded } = useApp();
  const navigate = useNavigate();
  const [notifSettings, setNotifSettings] = useState(getNotificationSettings());

  const handleLanguageChange = (code: LanguageCode) => {
    setLanguage(code);
  };

  const handleNotificationToggle = async () => {
    const newValue = !notifSettings.notifications;
    setNotifSettings(s => ({ ...s, notifications: newValue }));
    setNotifications(newValue);
    if (newValue) {
      const granted = await requestNotificationPermission();
      if (granted) {
        showNotification('SmartFarm AI', 'Notifications enabled successfully!');
      }
    }
  };

  const handleSoundToggle = () => {
    const newValue = !notifSettings.alertSound;
    setNotifSettings(s => ({ ...s, alertSound: newValue }));
    setAlertSound(newValue);
  };

  const handleReset = () => {
    localStorage.clear();
    setHasOnboarded(false);
    navigate('/onboarding');
  };

  const locationText = [location.city, location.district, location.state].filter(Boolean).join(', ');

  return (
    <PageWrapper title={`\u2699\uFE0F ${t('settings')}`}>
      {/* Language */}
      <SettingsSection icon={<Globe className="w-5 h-5" />} title="Language">
        <div className="grid grid-cols-1 gap-2">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all touch-target ${
                language === lang.code ? 'border-green-600 bg-green-50' : 'border-stone-200'
              }`}
            >
              <span className="font-medium text-stone-800">{lang.nativeName}</span>
              <span className="text-sm text-stone-500">{lang.name}</span>
            </button>
          ))}
        </div>
      </SettingsSection>

      {/* Location */}
      <SettingsSection icon={<MapPin className="w-5 h-5" />} title="Location">
        <div className="bg-stone-50 rounded-lg p-3 mb-3">
          <p className="text-sm text-stone-700">{locationText || 'Location not detected'}</p>
          <p className="text-xs text-stone-500 mt-1">Source: {location.source}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => detectLocation()} disabled={isDetectingLocation} className="btn btn-primary text-sm flex-1 touch-target">
            {isDetectingLocation ? 'Detecting...' : <>🔄 {t('changeLocation')}</>}
          </button>
          <button onClick={() => { clearLocation(); navigate('/onboarding'); }} className="btn btn-outline text-sm touch-target">
            Manual
          </button>
        </div>
      </SettingsSection>

      {/* Microphone */}
      <SettingsSection icon={<Mic className="w-5 h-5" />} title="Microphone">
        <p className="text-sm text-stone-600 mb-2">
          Microphone permission is managed by your browser. You can change it in your browser settings.
        </p>
        <p className="text-xs text-stone-500">
          If voice input doesn't work, please check that microphone access is allowed for this website.
        </p>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection icon={<Bell className="w-5 h-5" />} title="Notifications">
        <ToggleRow label="Enable Notifications" value={notifSettings.notifications} onChange={handleNotificationToggle} />
      </SettingsSection>

      {/* Alert Sound */}
      <SettingsSection icon={<Volume2 className="w-5 h-5" />} title="Alert Sound">
        <ToggleRow label="Enable Alert Sound" value={notifSettings.alertSound} onChange={handleSoundToggle} />
        <button onClick={() => playAlertSound()} className="btn btn-outline text-sm px-3 py-2 mt-2 w-full touch-target">
          Test Alert Sound
        </button>
      </SettingsSection>

      {/* Demo Mode */}
      <SettingsSection icon={<FlaskConical className="w-5 h-5" />} title="Demo Mode">
        <ToggleRow label="Demo Mode (Sample Data)" value={demoMode} onChange={() => setDemoMode(!demoMode)} />
        {demoMode && (
          <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-2 text-xs text-orange-800">
            🎯 DEMO MODE is ON. All data shown is SAMPLE DATA and should not be used for real decisions.
          </div>
        )}
      </SettingsSection>

      {/* Privacy */}
      <SettingsSection icon={<Shield className="w-5 h-5" />} title="Privacy">
        <div className="space-y-2 text-sm text-stone-600">
          <p>• Your location is detected using your device GPS and stored locally on your device.</p>
          <p>• Your language preference and settings are stored locally.</p>
          <p>• We do not collect Aadhaar, passwords, or financial credentials.</p>
          <p>• For official government processes that require sensitive information, you will be redirected to the official government website.</p>
          <p>• Exact GPS coordinates are not publicly exposed.</p>
          <p>• Soil test data is stored locally and never sent to any server.</p>
        </div>
      </SettingsSection>

      {/* Data Sources */}
      <SettingsSection icon={<Database className="w-5 h-5" />} title="Data Sources">
        <div className="space-y-2">
          {Object.entries(OFFICIAL_SOURCES).map(([key, source]) => (
            <a
              key={key}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-sm text-stone-700 hover:text-green-700 p-2 rounded-lg hover:bg-stone-50"
            >
              <span>{source.name}</span>
              <ExternalLink className="w-4 h-4 text-stone-400" />
            </a>
          ))}
        </div>
      </SettingsSection>

      {/* Reset */}
      <SettingsSection icon={<RotateCcw className="w-5 h-5" />} title="Reset Preferences">
        <button onClick={handleReset} className="btn btn-outline text-sm touch-target w-full text-red-600 border-red-300 hover:bg-red-50">
          Reset All Preferences & Restart Onboarding
        </button>
      </SettingsSection>
    </PageWrapper>
  );
}

function SettingsSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card mb-4">
      <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
        <span className="text-green-700">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-stone-700">{label}</span>
      <button
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-green-600' : 'bg-stone-300'}`}
        aria-label={label}
        role="switch"
        aria-checked={value}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${value ? 'left-6' : 'left-0.5'}`} />
      </button>
    </div>
  );
}
