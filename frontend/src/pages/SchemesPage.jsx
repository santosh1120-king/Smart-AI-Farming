import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { SCHEMES, SCHEME_CROPS, SCHEME_STATES } from '../data/schemesData'

function matchesFilter(value, search) {
  if (!search) return true
  if (!value) return false
  return value.toLowerCase().includes(search.toLowerCase())
}

export default function SchemesPage() {
  const { user } = useAuth()
  const [state, setState] = useState(user?.state || '')
  const [crop, setCrop] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 250)
    return () => clearTimeout(timer)
  }, [])

  const schemes = useMemo(() => {
    return SCHEMES.filter((scheme) => {
      const stateMatch = scheme.state === 'All' || matchesFilter(scheme.state, state)
      const cropMatch = scheme.crop_type === 'All' || matchesFilter(scheme.crop_type, crop)
      return stateMatch && cropMatch
    })
  }, [state, crop])

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Government Schemes</h1>
        <p>Browse farmer support schemes, subsidies, and state-specific agriculture programs.</p>
      </div>

      <div className="settings-callout page-callout">
        These schemes are now hardcoded in the frontend, so the page works even if the backend or database has no scheme rows.
      </div>

      <div className="filter-bar">
        <select className="form-input" value={state} onChange={(e) => setState(e.target.value)}>
          {SCHEME_STATES.map((entry) => <option key={entry} value={entry === 'All' ? '' : entry}>{entry}</option>)}
        </select>
        <select className="form-input" value={crop} onChange={(e) => setCrop(e.target.value)}>
          {SCHEME_CROPS.map((entry) => <option key={entry} value={entry === 'All' ? '' : entry}>{entry}</option>)}
        </select>
        <button type="button" className="btn btn-outline" onClick={() => { setState(''); setCrop('') }}>
          Reset Filters
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>Loading schemes...</p>
        </div>
      ) : schemes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">No Match</div>
          <h3>No schemes found</h3>
          <p>Try changing the state or crop filters.</p>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                  <span className="badge badge-none" style={{ fontSize: 11 }}>{scheme.state}</span>
                  {scheme.crop_type && scheme.crop_type !== 'All' && (
                    <span className="badge badge-healthy" style={{ fontSize: 11 }}>{scheme.crop_type}</span>
                  )}
                </div>
              </div>

              <div className="scheme-detail">
                <div className="scheme-detail-label">Description</div>
                <div className="scheme-detail-value">{scheme.description}</div>
              </div>

              <div className="scheme-detail" style={{ background: 'rgba(34,197,94,0.07)', padding: '10px', borderRadius: 8 }}>
                <div className="scheme-detail-label" style={{ color: 'var(--green-400)' }}>Benefits</div>
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
                <a
                  href={scheme.apply_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="scheme-apply-btn"
                >
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
