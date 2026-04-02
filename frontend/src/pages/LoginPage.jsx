import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  clearSupabaseAuthResult,
  hasSupabaseGoogleConfig,
  readSupabaseAuthResult,
  startGoogleSignIn,
} from '../services/supabaseAuth'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const { accessToken, error } = readSupabaseAuthResult()
    if (!accessToken && !error) return

    clearSupabaseAuthResult()

    if (error) {
      toast.error(error)
      return
    }

    const finishGoogleLogin = async () => {
      setGoogleLoading(true)
      try {
        const { data } = await api.post('/api/auth/google', { access_token: accessToken })
        login(data.user, data.access_token)
        toast.success(`Welcome, ${data.user.name}!`)
        navigate('/dashboard', { replace: true })
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Google sign-in failed. Please try again.')
      } finally {
        setGoogleLoading(false)
      }
    }

    finishGoogleLogin()
  }, [login, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', form)
      login(data.user, data.access_token)
      toast.success(`Welcome back, ${data.user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    try {
      setGoogleLoading(true)
      startGoogleSignIn()
    } catch (err) {
      setGoogleLoading(false)
      toast.error(err.message || 'Supabase Google auth is not configured.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-in">
        <div className="auth-logo">
          <div className="logo-icon">🌾</div>
          <h1>AI Smart Farming</h1>
          <p>Sign in to your farming dashboard</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="farmer@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading || googleLoading}>
            {loading ? (
              <><div className="loading-spinner sm"></div> Signing In...</>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {hasSupabaseGoogleConfig() && (
          <>
            <div className="auth-divider"><span>or</span></div>
            <button
              type="button"
              className="btn btn-outline btn-lg auth-google-btn"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <><div className="loading-spinner sm"></div> Connecting Google...</>
              ) : (
                'Continue with Google'
              )}
            </button>
          </>
        )}

        <div className="auth-switch">
          Don't have an account?
          <button onClick={() => navigate('/register')}>Create Account</button>
        </div>
      </div>
    </div>
  )
}
