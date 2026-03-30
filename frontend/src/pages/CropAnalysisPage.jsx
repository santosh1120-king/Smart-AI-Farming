import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import api from '../services/api'
import toast from 'react-hot-toast'

const HEALTH_COLORS = {
  Healthy: '#22c55e',
  Risk: '#eab308',
  Diseased: '#ef4444',
}

export default function CropAnalysisPage() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
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
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', image)
      const { data } = await api.post('/api/crop/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data)
      toast.success(`Analysis complete! Crop: ${data.analysis.crop_type}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Analysis failed. Check your API key and try again.')
    } finally {
      setLoading(false)
    }
  }

  const healthColor = result ? HEALTH_COLORS[result.analysis.health_status] : '#22c55e'

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>🔬 Crop Analysis</h1>
        <p>Upload a crop photo for AI-powered health assessment</p>
      </div>

      <div className="card-grid">
        {/* Upload Section */}
        <div className="card">
          {!preview ? (
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
              <input {...getInputProps()} />
              <div className="dropzone-icon">📸</div>
              <h3>Drop your crop photo here</h3>
              <p>or click to select from camera / gallery</p>
              <p style={{ marginTop: 8 }}>JPG, PNG, WEBP — Max 10MB</p>
              <button className="btn btn-primary" style={{ marginTop: 20 }}>
                📁 Choose Photo
              </button>
            </div>
          ) : (
            <div>
              <img src={preview} alt="Crop preview" className="crop-preview" />
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={analyzeImage}
                  disabled={loading}
                >
                  {loading ? (
                    <><div className="loading-spinner sm" /> Analyzing with AI...</>
                  ) : (
                    '🤖 Analyze with AI'
                  )}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => { setImage(null); setPreview(null); setResult(null) }}
                  disabled={loading}
                >
                  ✕ Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Result Section */}
        {result && (
          <div className="analysis-result-card animate-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>{result.analysis.crop_type}</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>{result.analysis.growth_stage}</p>
              </div>
              <span className={`badge badge-${result.analysis.health_status.toLowerCase()}`} style={{ fontSize: 13 }}>
                {result.analysis.health_status === 'Healthy' ? '✅' : result.analysis.health_status === 'Risk' ? '⚠️' : '🚨'}&nbsp;
                {result.analysis.health_status}
              </span>
            </div>

            {/* Growth Progress */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                <span>Growth Progress</span>
                <span style={{ color: healthColor }}>{result.analysis.growth_percentage}%</span>
              </div>
              <div className="health-bar-track">
                <div className="health-bar-fill" style={{ width: `${result.analysis.growth_percentage}%`, background: healthColor }} />
              </div>
            </div>

            {/* Confidence */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
              <span style={{ fontSize: 20 }}>🎯</span>
              <div>
                <div style={{ fontWeight: 700 }}>AI Confidence: {Math.round(result.analysis.confidence * 100)}%</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Based on visual analysis</div>
              </div>
            </div>

            {/* Issues */}
            {result.analysis.detected_issues?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 10, color: 'var(--red-400)' }}>🔴 Detected Issues</div>
                {result.analysis.detected_issues.map((issue, i) => (
                  <div key={i} className="recommendation-item">
                    <span>⚠️</span> {issue}
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>💡 Recommendations</div>
              {result.analysis.recommendations.map((rec, i) => (
                <div key={i} className="recommendation-item">
                  <span>✅</span> <span>{rec}</span>
                </div>
              ))}
            </div>

            {/* Next Steps */}
            <div>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>📋 Next Steps</div>
              {result.analysis.next_steps.map((step, i) => (
                <div key={i} className="recommendation-item">
                  <span style={{ color: 'var(--green-400)', fontWeight: 700 }}>{i + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions when no image */}
        {!result && !preview && (
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>📖 How It Works</div>
            {['Take a clear photo of your crop leaves or plant 📸',
              'Upload the photo using the drag area 📤',
              'AI analyzes crop type, health, and growth stage 🤖',
              'Get recommendations and next steps instantly ✅',
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
