import { PageWrapper } from '@/components/PageWrapper';
import { DataBadge, SourceInfo } from '@/components/DataBadges';
import { useApp } from '@/context/AppContext';
import { getSupportInfo, getSupportTypes } from '@/services/supportService';
import { Building, Phone, ExternalLink, MapPin } from 'lucide-react';

export function SupportPage() {
  const { t, location } = useApp();
  const info = getSupportInfo(location.state, location.district);
  const types = getSupportTypes();

  return (
    <PageWrapper title={`\u{1F3E2} ${t('getHelp')}`}>
      {/* Important note */}
      <div className="card mb-4 bg-amber-50 border-amber-200">
        <p className="text-sm text-amber-800">
          We do not invent support center details. Use the official portals below to find your nearest support center with verified contact information.
        </p>
      </div>

      {/* Official Helpline */}
      <div className="card mb-4 bg-green-50 border-green-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-green-700 flex items-center justify-center flex-shrink-0">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-stone-800">{info.officialHelpline.name}</h3>
            <a href={`tel:${info.officialHelpline.phone}`} className="text-lg font-semibold text-green-700">
              {info.officialHelpline.phone}
            </a>
            <p className="text-xs text-stone-500">Free helpline for farmers across India</p>
          </div>
        </div>
        <a href={info.officialHelpline.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary text-sm px-4 py-2 mt-3 inline-flex">
          <ExternalLink className="w-4 h-4" /> Open Kisan SARATHI
        </a>
      </div>

      {/* Support Types */}
      <h3 className="font-bold text-stone-800 mb-3">Find Agricultural Support</h3>
      <div className="space-y-3 mb-4">
        {types.map((type, i) => (
          <div key={i} className="card">
            <div className="flex items-start gap-3">
              <Building className="w-6 h-6 text-stone-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-stone-800">{type.type}</h4>
                <p className="text-sm text-stone-600 mt-1">{type.description}</p>
                <a href={type.findUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline text-sm px-3 py-2 mt-2 inline-flex">
                  <ExternalLink className="w-4 h-4" /> Find Near You
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Location-specific note */}
      {location.state && (
        <div className="card mb-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-stone-700">
              Showing support options for <span className="font-semibold">{location.state}</span>.
              {location.state === 'Andhra Pradesh' && ' Rythu Bharosa Kendras may be available in your area — check the Andhra Pradesh agriculture portal.'}
            </p>
          </div>
        </div>
      )}

      <div className="card">
        <DataBadge status="verified" />
        <SourceInfo source={info.source} />
      </div>
    </PageWrapper>
  );
}
