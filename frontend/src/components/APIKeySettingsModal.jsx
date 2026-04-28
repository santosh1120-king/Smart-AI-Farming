import { useState } from 'react'
import toast from 'react-hot-toast'
import { EMPTY_AI_KEYS, clearAIKeys, loadAIKeys, saveAIKeys } from '../services/aiKeys'

function KeyInput({ id, label, name, placeholder, value, onChange, helpText }) {
  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">{label}</label>
      <input
        id={id}
        name={name}
        type="password"
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      <p className="settings-help">{helpText}</p>
    </div>
  )
}

export default function APIKeySettingsModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState(() => loadAIKeys() || EMPTY_AI_KEYS)

  if (!open) {
    return null
  }

  function updateField(fieldName, fieldValue) {
    setForm({
      ...form,
      [fieldName]: fieldValue,
    })
  }

  function handleSave() {
    const savedKeys = saveAIKeys(form)
    onSaved?.(savedKeys)
    toast.success('AI keys saved in this browser')
    onClose()
  }

  function handleClear() {
    clearAIKeys()
    setForm(EMPTY_AI_KEYS)
    onSaved?.(EMPTY_AI_KEYS)
    toast.success('Saved AI keys removed')
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="settings-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-key-settings-title"
      >
        <div className="settings-modal-header">
          <div>
            <h2 id="ai-key-settings-title">AI Key Settings</h2>
            <p>Paste your own free API keys. They stay only in this browser.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close AI key settings">
            x
          </button>
        </div>

        <div className="settings-modal-body">
          <KeyInput
            id="groq-api-key"
            label="Groq API Key"
            name="groqApiKey"
            placeholder={`gsk_abc123${'\u2026'}`}
            value={form.groqApiKey}
            onChange={(value) => updateField('groqApiKey', value)}
            helpText="Used first for text tasks with llama-3.3-70b-versatile and llama-3.1-8b-instant."
          />

          <KeyInput
            id="openrouter-api-key"
            label="OpenRouter API Key"
            name="openRouterApiKey"
            placeholder={`sk-or-v1-abc123${'\u2026'}`}
            value={form.openRouterApiKey}
            onChange={(value) => updateField('openRouterApiKey', value)}
            helpText="Used as fallback and for image-capable crop analysis with free models."
          />

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
