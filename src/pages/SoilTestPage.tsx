import { useState } from 'react';
import { PageWrapper } from '@/components/PageWrapper';
import { DataBadge } from '@/components/DataBadges';
import { useApp } from '@/context/AppContext';
import { getSoilTestingLabs, saveSoilTest, loadSoilTest, clearSoilTest, hasSoilTest } from '@/services/soilService';
import type { SoilTestData } from '@/types';
import { FlaskConical, ExternalLink, Save, Trash2, CheckCircle2 } from 'lucide-react';

export function SoilTestPage() {
  const { t } = useApp();
  const labs = getSoilTestingLabs();
  const existingData = loadSoilTest();
  const [saved, setSaved] = useState(hasSoilTest());
  const [data, setData] = useState<SoilTestData>(existingData || {
    ph: null, nitrogen: '', phosphorus: '', potassium: '', organicCarbon: '', micronutrients: '', soilType: '',
  });

  const handleSave = () => {
    saveSoilTest(data);
    setSaved(true);
  };

  const handleClear = () => {
    clearSoilTest();
    setSaved(false);
    setData({ ph: null, nitrogen: '', phosphorus: '', potassium: '', organicCarbon: '', micronutrients: '', soilType: '' });
  };

  return (
    <PageWrapper title={`\u{1F9EA} ${t('soilTest')}`}>
      {/* Optional notice */}
      <div className="card mb-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-stone-700">
          Soil testing is <span className="font-semibold">optional</span>. You can use SmartFarm AI without soil test data. However, having soil test results helps with better crop recommendations and fertilizer guidance.
        </p>
      </div>

      {saved && (
        <div className="card mb-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">Your soil test data has been saved.</p>
          </div>
        </div>
      )}

      {/* Soil Test Data Entry */}
      <div className="card mb-4">
        <h3 className="font-bold text-stone-800 mb-3">Enter Your Soil Test Data</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-stone-500 block mb-1">pH Level</label>
            <input
              type="number"
              step="0.1"
              value={data.ph ?? ''}
              onChange={e => setData(d => ({ ...d, ph: e.target.value ? parseFloat(e.target.value) : null }))}
              placeholder="e.g., 6.5"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500 block mb-1">Soil Type</label>
            <select
              value={data.soilType ?? ''}
              onChange={e => setData(d => ({ ...d, soilType: e.target.value || null }))}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
            >
              <option value="">Select...</option>
              <option value="clay">Clay</option>
              <option value="loamy">Loamy</option>
              <option value="sandy">Sandy</option>
              <option value="silty">Silty</option>
              <option value="black">Black (Regur)</option>
              <option value="red">Red</option>
              <option value="alluvial">Alluvial</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500 block mb-1">Nitrogen (N)</label>
            <input
              type="text"
              value={data.nitrogen ?? ''}
              onChange={e => setData(d => ({ ...d, nitrogen: e.target.value }))}
              placeholder="e.g., Low / Medium / High"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500 block mb-1">Phosphorus (P)</label>
            <input
              type="text"
              value={data.phosphorus ?? ''}
              onChange={e => setData(d => ({ ...d, phosphorus: e.target.value }))}
              placeholder="e.g., Low / Medium / High"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500 block mb-1">Potassium (K)</label>
            <input
              type="text"
              value={data.potassium ?? ''}
              onChange={e => setData(d => ({ ...d, potassium: e.target.value }))}
              placeholder="e.g., Low / Medium / High"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500 block mb-1">Organic Carbon</label>
            <input
              type="text"
              value={data.organicCarbon ?? ''}
              onChange={e => setData(d => ({ ...d, organicCarbon: e.target.value }))}
              placeholder="e.g., 0.5%"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-stone-500 block mb-1">Micronutrients</label>
            <input
              type="text"
              value={data.micronutrients ?? ''}
              onChange={e => setData(d => ({ ...d, micronutrients: e.target.value }))}
              placeholder="e.g., Zinc: Low, Iron: Medium"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={handleSave} className="btn btn-primary touch-target flex-1 text-sm">
            <Save className="w-4 h-4" /> Save Soil Data
          </button>
          {saved && (
            <button onClick={handleClear} className="btn btn-outline touch-target text-sm px-4">
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Find Soil Testing Labs */}
      <div className="card mb-4">
        <h3 className="font-bold text-stone-800 mb-2 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-amber-600" /> Need a Soil Test?
        </h3>
        <p className="text-sm text-stone-600 mb-3">Find verified soil testing laboratories and centers near you:</p>
        <div className="space-y-2">
          {labs.map((lab, i) => (
            <div key={i} className="bg-stone-50 rounded-lg p-3">
              <h4 className="font-medium text-stone-800 text-sm">{lab.name}</h4>
              <p className="text-xs text-stone-600 mt-1">{lab.description}</p>
              <a href={lab.findUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline text-xs px-3 py-1.5 mt-2 inline-flex">
                <ExternalLink className="w-3 h-3" /> Find Lab
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy note */}
      <div className="card bg-stone-50">
        <DataBadge status="verified" />
        <p className="text-xs text-stone-500 mt-2">
          Your soil test data is stored locally on your device only. It is not shared with any server.
        </p>
      </div>
    </PageWrapper>
  );
}
