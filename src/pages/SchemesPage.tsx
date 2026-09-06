import { useState, useEffect, useCallback } from 'react';
import { PageWrapper } from '@/components/PageWrapper';
import { DataBadge, SourceInfo, LoadingSpinner, ErrorState } from '@/components/DataBadges';
import { useApp } from '@/context/AppContext';
import { fetchSchemes, searchSchemes, ELIGIBILITY_LABELS, type SchemeResult, type SchemeSearchResult } from '@/services/schemeService';
import { OFFICIAL_SOURCES } from '@/services/sourceMetadata';
import { ExternalLink, Landmark, Filter, CheckCircle2, Search, X } from 'lucide-react';

export function SchemesPage() {
  const { t, location } = useApp();
  const [result, setResult] = useState<SchemeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [levelFilter, setLevelFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SchemeSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = fetchSchemes(location.state, '');
      setResult(r);
    } catch {
      setError('Government scheme information could not be loaded right now.');
    } finally {
      setLoading(false);
    }
  }, [location.state]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResult(null);
      return;
    }
    setIsSearching(true);
    setSearchResult(await searchSchemes(query));
    setIsSearching(false);
  };

  const displayedSchemes = searchResult?.schemes ?? result?.schemes ?? [];
  const filteredSchemes = displayedSchemes.filter(s => {
    if (levelFilter && s.level !== levelFilter) return false;
    return true;
  });

  return (
    <PageWrapper title={`\u{1F3DB}\uFE0F ${t('schemes')}`}>
      {/* Filters */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setShowFilters(s => !s)} className="btn btn-outline text-sm px-3 py-2">
          <Filter className="w-4 h-4" /> Filter
        </button>
        {result && <DataBadge status={searchResult?.isLive ? 'live' : 'verified'} />}
      </div>

      <form onSubmit={(event) => { event.preventDefault(); void handleSearch(); }} className="card mb-4">
        <label htmlFor="scheme-search" className="text-sm font-medium text-stone-600 block mb-2">Search schemes</label>
        <div className="flex gap-2">
          <input
            id="scheme-search"
            type="search"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="e.g., insurance, credit, soil"
            className="input-field flex-1"
          />
          <button type="submit" disabled={isSearching} className="btn btn-primary text-sm px-4 touch-target">
            <Search className="w-4 h-4" /> {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
        {searchResult && (
          <div className="flex items-center justify-between gap-2 mt-2 text-xs text-stone-500">
            <span>{searchResult.isLive ? 'Showing live myScheme search results.' : 'Showing matching schemes from the available official-link catalogue.'}</span>
            <button type="button" onClick={() => { setSearchQuery(''); setSearchResult(null); }} className="inline-flex items-center gap-1 text-green-700 font-medium">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        )}
      </form>

      {showFilters && (
        <div className="card mb-4 animate-fade-in">
          <label className="text-sm font-medium text-stone-600 block mb-1">Level</label>
          <select
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
          >
            <option value="">All Levels</option>
            <option value="Central">Central Government</option>
            <option value="State">State Government</option>
            <option value="District">District Level</option>
          </select>
        </div>
      )}

      {loading && <LoadingSpinner label="Loading government schemes..." />}

      {error && <ErrorState message={error} onRetry={loadData} officialLink={OFFICIAL_SOURCES.MYSCHEME.url} />}

      {!loading && !error && result && (
        <>
          {/* Info */}
          <div className="card mb-4 bg-blue-50 border-blue-200">
            <p className="text-sm text-stone-700">
              These are known government schemes for farmers. Check the official myScheme portal for the complete list and to check your eligibility.
            </p>
            <a href={OFFICIAL_SOURCES.MYSCHEME.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline text-sm px-3 py-2 mt-2">
              <ExternalLink className="w-4 h-4" /> Open myScheme Portal
            </a>
          </div>

          {/* Scheme Cards */}
          <div className="space-y-3">
            {filteredSchemes.map((scheme, i) => {
              const label = ELIGIBILITY_LABELS[scheme.eligibilityLabel];
              return (
                <div key={i} className="card">
                  <div className="flex items-start gap-3 mb-2">
                    <Landmark className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-stone-800">{scheme.name}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="badge bg-purple-100 text-purple-800">{scheme.level}</span>
                        <span className={`badge ${label.color}`}>{label.emoji} {label.text}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mt-3">
                    <DetailItem label="Eligibility" value={scheme.eligibility} />
                    <DetailItem label="Benefits" value={scheme.benefits} />
                    <div>
                      <p className="text-xs font-medium text-stone-500">Required Documents:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {scheme.documents.map((d, di) => (
                          <span key={di} className="text-xs bg-stone-100 text-stone-700 rounded-full px-2 py-0.5">{d}</span>
                        ))}
                      </div>
                    </div>
                    <DetailItem label="How to Apply" value={scheme.applicationMethod} />
                    {scheme.deadline && <DetailItem label="Deadline" value={scheme.deadline} />}
                    {scheme.status && <DetailItem label="Status" value={scheme.status} />}
                  </div>

                  <a href={scheme.applicationLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary text-sm px-4 py-2 mt-3 inline-flex">
                    <ExternalLink className="w-4 h-4" /> Apply / Learn More
                  </a>
                  <p className="text-xs text-stone-400 mt-2">Source: {scheme.source} · Last checked: {scheme.lastChecked}</p>
                </div>
              );
            })}
          </div>

          {displayedSchemes.length > 0 && (
            <div className="mt-4">
              <SourceInfo source={result.source} />
            </div>
          )}

          {filteredSchemes.length === 0 && (
            <div className="card text-center text-stone-500 py-6">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-stone-300" />
              No schemes match this search or filter. Try a different term or select "All Levels".
            </div>
          )}
        </>
      )}
    </PageWrapper>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="text-sm text-stone-700">{value}</p>
    </div>
  );
}
