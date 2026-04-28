import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const SAMPLE_QUESTIONS = [
  'When should I water my wheat crop?',
  'How do I treat yellow leaves on rice after heavy rain?',
  'What fertilizer is best for tomatoes in flowering stage?',
  'These leaves have holes and curling. What pest could it be?',
  'How can I improve yield for potatoes this season?',
]

function VoiceControls({ isMuted, isListening, isSpeaking, loading, onToggleMute, onStopAll }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 }}>
      <button type="button" className="btn btn-sm btn-ghost" onClick={onToggleMute}>
        {isMuted ? 'Unmute Voice' : 'Mute Voice'}
      </button>
      <button
        type="button"
        className="btn btn-sm btn-ghost"
        onClick={onStopAll}
        disabled={!isListening && !isSpeaking && !loading}
      >
        Stop All
      </button>
    </div>
  )
}

function SampleQuestionButtons({ onPickQuestion }) {
  return (
    <div style={{ width: '100%', maxWidth: 680 }} className="animate-in animate-delay-3">
      <div className="form-label" style={{ marginBottom: 10 }}>Sample Questions</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {SAMPLE_QUESTIONS.map((sampleQuestion) => (
          <button
            type="button"
            key={sampleQuestion}
            className="btn btn-ghost btn-sm"
            onClick={() => onPickQuestion(sampleQuestion)}
          >
            {sampleQuestion}
          </button>
        ))}
      </div>
    </div>
  )
}

function ResponseCard({ response, providerMeta, isMuted, isSpeaking, onToggleMute, onStopSpeaking, onSpeak, query }) {
  return (
    <div className="voice-response animate-in" style={{ width: '100%', maxWidth: 680 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 12, flexWrap: 'wrap' }}>
        <h4>Farming Advisor</h4>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {providerMeta && (
            <>
              <span className="badge badge-none">{providerMeta.provider}</span>
              <span className="badge badge-none">{providerMeta.model}</span>
            </>
          )}

          {isMuted ? (
            <button type="button" className="btn btn-sm btn-ghost" onClick={onToggleMute}>
              <VolumeX size={14} aria-hidden="true" />
              Unmute
            </button>
          ) : isSpeaking ? (
            <button type="button" className="btn btn-sm btn-ghost" onClick={onStopSpeaking}>
              Stop Voice
            </button>
          ) : (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => onSpeak(response)}>
              <Volume2 size={14} aria-hidden="true" />
              Listen
            </button>
          )}
        </div>
      </div>

      <p style={{ fontWeight: 500, lineHeight: 1.7, fontSize: 16 }}>{response}</p>

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(49, 65, 51, 0.1)' }}>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          Your question: "{query}"
        </div>
      </div>
    </div>
  )
}

