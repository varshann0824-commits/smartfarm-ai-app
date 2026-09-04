import { useState } from 'react';
import { PageWrapper } from '@/components/PageWrapper';
import { DataBadge, SourceInfo } from '@/components/DataBadges';
import { AnalysisSheet, type AnalysisState } from '@/components/AnalysisSheet';
import { useApp } from '@/context/AppContext';
import { calculateFarmEconomics, type FarmEconomicsInput, type EconomicsResult } from '@/services/farmEconomicsService';
import { Wallet, TrendingUp, TrendingDown, Calculator } from 'lucide-react';

export function ProfitPage() {
  const { t } = useApp();
  const [inputs, setInputs] = useState<FarmEconomicsInput>({
    landArea: 1, seedCost: 0, fertilizerCost: 0, cropProtectionCost: 0,
    labourCost: 0, irrigationCost: 0, machineryCost: 0, transportCost: 0,
    otherCost: 0, expectedYield: 0, expectedPrice: 0,
  });
  const [result, setResult] = useState<EconomicsResult | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetState, setSheetState] = useState<AnalysisState>('idle');

  const handleCalculate = () => {
    setSheetOpen(true);
    setSheetState('analyzing');
    setTimeout(() => {
      const r = calculateFarmEconomics(inputs);
      setResult(r);
      setSheetState(r.result ? 'success' : 'error');
    }, 1000);
  };

  const costFields: { key: keyof FarmEconomicsInput; label: string; icon: string }[] = [
    { key: 'seedCost', label: 'Seed Cost', icon: '🌱' },
    { key: 'fertilizerCost', label: 'Fertilizer / Inputs', icon: '🧪' },
    { key: 'cropProtectionCost', label: 'Crop Protection', icon: '🛡' },
    { key: 'labourCost', label: 'Labour', icon: '👷' },
    { key: 'irrigationCost', label: 'Irrigation', icon: '💧' },
    { key: 'machineryCost', label: 'Machinery', icon: '🚜' },
    { key: 'transportCost', label: 'Transport', icon: '🚚' },
    { key: 'otherCost', label: 'Other Costs', icon: '📦' },
  ];

  return (
    <PageWrapper title={`\u{1F4B0} ${t('profit')}`}>
      <div className="card mb-4 bg-amber-50 border-amber-200">
        <p className="text-sm text-amber-800">
          📊 ESTIMATE — This calculator provides estimates only. Actual costs and revenue may vary. Never use this as a guarantee of income.
        </p>
      </div>

      {/* Land Area */}
      <div className="card mb-4">
        <label className="text-sm font-medium text-stone-600 block mb-1">Land Area (acres)</label>
        <input
          type="number"
          min="0"
          step="0.1"
          value={inputs.landArea}
          onChange={e => setInputs(d => ({ ...d, landArea: parseFloat(e.target.value) || 0 }))}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
        />
      </div>

      {/* Costs */}
      <div className="card mb-4">
        <h3 className="font-bold text-stone-800 mb-3">Your Costs (Rs.)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {costFields.map(f => (
            <div key={f.key}>
              <label className="text-xs font-medium text-stone-500 block mb-1">{f.icon} {f.label}</label>
              <input
                type="number"
                min="0"
                value={inputs[f.key]}
                onChange={e => setInputs(d => ({ ...d, [f.key]: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Inputs */}
      <div className="card mb-4">
        <h3 className="font-bold text-stone-800 mb-3">Expected Revenue</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-stone-500 block mb-1">Expected Yield (quintal)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={inputs.expectedYield}
              onChange={e => setInputs(d => ({ ...d, expectedYield: parseFloat(e.target.value) || 0 }))}
              placeholder="e.g., 20"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500 block mb-1">Expected Price (Rs./quintal)</label>
            <input
              type="number"
              min="0"
              value={inputs.expectedPrice}
              onChange={e => setInputs(d => ({ ...d, expectedPrice: parseFloat(e.target.value) || 0 }))}
              placeholder="e.g., 2200"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
            />
          </div>
        </div>
        <p className="text-xs text-stone-400 mt-2">
          Check the Market page for current mandi prices to use as your expected price.
        </p>
      </div>

      <button onClick={handleCalculate} className="btn btn-primary touch-target w-full text-base mb-4">
        <Calculator className="w-5 h-5" /> Calculate Profit
      </button>

      <AnalysisSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setSheetState('idle'); }}
        state={sheetState}
        title="Farm Economics Result"
        analyzingLabel="Calculating your farm economics..."
      >
        {result?.result && (
          <div className="space-y-3 animate-fade-in">
            <div className={`card ${result.result.estimatedProfit >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <div className="flex items-center gap-3 mb-3">
                {result.result.estimatedProfit >= 0
                  ? <TrendingUp className="w-10 h-10 text-green-600" />
                  : <TrendingDown className="w-10 h-10 text-red-500" />}
                <div>
                  <p className="text-sm text-stone-500">Estimated Profit</p>
                  <p className={`text-2xl font-bold ${result.result.estimatedProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    ₹{result.result.estimatedProfit.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="ml-auto"><DataBadge status="estimate" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-stone-500">Total Cost</p>
                  <p className="font-bold text-stone-800">₹{result.result.totalCost.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-stone-500">Expected Revenue</p>
                  <p className="font-bold text-stone-800">₹{result.result.expectedRevenue.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <h4 className="font-semibold text-stone-800 mb-2">Cost Breakdown</h4>
              <div className="space-y-2">
                {result.result.costBreakdown.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-stone-600">{c.label}</span>
                    <span className="font-medium text-stone-800">₹{c.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>

            <SourceInfo source={result.source} showLastUpdated={false} />

            <div className="card bg-stone-50 text-center text-sm text-stone-500">
              <Wallet className="w-6 h-6 mx-auto mb-1 text-stone-300" />
              This is an estimate only. Actual results depend on market prices, yield, and unforeseen factors.
            </div>
          </div>
        )}
      </AnalysisSheet>
    </PageWrapper>
  );
}
