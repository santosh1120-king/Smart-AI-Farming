import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { EMPTY_AI_KEYS, clearAIKeys, loadAIKeys, saveAIKeys } from '../services/aiKeys'

export default function APIKeySettingsModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_AI_KEYS)

  useEffect(() => {
    if (!open) return
    setForm(loadAIKeys())
  }, [open])

  if (!open) return null

  const handleSave = () => {
    const saved = saveAIKeys(form)
    onSaved?.(saved)
    toast.success('AI keys saved in this browser')
    onClose()
  }

  const handleClear = () => {
    clearAIKeys()
    setForm(EMPTY_AI_KEYS)
    onSaved?.(EMPTY_AI_KEYS)
    toast.success('Saved AI keys removed')
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <div>
            <h2>AI Key Settings</h2>
            <p>Paste your own free API keys. They stay only in this browser.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>x</button>
        </div>

        <div className="settings-modal-body">
          <div className="form-group">
            <label className="form-label">Groq API Key</label>
            <input
              type="password"
              className="form-input"
              placeholder="gsk_..."
              value={form.groqApiKey}
              onChange={(e) => setForm({ ...form, groqApiKey: e.target.value })}
            />
            <p className="settings-help">
              Used first for text tasks with `llama-3.3-70b-versatile` and `llama-3.1-8b-instant`.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">OpenRouter API Key</label>
            <input
              type="password"
              className="form-input"
              placeholder="sk-or-v1-..."
              value={form.openRouterApiKey}
              onChange={(e) => setForm({ ...form, openRouterApiKey: e.target.value })}
            />
            <p className="settings-help">
              Used as fallback and for image-capable crop analysis with free models.
            </p>
          </div>

          <div className="settings-callout">
            <strong>Waterfall order:</strong> Groq first, then OpenRouter fallback. Image analysis can require OpenRouter because the selected free Groq models are text-focused.
          </div>
        </div>

        <div className="settings-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={handleClear}>Clear Keys</button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>Save Keys</button>
        </div>
      </div>
    </div>
  )
}
