import { useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { ScrollText } from 'lucide-react'
import { SCHEMES, SCHEME_CROPS, SCHEME_STATES } from '../data/schemesData'
import ThemedSelect from '../components/ThemedSelect'

function matchesFilter(value, search) {
  if (!search) {
    return true
  }

  if (!value) {
    return false
  }

  return value.toLowerCase().includes(search.toLowerCase())
}

function filterSchemes(allSchemes, state, crop) {
  return allSchemes.filter((scheme) => {
    const stateMatches = scheme.state === 'All' || matchesFilter(scheme.state, state)
    const cropMatches = scheme.crop_type === 'All' || matchesFilter(scheme.crop_type, crop)
    return stateMatches && cropMatches
  })
}

export default function SchemesPage() {
  const { user } = useAuth()
  const [state, setState] = useState(user?.state || '')
  const [crop, setCrop] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 250)

    return () => clearTimeout(timer)
  }, [])

  const schemes = filterSchemes(SCHEMES, state, crop)

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Government Schemes</h1>
        <p>Browse farmer support schemes, subsidies, and agriculture programs without depending on the backend database.</p>
      </div>

      <div className="settings-callout page-callout">
        These schemes are saved directly in the frontend, so this page still works even when the database has no scheme rows.
      </div>

      <div className="filter-bar">
        <div style={{ flex: 1, minWidth: '14rem' }}>
          <ThemedSelect
            id="scheme-state"
            label="State Search"
            value={state}
            options={SCHEME_STATES.map(s => ({ label: s, value: s === 'All' ? '' : s }))}
            onChange={(e) => setState(e.target.value)}
          />
        </div>

        <div style={{ flex: 1, minWidth: '14rem' }}>
          <ThemedSelect
            id="scheme-crop"
            label="Crop Search"
            value={crop}
            options={SCHEME_CROPS.map(c => ({ label: c, value: c === 'All' ? '' : c }))}
            onChange={(e) => setCrop(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setState('')
              setCrop('')
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} aria-hidden="true" />
          <p className="text-muted">Loading schemes…</p>
        </div>
      ) : schemes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><ScrollText size={22} aria-hidden="true" /></div>
          <h3>No schemes found</h3>
          <p>Try another state or crop filter.</p>
        </div>
      ) : (
        <div className="schemes-grid">
          {schemes.map((scheme) => (
            <div key={scheme.id} className="scheme-card animate-in">
              <div className="scheme-card-header">
                <div>
                  <div className="scheme-card-title">{scheme.name}</div>
                  <div className="scheme-card-ministry">{scheme.ministry}</div>
                </div>
              </div>

              <div className="analysis-meta" style={{ marginBottom: '1.25rem' }}>
                <span className="badge badge-none">{scheme.state}</span>
                {scheme.crop_type && scheme.crop_type !== 'All' && (
                  <span className="badge badge-healthy">{scheme.crop_type}</span>
                )}
              </div>

              <div className="scheme-detail">
                <div className="scheme-detail-label">Description</div>
                <div className="scheme-detail-value">{scheme.description}</div>
              </div>

              <div className="scheme-detail" style={{ background: 'rgba(178, 122, 53, 0.08)', padding: '10px', borderRadius: 10 }}>
                <div className="scheme-detail-label" style={{ color: 'var(--gold)' }}>Benefits</div>
                <div className="scheme-detail-value" style={{ fontWeight: 600 }}>{scheme.benefits}</div>
              </div>

              <div className="scheme-detail">
                <div className="scheme-detail-label">Eligibility</div>
                <div className="scheme-detail-value">{scheme.eligibility}</div>
              </div>

              {scheme.deadline && (
                <div className="scheme-detail">
                  <div className="scheme-detail-label">Deadline</div>
                  <div className="scheme-detail-value">{scheme.deadline}</div>
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <a href={scheme.apply_link} target="_blank" rel="noopener noreferrer" className="scheme-apply-btn">
                  Apply Now
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
