import { useState } from 'react';
import { PageWrapper } from '@/components/PageWrapper';
import { DataBadge, SourceInfo } from '@/components/DataBadges';
import { useApp } from '@/context/AppContext';
import { getSellCropRoutes, getVerifiedBuyers, getUnverifiedBuyerMessage, getSellCropLastChecked, type SellCropRoute } from '@/services/sellCropService';
import { getENamInfo } from '@/services/eNamService';
import { OFFICIAL_SOURCES } from '@/services/sourceMetadata';
import { ExternalLink, Package, Truck, Store, FileText, Handshake, Info, Search, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SellCropPage() {
  const { t, location, farmerDetails } = useApp();
  const enamInfo = getENamInfo();
  const buyers = getVerifiedBuyers();
  const buyerMessage = getUnverifiedBuyerMessage();
  const lastChecked = getSellCropLastChecked();

  const [formData, setFormData] = useState({
    crop: farmerDetails?.crop || '',
    variety: '',
    quantity: '',
    unit: 'quintal',
    quality: '',
    harvestDate: '',
    location: [location.city, location.district, location.state].filter(Boolean).join(', '),
    sellingDistance: '50',
    fpoMember: farmerDetails?.fpoMembership === 'yes' ? 'yes' : farmerDetails?.fpoMembership === 'no' ? 'no' : '',
  });
  const [showResults, setShowResults] = useState(false);
  const [routes, setRoutes] = useState<SellCropRoute[]>([]);

  const handleFindRoutes = () => {
    const allRoutes = getSellCropRoutes();
    // Filter routes based on FPO membership
    const filtered = allRoutes.filter(r => {
      if (r.routeType === 'fpo' && formData.fpoMember === 'no') return false;
      return true;
    });
    setRoutes(filtered.length > 0 ? filtered : allRoutes);
    setShowResults(true);
  };

  const routeIcons = [
    <Handshake className="w-5 h-5" />,
    <Handshake className="w-5 h-5" />,
    <Store className="w-5 h-5" />,
    <Package className="w-5 h-5" />,
    <FileText className="w-5 h-5" />,
    <Truck className="w-5 h-5" />,
  ];

  return (
    <PageWrapper title={`\u{1F91D} ${t('sellCrop')}`}>
      {/* Important note */}
      <div className="card mb-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-stone-700">
            SmartFarm helps you find verified market-access pathways. e-NAM provides a marketplace and price-discovery platform — it is NOT a guaranteed direct sale.
          </p>
        </div>
      </div>

      {/* Crop Details Form */}
      <div className="card mb-4">
        <h3 className="font-bold text-stone-800 mb-3">Your Crop Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Crop / Commodity" value={formData.crop} onChange={v => setFormData(d => ({ ...d, crop: v }))} placeholder="e.g., Rice, Cotton, Chilli" />
          <FormField label="Variety (optional)" value={formData.variety} onChange={v => setFormData(d => ({ ...d, variety: v }))} placeholder="e.g., Sona Masuri" />
          <FormField label="Quantity" value={formData.quantity} onChange={v => setFormData(d => ({ ...d, quantity: v }))} placeholder="e.g., 50" />
          <div>
            <label className="text-xs font-medium text-stone-500 block mb-1">Unit</label>
            <select value={formData.unit} onChange={e => setFormData(d => ({ ...d, unit: e.target.value }))} className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600">
              <option value="quintal">Quintal</option>
              <option value="kg">Kilogram</option>
              <option value="ton">Tonne</option>
              <option value="bag">Bag</option>
            </select>
          </div>
          <FormField label="Quality / Grade (optional)" value={formData.quality} onChange={v => setFormData(d => ({ ...d, quality: v }))} placeholder="e.g., Grade A" />
          <FormField label="Harvest-ready date" value={formData.harvestDate} onChange={v => setFormData(d => ({ ...d, harvestDate: v }))} placeholder="Select date" type="date" />
          <div>
            <label className="text-xs font-medium text-stone-500 block mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData(d => ({ ...d, location: e.target.value }))}
              placeholder="Your area"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500 block mb-1">Selling Distance (km)</label>
            <select value={formData.sellingDistance} onChange={e => setFormData(d => ({ ...d, sellingDistance: e.target.value }))} className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600">
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="100">Within 100 km</option>
              <option value="200">Within 200 km</option>
              <option value="any">Any distance</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500 block mb-1">FPO Member?</label>
            <select value={formData.fpoMember} onChange={e => setFormData(d => ({ ...d, fpoMember: e.target.value }))} className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600">
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="interested">Interested in joining</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleFindRoutes}
          disabled={!formData.crop.trim()}
          className="btn btn-primary touch-target w-full text-base mt-4"
        >
          <Search className="w-5 h-5" /> Find Selling Options
        </button>
        {!formData.crop.trim() && (
          <p className="text-xs text-stone-400 mt-2 text-center">Please enter at least your crop name to find selling options.</p>
        )}
      </div>

      {/* Results Section */}
      {showResults && (
        <div className="animate-fade-in">
          {formData.crop && (
            <div className="card mb-4 bg-green-50 border-green-200">
              <p className="text-sm text-stone-700">
                <span className="font-bold">Selling options for:</span> {formData.crop}
                {formData.quantity && ` · ${formData.quantity} ${formData.unit}`}
                {formData.location && ` · ${formData.location}`}
              </p>
            </div>
          )}

          {/* Verified Selling Routes */}
          <h3 className="font-bold text-stone-800 mb-3">🤝 Verified Selling Pathways</h3>
          <div className="space-y-3 mb-6">
            {routes.map((route, i) => (
              <div key={i} className="card">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
                    {routeIcons[i] || <Handshake className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-stone-800">{route.title}</h4>
                    <p className="text-sm text-stone-600 mt-1">{route.description}</p>
                    <div className="mt-3">
                      <p className="text-xs font-medium text-stone-500 mb-1">Steps:</p>
                      <ol className="space-y-1">
                        {route.steps.map((s, si) => (
                          <li key={si} className="text-sm text-stone-700 flex gap-2">
                            <span className="text-green-600 font-medium flex-shrink-0">{si + 1}.</span> {s}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <a href={route.officialLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary text-sm px-4 py-2 inline-flex">
                        <ExternalLink className="w-4 h-4" /> {route.officialLinkLabel}
                      </a>
                    </div>
                    <p className="text-xs text-stone-400 mt-2">Source: {route.source}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* e-NAM Info */}
          <div className="card mb-4 bg-green-50 border-green-200">
            <h3 className="font-bold text-stone-800 mb-2 flex items-center gap-2">
              <span className="text-xl">🌐</span> About e-NAM
            </h3>
            <p className="text-sm text-stone-700 mb-3">{enamInfo.overview}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-stone-500 mb-1">Registration Steps:</p>
                <ul className="space-y-1">
                  {enamInfo.registrationSteps.map((s, i) => <li key={i} className="text-sm text-stone-700 flex gap-2"><span className="text-green-600">•</span> {s}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-stone-500 mb-1">Benefits:</p>
                <ul className="space-y-1">
                  {enamInfo.benefits.map((s, i) => <li key={i} className="text-sm text-stone-700 flex gap-2"><span className="text-green-600">•</span> {s}</li>)}
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {enamInfo.officialLinks.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline text-sm px-3 py-2">
                  <ExternalLink className="w-4 h-4" /> {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Buyer Info */}
          <div className="card mb-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-stone-800">Direct Buyer Information</h3>
            </div>
            {buyers.available && buyers.buyers.length > 0 ? (
              <div className="space-y-2">
                {buyers.buyers.map((b, i) => (
                  <div key={i} className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <DataBadge status="verified" />
                      <span className="font-semibold text-stone-800">{b.companyName}</span>
                    </div>
                    <p className="text-sm text-stone-600">{b.procurementInfo}</p>
                    <p className="text-xs text-stone-400 mt-1">Source: {b.source} · Last checked: {b.lastChecked}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-stone-50 rounded-lg p-3">
                <p className="text-sm text-stone-600">{buyerMessage}</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            <a href={OFFICIAL_SOURCES.ENAM.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline text-sm touch-target flex-col h-auto py-3">
              <span className="text-lg">🌐</span> Open e-NAM
            </a>
            <a href={OFFICIAL_SOURCES.ENAM.register} target="_blank" rel="noopener noreferrer" className="btn btn-outline text-sm touch-target flex-col h-auto py-3">
              <span className="text-lg">📝</span> Register
            </a>
            <a href={OFFICIAL_SOURCES.ENAM.apmcContacts} target="_blank" rel="noopener noreferrer" className="btn btn-outline text-sm touch-target flex-col h-auto py-3">
              <span className="text-lg">🏪</span> View Mandi
            </a>
            <a href="https://enam.gov.in/nam/login" target="_blank" rel="noopener noreferrer" className="btn btn-outline text-sm touch-target flex-col h-auto py-3">
              <span className="text-lg">📦</span> Prepare Lot
            </a>
            <a href="https://enam.gov.in/web/commonhome/loginnyV2" target="_blank" rel="noopener noreferrer" className="btn btn-outline text-sm touch-target flex-col h-auto py-3">
              <span className="text-lg">🚚</span> Logistics
            </a>
            <Link to="/market" className="btn btn-outline text-sm touch-target flex-col h-auto py-3">
              <span className="text-lg">📊</span> Compare Markets
            </Link>
          </div>

          {/* Source Info */}
          <div className="card">
            <SourceInfo source={{
              sourceName: OFFICIAL_SOURCES.ENAM.name,
              sourceUrl: OFFICIAL_SOURCES.ENAM.url,
              sourceType: 'OFFICIAL',
              isLive: false,
              isVerified: true,
              lastUpdated: lastChecked,
              status: 'available',
            }} />
          </div>
        </div>
      )}

      {/* Initial state before search */}
      {!showResults && (
        <div className="card text-center text-stone-500 py-8">
          <Handshake className="w-12 h-12 mx-auto mb-3 text-stone-300" />
          <p className="text-sm">Enter your crop details above and tap "Find Selling Options" to see verified selling pathways.</p>
        </div>
      )}
    </PageWrapper>
  );
}


function FormField({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-stone-500 block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
      />
    </div>
  );
}
