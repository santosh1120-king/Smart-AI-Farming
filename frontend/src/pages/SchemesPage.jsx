import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const STATES = [
  'All','Andhra Pradesh','Bihar','Chhattisgarh','Gujarat','Haryana','Himachal Pradesh',
  'Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab',
  'Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand','West Bengal'
]
const CROPS = ['All','Rice','Wheat','Pulses','Cotton','Sugarcane','Vegetables','Fruits','Flowers','Maize']

export default function SchemesPage() {
  const { user } = useAuth()
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState(user?.state || '')
  const [crop, setCrop] = useState('')

  const fetchSchemes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (state && state !== 'All') params.append('state', state)
      if (crop && crop !== 'All') params.append('crop', crop)
      const { data } = await api.get(`/api/schemes?${params}`)
      setSchemes(data.schemes)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchSchemes() }, [state, crop])

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>📜 Government Schemes</h1>
        <p>Agricultural schemes and subsidies for farmers</p>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select className="form-input" value={state} onChange={e => setState(e.target.value)}>
          {STATES.map(s => <option key={s} value={s === 'All' ? '' : s}>{s}</option>)}
        </select>
        <select className="form-input" value={crop} onChange={e => setCrop(e.target.value)}>
          {CROPS.map(c => <option key={c} value={c === 'All' ? '' : c}>{c}</option>)}
        </select>
        <button className="btn btn-outline" onClick={fetchSchemes}>🔍 Filter</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>Loading schemes...</p>
        </div>
      ) : schemes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No schemes found</h3>
          <p>Try changing the state or crop filters</p>
        </div>
      ) : (
        <div className="schemes-grid">
          {schemes.map((scheme) => (
            <div key={scheme.id} className="scheme-card animate-in">
              <div className="scheme-card-header">
                <div>
                  <div className="scheme-card-title">{scheme.name}</div>
                  <div className="scheme-card-ministry">🏛️ {scheme.ministry}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                  <span className="badge badge-none" style={{ fontSize: 11 }}>🗺️ {scheme.state}</span>
                  {scheme.crop_type && scheme.crop_type !== 'All' && (
                    <span className="badge badge-healthy" style={{ fontSize: 11 }}>🌾 {scheme.crop_type}</span>
                  )}
                </div>
              </div>

              <div className="scheme-detail">
                <div className="scheme-detail-label">Description</div>
                <div className="scheme-detail-value">{scheme.description}</div>
              </div>

              <div className="scheme-detail" style={{ background: 'rgba(34,197,94,0.07)', padding: '10px', borderRadius: 8 }}>
                <div className="scheme-detail-label" style={{ color: 'var(--green-400)' }}>💰 Benefits</div>
                <div className="scheme-detail-value" style={{ fontWeight: 600 }}>{scheme.benefits}</div>
              </div>

              <div className="scheme-detail">
                <div className="scheme-detail-label">✅ Eligibility</div>
                <div className="scheme-detail-value">{scheme.eligibility}</div>
              </div>

              {scheme.deadline && (
                <div className="scheme-detail">
                  <div className="scheme-detail-label">📅 Deadline</div>
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
                  Apply Now →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
