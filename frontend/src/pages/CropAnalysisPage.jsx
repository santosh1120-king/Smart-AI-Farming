import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { AlertCircle, ImagePlus, ScanSearch, Sparkles } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const HEALTH_COLORS = {
  Healthy: '#708456',
  Risk: '#b27a35',
  Diseased: '#b45442',
}

function AnalysisHowItWorksCard() {
  const steps = [
    'Upload a clear crop image from the affected field area.',
    'Add notes about weather, soil, symptoms, or recent treatments.',
    'Review the diagnosis, confidence level, recommendations, and step-by-step actions.',
  ]

  return (
    <div className="card">
      <div className="form-label" style={{ marginBottom: '0.5rem' }}>How this works</div>
      {steps.map((step, index) => (
        <div key={index} className="recommendation-item">
          <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{index + 1}</span>
          <span>{step}</span>
        </div>
      ))}
    </div>
  )
}

function AnalysisResultCard({ result, healthColor }) {
  return (
    <div className="analysis-result-card animate-in">
      <div className="analysis-meta">
        <span className="badge badge-none">{result.provider}</span>
        <span className="badge badge-none">{result.model}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'Cormorant Garamond, serif', fontSize: '2.25rem', lineHeight: 0.92, color: 'var(--ink-strong)' }}>
            {result.analysis.crop_type}
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--ink-soft)' }}>{result.analysis.growth_stage}</p>
        </div>
        <span className={`badge badge-${result.analysis.health_status.toLowerCase()}`}>{result.analysis.health_status}</span>
      </div>

      <div style={{ marginBottom: '1.15rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem', fontSize: '0.95rem', fontWeight: 600 }}>
          <span>Growth progress</span>
          <span style={{ color: healthColor }}>{result.analysis.growth_percentage}%</span>
        </div>
        <div className="health-bar-track">
          <div className="health-bar-fill" style={{ width: `${result.analysis.growth_percentage}%`, background: healthColor }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.15rem', padding: '0.95rem 1rem', borderRadius: '1rem', background: 'rgba(49, 65, 51, 0.05)' }}>
        <Sparkles size={18} color="var(--gold)" aria-hidden="true" />
        <div>
          <div style={{ fontWeight: 700 }}>AI confidence: {Math.round(result.analysis.confidence * 100)}%</div>
          <div className="text-sm text-muted">Blended from the image and the field notes you supplied.</div>
        </div>
      </div>

      {result.analysis.detected_issues?.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div className="form-label" style={{ marginBottom: '0.35rem', color: 'var(--red-soft)' }}>Detected Issues</div>
          {result.analysis.detected_issues.map((issue, index) => (
            <div key={index} className="recommendation-item">
              <AlertCircle size={16} color="var(--red-soft)" aria-hidden="true" />
              <span>{issue}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <div className="form-label" style={{ marginBottom: '0.35rem' }}>Recommendations</div>
        {result.analysis.recommendations.map((recommendation, index) => (
          <div key={index} className="recommendation-item">
            <span>{recommendation}</span>
          </div>
        ))}
      </div>

      <div>
        <div className="form-label" style={{ marginBottom: '0.35rem' }}>Next Steps</div>
        {result.analysis.next_steps.map((step, index) => (
          <div key={index} className="recommendation-item">
            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{index + 1}</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CropAnalysisPage() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  function onDrop(acceptedFiles) {
    const file = acceptedFiles[0]

    if (!file) {
      return
    }

    setImage(file)
    setPreview(URL.createObjectURL(file))
    setResult(null)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  })

  async function analyzeImage() {
    if (!image) {
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', image)
      formData.append('notes', notes)

      const { data } = await api.post('/api/crop/analyze', formData)

      setResult(data)
      toast.success(`Analysis complete with ${data.provider}`)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Analysis failed. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  function resetAnalysis() {
    setImage(null)
    setPreview(null)
    setResult(null)
    setNotes('')
  }

  const healthColor = result ? HEALTH_COLORS[result.analysis.health_status] : '#708456'

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Crop Analysis</h1>
        <p>Upload one clean field image, add a little context, and let the AI stack turn that into a practical diagnosis you can act on.</p>
      </div>


      <div className="card-grid">
        <div className="card">
          {!preview ? (
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} role="button" aria-label="Upload crop photo">
              <input {...getInputProps()} />
              <div className="dropzone-icon"><ImagePlus size={28} aria-hidden="true" /></div>
              <h3>Drop a crop photo here</h3>
              <p>Use a close, well-lit image of leaves, stems, fruit, or affected areas.</p>
              <p>Accepted formats: JPG, PNG, WEBP. Maximum file size: 10 MB.</p>
              <button type="button" className="btn btn-primary" style={{ marginTop: '1.2rem' }}>
                Choose photo
              </button>
            </div>
          ) : (
            <div>
              <img src={preview} alt="Crop preview" className="crop-preview" width="640" height="420" />

              <div className="form-group mt-16">
                <label htmlFor="field-notes" className="form-label">Field Notes</label>
                <textarea
                  id="field-notes"
                  name="notes"
                  className="form-input"
                  placeholder={`Example: lower leaves yellowing, no rain for a week, clay soil, recent urea application${'\u2026'}`}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  autoComplete="off"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.7rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={analyzeImage} disabled={loading}>
                  {loading ? (
                    <><div className="loading-spinner sm" aria-hidden="true" /> {`Running diagnosis${'\u2026'}`}</>
                  ) : (
                    <><ScanSearch size={16} aria-hidden="true" /> Analyze image</>
                  )}
                </button>

                <button type="button" className="btn btn-outline" onClick={resetAnalysis} disabled={loading}>
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {result ? (
          <AnalysisResultCard result={result} healthColor={healthColor} />
        ) : (
          <AnalysisHowItWorksCard />
        )}
      </div>
    </div>
  )
}
