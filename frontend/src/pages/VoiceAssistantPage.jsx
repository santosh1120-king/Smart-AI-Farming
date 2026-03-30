import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

const SAMPLE_QUESTIONS = [
  'When should I water my wheat crop?',
  'How to treat yellow leaves on rice?',
  'What fertilizer is best for tomatoes?',
  'Signs of pest attack on my crop?',
  'Best time to harvest potatoes?',
]

export default function VoiceAssistantPage() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const recognitionRef = useRef(null)

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const hasSpeechRecognition = !!SpeechRecognition

  const startListening = () => {
    if (!hasSpeechRecognition) {
      toast.error('Voice recognition not supported in this browser. Use Chrome.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => { setIsListening(false); toast.error('Microphone error') }
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setQuery(transcript)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  const askQuestion = async (q = query) => {
    if (!q.trim()) { toast.error('Please type or speak your question'); return }
    setLoading(true)
    setResponse(null)
    try {
      const { data } = await api.post('/api/voice/query', { query: q })
      setResponse(data.response)
      speakResponse(data.response)
      toast.success('Response ready!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to get response')
    } finally {
      setLoading(false)
    }
  }

  const speakResponse = (text) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-IN'
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>🎙️ Voice Assistant</h1>
        <p>Ask farming questions using your voice or keyboard</p>
      </div>

      <div className="voice-page">
        {/* Mic Button */}
        <div className="mic-container animate-in animate-delay-1">
          <button
            className={`mic-btn ${isListening ? 'listening' : ''}`}
            onClick={isListening ? stopListening : startListening}
            title={hasSpeechRecognition ? (isListening ? 'Stop listening' : 'Start speaking') : 'Voice not supported'}
          >
            {isListening ? '🔴' : '🎤'}
          </button>
          <div className="mic-status">
            {isListening ? '🔴 Listening... Speak now' :
             !hasSpeechRecognition ? '⚠️ Use Chrome for voice input' :
             '🎤 Press to speak your question'}
          </div>
        </div>

        {/* Text Input */}
        <div style={{ width: '100%', maxWidth: 680, display: 'flex', gap: 10 }} className="animate-in animate-delay-2">
          <input
            type="text"
            className="form-input"
            placeholder="Type or speak your farming question..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && askQuestion()}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={() => askQuestion()}
            disabled={loading}
          >
            {loading ? <div className="loading-spinner sm" /> : '➤'}
          </button>
        </div>

        {/* Sample Questions */}
        <div style={{ width: '100%', maxWidth: 680 }} className="animate-in animate-delay-3">
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            💡 Sample Questions
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                className="btn btn-ghost btn-sm"
                onClick={() => { setQuery(q); askQuestion(q) }}
                style={{ fontSize: 12 }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Transcript */}
        {query && !response && (
          <div className="voice-transcript animate-in" style={{ width: '100%', maxWidth: 680 }}>
            "{query}"
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--color-text-muted)' }}>AI is thinking... 🤔</p>
          </div>
        )}

        {/* Response */}
        {response && (
          <div className="voice-response animate-in" style={{ width: '100%', maxWidth: 680 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h4>🌾 FARMING ADVISOR</h4>
              <div style={{ display: 'flex', gap: 8 }}>
                {isSpeaking ? (
                  <button className="btn btn-sm btn-ghost" onClick={stopSpeaking}>⏹ Stop</button>
                ) : (
                  <button className="btn btn-sm btn-ghost" onClick={() => speakResponse(response)}>🔊 Listen</button>
                )}
              </div>
            </div>
            <p style={{ fontWeight: 500, lineHeight: 1.7, fontSize: 16 }}>{response}</p>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                Your question: "{query}"
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
