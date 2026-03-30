import { useState, useEffect } from 'react'
import api from '../services/api'

const HEALTH_BADGE = {
  Healthy: 'badge-healthy',
  Risk: 'badge-risk',
  Diseased: 'badge-diseased',
}

export default function CropHistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/crop/history?limit=50')
      setHistory(data.history)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchHistory() }, [])

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const deleteRecord = async (id) => {
    try {
      await api.delete(`/api/crop/${id}`)
      setHistory(h => h.filter(item => item.id !== id))
    } catch {}
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>📋 Crop History</h1>
        <p>Your previous crop analysis records</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
        </div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌱</div>
          <h3>No analyses yet</h3>
          <p>Upload your first crop image to get started</p>
        </div>
      ) : (
        <div className="history-grid">
          {history.map((item, idx) => (
            <div key={item.id} className={`history-item animate-in animate-delay-${Math.min(idx + 1, 4)}`}>
              {item.image_url && (
                <img src={item.image_url} alt="crop" className="history-thumb" />
              )}
              <div className="history-info">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <div className="history-crop">{item.analysis.crop_type}</div>
                    <div className="history-date">📅 {formatDate(item.created_at)}</div>
                  </div>
                  <span className={`badge ${HEALTH_BADGE[item.analysis.health_status] || 'badge-none'}`}>
                    {item.analysis.health_status === 'Healthy' ? '✅' : item.analysis.health_status === 'Risk' ? '⚠️' : '🚨'}
                    &nbsp;{item.analysis.health_status}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: 100 }}>
                    🌱 {item.analysis.growth_stage}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: 100 }}>
                    📊 Growth: {item.analysis.growth_percentage}%
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: 100 }}>
                    🎯 {Math.round(item.analysis.confidence * 100)}% confidence
                  </span>
                </div>

                {item.analysis.recommendations?.length > 0 && (
                  <div className="history-recs">
                    💡 {item.analysis.recommendations[0]}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => deleteRecord(item.id)}
                  style={{ color: 'var(--red-400)', fontSize: 12 }}
                  title="Delete record"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
