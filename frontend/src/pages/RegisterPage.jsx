import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { hasSupabaseGoogleConfig, startGoogleSignIn } from '../services/supabaseAuth'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
]

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', state: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/register', form)
      login(data.user, data.access_token)
      toast.success(`Welcome, ${data.user.name}! Your account is ready.`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = () => {
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
          <div className="logo-icon">🌱</div>
          <h1>Create Account</h1>
          <p>Join thousands of smart farmers</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Your full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
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
            <label className="form-label">Phone (Optional)</label>
            <input
              type="tel"
              className="form-input"
              placeholder="+91 9999999999"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Your State</label>
            <select
              className="form-input"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading || googleLoading}>
            {loading ? (
              <><div className="loading-spinner sm"></div> Creating Account...</>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {hasSupabaseGoogleConfig() && (
          <>
            <div className="auth-divider"><span>or</span></div>
            <button
              type="button"
              className="btn btn-outline btn-lg auth-google-btn"
              onClick={handleGoogleSignup}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <><div className="loading-spinner sm"></div> Connecting Google...</>
              ) : (
                'Sign up with Google'
              )}
            </button>
          </>
        )}

        <div className="auth-switch">
          Already have an account?
          <button onClick={() => navigate('/login')}>Sign In</button>
        </div>
      </div>
    </div>
  )
}
