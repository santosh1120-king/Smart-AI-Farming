import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import api from '../services/api'
import toast from 'react-hot-toast'
import { buildAIHeaders, hasAnyAIKey, loadAIKeys } from '../services/aiKeys'

const HEALTH_COLORS = {
  Healthy: '#22c55e',
  Risk: '#eab308',
  Diseased: '#ef4444',
}

export default function CropAnalysisPage() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setResult(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  })

  const analyzeImage = async () => {
    if (!image) return

    const keys = loadAIKeys()
    if (!hasAnyAIKey(keys)) {
      toast.error('Open AI Keys in the sidebar and paste at least one provider key first.')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', image)
      formData.append('notes', notes)

      const { data } = await api.post('/api/crop/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...buildAIHeaders(keys),
        },
      })
      setResult(data)
      toast.success(`Analysis complete with ${data.provider}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Analysis failed. Check your API keys and try again.')
    } finally {
      setLoading(false)
    }
  }

  const healthColor = result ? HEALTH_COLORS[result.analysis.health_status] : '#22c55e'

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Crop Analysis</h1>
        <p>Upload a crop photo and add optional field notes for AI-powered diagnosis.</p>
      </div>

      <div className="settings-callout page-callout">
        Use the <strong>AI Keys</strong> button in the sidebar to paste your Groq and OpenRouter keys. Keys stay in this browser only.
      </div>

      <div className="card-grid">
        <div className="card">
          {!preview ? (
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
              <input {...getInputProps()} />
              <div className="dropzone-icon">Photo</div>
              <h3>Drop your crop photo here</h3>
              <p>or click to select from camera or gallery</p>
              <p style={{ marginTop: 8 }}>JPG, PNG, WEBP - Max 10MB</p>
              <button type="button" className="btn btn-primary" style={{ marginTop: 20 }}>
                Choose Photo
              </button>
            </div>
          ) : (
            <div>
              <img src={preview} alt="Crop preview" className="crop-preview" />
              <div className="form-group mt-16">
                <label className="form-label">Field Notes (Optional)</label>
                <textarea
                  className="form-input"
                  rows="4"
                  placeholder="Example: Soil is dry, leaves have yellow spots, there was heavy rain two days ago."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={analyzeImage}
                  disabled={loading}
                >
                  {loading ? (
                    <><div className="loading-spinner sm" /> Running AI cascade...</>
                  ) : (
                    'Analyze with AI'
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => { setImage(null); setPreview(null); setResult(null) }}
                  disabled={loading}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {result && (
          <div className="analysis-result-card animate-in">
            <div className="analysis-meta">
              <span className="badge badge-none">{result.provider}</span>
              <span className="badge badge-none">{result.model}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>{result.analysis.crop_type}</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>{result.analysis.growth_stage}</p>
              </div>
              <span className={`badge badge-${result.analysis.health_status.toLowerCase()}`} style={{ fontSize: 13 }}>
                {result.analysis.health_status}
              </span>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                <span>Growth Progress</span>
                <span style={{ color: healthColor }}>{result.analysis.growth_percentage}%</span>
              </div>
              <div className="health-bar-track">
                <div className="health-bar-fill" style={{ width: `${result.analysis.growth_percentage}%`, background: healthColor }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
              <div>
                <div style={{ fontWeight: 700 }}>AI Confidence: {Math.round(result.analysis.confidence * 100)}%</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Based on image and notes analysis</div>
              </div>
            </div>

            {result.analysis.detected_issues?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 10, color: 'var(--red-400)' }}>Detected Issues</div>
                {result.analysis.detected_issues.map((issue, i) => (
                  <div key={i} className="recommendation-item">
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Recommendations</div>
              {result.analysis.recommendations.map((rec, i) => (
                <div key={i} className="recommendation-item">
                  <span>{rec}</span>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Next Steps</div>
              {result.analysis.next_steps.map((step, i) => (
                <div key={i} className="recommendation-item">
                  <span style={{ color: 'var(--green-400)', fontWeight: 700 }}>{i + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!result && !preview && (
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>How It Works</div>
            {[
              'Paste your free provider keys in the AI Keys modal.',
              'Upload a clear crop photo.',
              'Add notes about soil, weather, symptoms, or fertilizer if you have them.',
              'The app runs the provider waterfall and returns diagnosis plus next steps.',
            ].map((step, i) => (
              <div key={i} className="recommendation-item">
                <span style={{ color: 'var(--green-400)', fontWeight: 700, fontSize: 16 }}>{i + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
