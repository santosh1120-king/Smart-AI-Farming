import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  clearSupabaseAuthResult,
  hasSupabaseGoogleConfig,
  readSupabaseAuthResult,
  startGoogleSignIn,
} from '../services/supabaseAuth'

export default function LoginPage() {
  const [googleLoading, setGoogleLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const googleConfigured = hasSupabaseGoogleConfig()

  useEffect(() => {
    const finishGoogleLogin = async () => {
      const { accessToken, error } = await readSupabaseAuthResult()

      if (!accessToken && !error) {
        return
      }

      clearSupabaseAuthResult()

      if (error) {
        toast.error(error)
        return
      }

      setGoogleLoading(true)

      try {
        const { data } = await api.post('/api/auth/google', { access_token: accessToken })
        login(data.user, data.access_token)
        toast.success(`Welcome, ${data.user.name}!`)
        navigate('/dashboard', { replace: true })
      } catch (errorObject) {
        toast.error(errorObject.response?.data?.detail || 'Google sign-in failed. Please try again.')
      } finally {
        setGoogleLoading(false)
      }
    }

    finishGoogleLogin()
  }, [login, navigate])

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true)
      await startGoogleSignIn()
    } catch (errorObject) {
      setGoogleLoading(false)
      toast.error(errorObject.message || 'Supabase Google auth is not configured.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-in">
        <div className="auth-logo">
          <div className="logo-icon">AI</div>
          <h1>AI Smart Farming</h1>
          <p>Use Google to sign in or create your account instantly.</p>
        </div>

        {googleConfigured ? (
          <button
            type="button"
            className="btn btn-primary btn-lg auth-google-btn"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            aria-label="Continue with Google"
          >
            {googleLoading ? (
              <><div className="loading-spinner sm" aria-hidden="true"></div> {`Connecting Google${'\u2026'}`}</>
            ) : (
              'Continue with Google'
            )}
          </button>
        ) : (
          <div className="auth-switch" aria-live="polite">
            Google sign-in is not configured yet. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
          </div>
        )}

        <div className="auth-switch">
          First time here? Use the same Google button and we&apos;ll create your account automatically.
        </div>
      </div>
    </div>
  )
}
