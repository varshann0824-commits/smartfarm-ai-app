import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MapPin, Sprout, Ruler, Droplet, Sun, FlaskConical, Wallet, Users, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { FarmerDetails } from '@/types';
import { COMMON_CROPS } from '@/services/marketService';

export function FarmerDetailsPage() {
  const navigate = useNavigate();
  const { setFarmerDetails, detectLocation, isDetectingLocation, location } = useApp();

  const [form, setForm] = useState<FarmerDetails>({
    name: '', phone: '', landArea: '', landUnit: 'acres', crop: '',
    waterAvailability: '', season: '', hasSoilTest: '', budget: '',
    fpoMembership: '', experience: '',
  });
  const [saved, setSaved] = useState(false);
  const [locationStep, setLocationStep] = useState(false);

  const update = (field: keyof FarmerDetails, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setFarmerDetails(form);
    setSaved(true);
    setTimeout(() => {
      setLocationStep(true);
    }, 1000);
  };

  const handleLocationAndContinue = async () => {
    if (!location.latitude) {
      await detectLocation();
    }
    navigate('/dashboard');
  };

  if (locationStep) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-stone-50 px-6 py-8">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setLocationStep(false)}
            className="inline-flex items-center gap-1.5 text-stone-600 font-medium text-sm mb-6"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-green-700 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-stone-800 mb-2">Set Your Location</h1>
            <p className="text-stone-600 text-sm">
              SmartFarm AI uses your location for weather, market prices, and local recommendations.
            </p>
          </div>

          <div className="card mb-4">
            <p className="text-sm text-stone-500 mb-1">Detected Location</p>
            <p className="font-semibold text-stone-800">
              {[location.city, location.district, location.state].filter(Boolean).join(', ') || 'Not detected yet'}
            </p>
          </div>

          <button
            onClick={handleLocationAndContinue}
            disabled={isDetectingLocation}
            className="btn btn-primary touch-target w-full text-base mb-3"
          >
            {isDetectingLocation ? 'Detecting location...' : (
              <>
                <MapPin className="w-5 h-5" /> Detect & Continue
              </>
            )}
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-outline touch-target w-full text-base"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-stone-50 px-6 py-8">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-stone-600 font-medium text-sm mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-green-700 flex items-center justify-center mx-auto mb-3">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-stone-800">Farmer Details</h1>
          <p className="text-stone-600 text-sm mt-1">Tell us about your farm so we can give better advice.</p>
        </div>

        {saved && (
          <div className="card bg-green-50 border-green-300 mb-4 flex items-center gap-2 animate-fade-in">
            <Check className="w-5 h-5 text-green-700" />
            <p className="text-green-800 font-medium text-sm">Farmer details saved successfully.</p>
          </div>
        )}

        <div className="space-y-4">
          <Field icon={<Sprout className="w-4 h-4" />} label="Farmer Name (optional)">
            <input
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="Your name"
              className="input-field"
            />
          </Field>

          <Field icon={<Sprout className="w-4 h-4" />} label="Main Crop">
            <select
              value={form.crop}
              onChange={e => update('crop', e.target.value)}
              className="input-field"
            >
              <option value="">Select your crop</option>
              {COMMON_CROPS.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="Other">Other</option>
            </select>
          </Field>

          <Field icon={<Ruler className="w-4 h-4" />} label="Land Area">
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.landArea}
                onChange={e => update('landArea', e.target.value)}
                placeholder="e.g., 2"
                className="input-field flex-1"
              />
              <select
                value={form.landUnit}
                onChange={e => update('landUnit', e.target.value)}
                className="input-field w-28"
              >
                <option value="acres">Acres</option>
                <option value="hectares">Hectares</option>
              </select>
            </div>
          </Field>

          <Field icon={<Droplet className="w-4 h-4" />} label="Water Availability">
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'rainfed', label: 'Rain-fed' },
                { val: 'irrigated', label: 'Irrigated' },
                { val: 'limited', label: 'Limited water' },
                { val: 'other', label: 'Other' },
              ].map(o => (
                <button
                  key={o.val}
                  onClick={() => update('waterAvailability', o.val)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all touch-target ${
                    form.waterAvailability === o.val
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-stone-200 bg-white text-stone-600'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Field>

          <Field icon={<Sun className="w-4 h-4" />} label="Farming Season">
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'kharif', label: 'Kharif' },
                { val: 'rabi', label: 'Rabi' },
                { val: 'zaid', label: 'Zaid' },
              ].map(o => (
                <button
                  key={o.val}
                  onClick={() => update('season', o.val)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all touch-target ${
                    form.season === o.val
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-stone-200 bg-white text-stone-600'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Field>

          <Field icon={<FlaskConical className="w-4 h-4" />} label="Soil Test (optional)">
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'yes', label: 'I have soil test' },
                { val: 'no', label: "I don't have soil test" },
              ].map(o => (
                <button
                  key={o.val}
                  onClick={() => update('hasSoilTest', o.val)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all touch-target ${
                    form.hasSoilTest === o.val
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-stone-200 bg-white text-stone-600'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Field>

          <Field icon={<Wallet className="w-4 h-4" />} label="Approximate Budget (optional)">
            <input
              type="text"
              value={form.budget}
              onChange={e => update('budget', e.target.value)}
              placeholder="e.g., 50000 Rs."
              className="input-field"
            />
          </Field>

          <Field icon={<Users className="w-4 h-4" />} label="FPO Membership">
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'yes', label: 'Yes' },
                { val: 'no', label: 'No' },
                { val: 'dont-know', label: "Don't know" },
              ].map(o => (
                <button
                  key={o.val}
                  onClick={() => update('fpoMembership', o.val)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all touch-target ${
                    form.fpoMembership === o.val
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-stone-200 bg-white text-stone-600'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <button
          onClick={handleSave}
          disabled={!form.crop || saved}
          className="btn btn-primary touch-target w-full text-base mt-6"
        >
          {saved ? (
            <><Check className="w-5 h-5" /> Saved</>
          ) : (
            <>Save & Continue <ArrowRight className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium text-stone-600 mb-1.5">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}