export default function VoiceAssistantPage() {
  const [query, setQuery] = useState('')
  const [context, setContext] = useState('')
  const [response, setResponse] = useState(null)
  const [providerMeta, setProviderMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('voiceMuted') === 'true')
  const recognitionRef = useRef(null)
  const abortRef = useRef(null)

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const hasSpeechRecognition = Boolean(SpeechRecognition)

  function startListening() {
    if (!hasSpeechRecognition) {
      toast.error('Voice recognition is not supported in this browser. Use Chrome.')
      return
    }

    stopSpeaking()

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => {
      setIsListening(false)
      toast.error('Microphone error. Try again.')
    }
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setQuery(transcript)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  function stopListening() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    setIsListening(false)
  }

  function stopSpeaking() {
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }

  function stopAll() {
    stopListening()
    stopSpeaking()

    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }

    setLoading(false)
  }

  function speakResponse(text) {
    if (isMuted || !window.speechSynthesis) {
      return
    }

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-IN'
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  async function askQuestion(questionText = query) {
    if (!questionText.trim()) {
      toast.error('Please type or speak your question.')
      return
    }

    setLoading(true)
    setResponse(null)
    setProviderMeta(null)

    if (abortRef.current) {
      abortRef.current.abort()
    }

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const { data } = await api.post(
        '/api/voice/query',
        { query: questionText, context },
        { signal: controller.signal },
      )

      setResponse(data.response)
      setProviderMeta({
        provider: data.provider,
        model: data.model,
      })
      speakResponse(data.response)
      toast.success(`Response ready from ${data.provider}`)
    } catch (error) {
      if (error.code === 'ERR_CANCELED') {
        return
      }

      toast.error(error.response?.data?.detail || 'Failed to get AI response.')
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
      }

      setLoading(false)
    }
  }

  function handleSampleQuestion(sampleQuestion) {
    setQuery(sampleQuestion)
    askQuestion(sampleQuestion)
  }

  function toggleMute() {
    const nextMutedValue = !isMuted
    setIsMuted(nextMutedValue)
    localStorage.setItem('voiceMuted', String(nextMutedValue))

    if (nextMutedValue) {
      stopSpeaking()
      toast.success('Voice output muted.')
    } else {
      toast.success('Voice output unmuted.')
    }
  }

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort?.()
      window.speechSynthesis?.cancel()
      abortRef.current?.abort()
    }
  }, [])

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Voice Assistant</h1>
        <p>Ask farming questions using your voice or keyboard and get simple advice back from the AI providers.</p>
      </div>

      <div className="settings-callout page-callout">
        AI providers are configured on the server. Ask any farming question and get advice instantly.
      </div>

      <div className="voice-page">
        <div className="mic-container animate-in animate-delay-1">
          <button
            type="button"
            className={`mic-btn ${isListening ? 'listening' : ''}`}
            onClick={isListening ? stopListening : startListening}
            disabled={loading}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
          </button>

          <div className="mic-status" aria-live="polite">
            {isListening
              ? `Listening${'\u2026'} Speak now.`
              : !hasSpeechRecognition
                ? 'Use Chrome if you want voice input.'
                : 'Press the microphone button to speak.'}
          </div>

          <VoiceControls
            isMuted={isMuted}
            isListening={isListening}
            isSpeaking={isSpeaking}
            loading={loading}
            onToggleMute={toggleMute}
            onStopAll={stopAll}
          />
        </div>

        <div style={{ width: '100%', maxWidth: 680 }} className="animate-in animate-delay-2">
          <div className="form-group">
            <label htmlFor="voice-question" className="form-label">Question</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                id="voice-question"
                name="question"
                type="text"
                className="form-input"
                placeholder={`Type or speak your farming question${'\u2026'}`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    askQuestion()
                  }
                }}
                style={{ flex: 1 }}
                autoComplete="off"
                spellCheck={false}
              />
              <button type="button" className="btn btn-primary" onClick={() => askQuestion()} disabled={loading}>
                {loading ? <div className="loading-spinner sm" aria-hidden="true" /> : 'Ask'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="voice-context" className="form-label">Extra Context</label>
            <textarea
              id="voice-context"
              name="context"
              className="form-input"
              rows="4"
              placeholder={`Add weather, crop stage, symptoms, or treatment history${'\u2026'}`}
              value={context}
              onChange={(event) => setContext(event.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <SampleQuestionButtons onPickQuestion={handleSampleQuestion} />

        {query && !response && !loading && (
          <div className="voice-transcript animate-in" style={{ width: '100%', maxWidth: 680 }}>
            "{query}"
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div className="loading-spinner" style={{ margin: '0 auto 12px' }} aria-hidden="true" />
            <p className="text-muted">{`Trying the AI providers${'\u2026'}`}</p>
            <button type="button" className="btn btn-sm btn-ghost" onClick={stopAll} style={{ marginTop: 12 }}>
              Stop
            </button>
          </div>
        )}

        {response && (
          <ResponseCard
            response={response}
            providerMeta={providerMeta}
            isMuted={isMuted}
            isSpeaking={isSpeaking}
            onToggleMute={toggleMute}
            onStopSpeaking={stopSpeaking}
            onSpeak={speakResponse}
            query={query}
          />
        )}
      </div>
    </div>
  )
}
