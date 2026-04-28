import { useEffect, useState } from 'react'
import { CalendarDays, Leaf, Trash2 } from 'lucide-react'
import api from '../services/api'

const HEALTH_BADGE = {
  Healthy: 'badge-healthy',
  Risk: 'badge-risk',
  Diseased: 'badge-diseased',
}

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export default function CropHistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHistory() {
      setLoading(true)

      try {
        const { data } = await api.get('/api/crop/history?limit=50')
        setHistory(data.history)
      } catch (error) {
        console.warn('Crop history request failed:', error?.message || error)
        setHistory([])
      }

      setLoading(false)
    }

    loadHistory()
  }, [])

  const formatDate = (isoDate) => {
    return dateFormatter.format(new Date(isoDate))
  }

  const deleteRecord = async (id) => {
    const confirmed = window.confirm('Delete this crop analysis record?')

    if (!confirmed) {
      return
    }

    try {
      await api.delete(`/api/crop/${id}`)
      setHistory((currentHistory) => currentHistory.filter((item) => item.id !== id))
    } catch (error) {
      console.warn('Delete crop history request failed:', error?.message || error)
    }
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Crop History</h1>
        <p>Review your past crop scans, health status, confidence score, and the advice saved for each record.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} aria-hidden="true" />
          <p className="text-muted">Loading crop history…</p>
        </div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Leaf size={22} aria-hidden="true" /></div>
          <h3>No analyses yet</h3>
          <p>Upload your first crop image to start building history for this season.</p>
        </div>
      ) : (
        <div className="history-grid">
          {history.map((item, index) => (
            <div key={item.id} className={`history-item animate-in animate-delay-${Math.min(index + 1, 4)}`}>
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={`${item.analysis.crop_type} analysis`}
                  className="history-thumb"
                  width="88"
                  height="88"
                  loading="lazy"
                />
              )}

              <div className="history-info">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="history-crop">{item.analysis.crop_type}</div>
                    <div className="history-date" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CalendarDays size={14} aria-hidden="true" />
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>

                  <span className={`badge ${HEALTH_BADGE[item.analysis.health_status] || 'badge-none'}`}>
                    {item.analysis.health_status}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', background: 'rgba(49, 65, 51, 0.06)', padding: '4px 10px', borderRadius: 100 }}>
                    Stage: {item.analysis.growth_stage}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', background: 'rgba(49, 65, 51, 0.06)', padding: '4px 10px', borderRadius: 100 }}>
                    Growth: {item.analysis.growth_percentage}%
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', background: 'rgba(49, 65, 51, 0.06)', padding: '4px 10px', borderRadius: 100 }}>
                    Confidence: {Math.round(item.analysis.confidence * 100)}%
                  </span>
                </div>

                {item.analysis.recommendations?.length > 0 && (
                  <div className="history-recs">{item.analysis.recommendations[0]}</div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => deleteRecord(item.id)}
                  aria-label="Delete crop history record"
                  title="Delete record"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
