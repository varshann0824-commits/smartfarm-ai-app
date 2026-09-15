import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MapPin, Bell, Volume2, Sprout, User, FlaskConical, ArrowRight, ArrowLeft } from 'lucide-react';
import { useApp, LANGUAGES, type LanguageCode } from '@/context/AppContext';
import { requestNotificationPermission } from '@/services/notificationService';
import { BackdropScene } from '@/components/ui/PageBackdrop';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { language, setLanguage, setHasOnboarded, setDemoMode, detectLocation } = useApp();
  const [step, setStep] = useState(1);

  const handleLanguageSelect = (code: LanguageCode) => {
    setLanguage(code);
  };

  const handlePermissions = async () => {
    // Request notification permission (browser will show prompt)
    await requestNotificationPermission();
    // Try to detect location
    await detectLocation();
    setStep(3);
  };

  const handleChoice = (choice: 'talk' | 'farmer' | 'demo') => {
    if (choice === 'demo') {
      setDemoMode(true);
    }
    setHasOnboarded(true);
    if (choice === 'talk') {
      navigate('/talk');
    } else if (choice === 'farmer') {
      navigate('/farmer-details');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1c2b1f]">
      {/* Cinematic farming photography behind the language picker — sharp,
          with only a light veil so every step stays perfectly readable */}
      <BackdropScene variant="blue-sky-field" veil={0.08} />
      {/* Light veil keeps all steps perfectly readable */}
      <div className="absolute inset-0 bg-white/40" aria-hidden="true" />

      <div className="relative z-10 max-w-md mx-auto px-6 py-8">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full flex-1 transition-all ${s <= step ? 'bg-green-700' : 'bg-stone-200'}`}
            />
          ))}
        </div>

        {/* Step 1: Language */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-green-700 flex items-center justify-center mx-auto mb-4">
                <Sprout className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-stone-800">SmartFarm AI</h1>
              <p className="text-stone-600 mt-1">Helping Indian farmers make better decisions.</p>
            </div>

            <h2 className="text-lg font-semibold text-stone-800 mb-4">Choose Your Language</h2>
            <div className="space-y-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all touch-target ${
                    language === lang.code
                      ? 'border-green-600 bg-green-50'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <span className="font-medium text-stone-800">{lang.nativeName}</span>
                  <span className="text-sm text-stone-500">{lang.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              className="btn btn-primary touch-target w-full mt-6 text-base"
            >
              Continue <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2: Permissions */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-semibold text-stone-800 mb-2">Permissions</h2>
            <p className="text-stone-600 text-sm mb-6">
              SmartFarm AI works best with these permissions. You can change them anytime in Settings.
            </p>

            <div className="space-y-3 mb-6">
              <PermissionItem icon={<MapPin />} title="Location" description="For weather, market prices, and local schemes" />
              <PermissionItem icon={<Mic />} title="Microphone" description="To talk to SmartFarm AI with your voice" />
              <PermissionItem icon={<Bell />} title="Notifications" description="To receive important weather and safety alerts" />
              <PermissionItem icon={<Volume2 />} title="Alert Sound" description="To hear important alerts" />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="btn btn-secondary touch-target flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handlePermissions}
                className="btn btn-primary touch-target flex-1 text-base"
              >
                Allow & Continue <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => setStep(3)}
              className="w-full text-center text-stone-500 text-sm mt-4 hover:text-stone-700"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Step 3: Main choices */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-semibold text-stone-800 mb-2 text-center">How would you like to start?</h2>
            <p className="text-stone-600 text-sm mb-6 text-center">Choose an option below</p>

            <div className="space-y-3">
              <button
                onClick={() => handleChoice('talk')}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-green-200 bg-green-50 hover:border-green-500 transition-all touch-target"
              >
                <div className="w-14 h-14 rounded-2xl bg-green-700 flex items-center justify-center flex-shrink-0">
                  <Mic className="w-7 h-7 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-stone-800 text-lg">Talk to SmartFarm AI</h3>
                  <p className="text-sm text-stone-600">Ask questions with your voice or text</p>
                </div>
              </button>

              <button
                onClick={() => handleChoice('farmer')}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:border-blue-500 transition-all touch-target"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-stone-800 text-lg">Enter Farmer Details</h3>
                  <p className="text-sm text-stone-600">Set up your farm information</p>
                </div>
              </button>

              <button
                onClick={() => handleChoice('demo')}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-orange-200 bg-orange-50 hover:border-orange-500 transition-all touch-target"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-600 flex items-center justify-center flex-shrink-0">
                  <FlaskConical className="w-7 h-7 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-stone-800 text-lg">Demo Mode</h3>
                  <p className="text-sm text-stone-600">Explore with sample data</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PermissionItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-stone-200">
      <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-stone-800 text-sm">{title}</h3>
        <p className="text-xs text-stone-500">{description}</p>
      </div>
    </div>
  );
}
