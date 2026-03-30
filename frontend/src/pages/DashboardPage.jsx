import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Bell } from 'lucide-react'

const WEATHER_ICONS = {
  '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '⛅',
  '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
  '50d': '🌫️', '50n': '🌫️',
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [weather, setWeather] = useState(null)
  const [latestCrop, setLatestCrop] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [loadingWeather, setLoadingWeather] = useState(false)

  useEffect(() => {
    fetchLatestCrop()
    fetchNotifications()
    if (navigator.geolocation) {
      setLoadingWeather(true)
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          try {
            const { data } = await api.get(`/api/weather?lat=${coords.latitude}&lon=${coords.longitude}`)
            setWeather(data)
          } catch {}
          setLoadingWeather(false)
        },
        () => setLoadingWeather(false)
      )
    }
  }, [])

  const fetchLatestCrop = async () => {
    try {
      const { data } = await api.get('/api/crop/history?limit=1')
      if (data.history.length > 0) setLatestCrop(data.history[0])
    } catch {}
  }

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/api/notifications?limit=5')
      setNotifications(data.notifications.filter(n => !n.read))
    } catch {}
  }

  const healthColor = (status) => {
    if (status === 'Healthy') return 'var(--green-400)'
    if (status === 'Risk') return 'var(--yellow-400)'
    return 'var(--red-400)'
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="page-header">
        <h1>{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
        <p>Here's your farm overview for today</p>
      </div>

      {/* Notifications Banner */}
      {notifications.length > 0 && (
        <div className="risk-alert high animate-in animate-delay-1" style={{ marginBottom: 20 }}>
          <Bell size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>{notifications[0].title}</strong>
            <div style={{ fontSize: 13, marginTop: 2 }}>{notifications[0].body}</div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="dashboard-grid animate-in animate-delay-1">
        {/* Weather Summary */}
        <div className="weather-card">
          <div style={{ fontSize: 13, color: '#93c5fd', fontWeight: 600, marginBottom: 8 }}>
            🌍 {weather?.city ? `${weather.city}, ${weather.country}` : 'Your Location'}
          </div>
          {loadingWeather ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
              <div className="loading-spinner" />
              <span style={{ color: 'var(--color-text-muted)' }}>Fetching weather...</span>
            </div>
          ) : weather ? (
            <>
              <div className="weather-main">
                <div>
                  <div className="weather-temp">{weather.temperature}°</div>
                  <div className="weather-condition">{weather.condition}</div>
                  <div className="weather-city">Feels like {weather.feels_like}°C</div>
                </div>
                <div className="weather-icon">{WEATHER_ICONS[weather.condition_icon] || '🌤️'}</div>
              </div>
              <div className="weather-stats">
                <div className="weather-stat">
                  <div className="weather-stat-value">💧 {weather.humidity}%</div>
                  <div className="weather-stat-label">Humidity</div>
                </div>
                <div className="weather-stat">
                  <div className="weather-stat-value">💨 {weather.wind_speed}</div>
                  <div className="weather-stat-label">Wind m/s</div>
                </div>
                <div className="weather-stat">
                  <div className="weather-stat-value">👁️ {weather.visibility}</div>
                  <div className="weather-stat-label">Vis. km</div>
                </div>
              </div>
              {weather.risk.level !== 'none' && (
                <div className={`risk-alert ${weather.risk.level}`}>
                  <span className="risk-alert-icon">⚠️</span>
                  <div>
                    <strong>{weather.risk.message}</strong>
                    <div style={{ marginTop: 4, opacity: 0.85 }}>{weather.risk.advice}</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ color: 'var(--color-text-muted)', padding: '8px 0' }}>
              <Link to="/weather" style={{ color: '#93c5fd' }}>Enable location</Link> to see weather
            </div>
          )}
        </div>

        {/* Latest Crop */}
        <div className="card">
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 16 }}>🌾 Latest Crop Analysis</div>
          {latestCrop ? (
            <>
              {latestCrop.image_url && (
                <img src={latestCrop.image_url} alt="crop" className="crop-preview" style={{ maxHeight: 160, marginBottom: 16 }} />
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{latestCrop.analysis.crop_type}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{latestCrop.analysis.growth_stage}</div>
                </div>
                <span className={`badge badge-${latestCrop.analysis.health_status.toLowerCase()}`}>
                  {latestCrop.analysis.health_status}
                </span>
              </div>
              <div className="health-bar-track">
                <div className="health-bar-fill" style={{
                  width: `${latestCrop.analysis.growth_percentage}%`,
                  background: healthColor(latestCrop.analysis.health_status)
                }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
                Growth: {latestCrop.analysis.growth_percentage}%
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: 24 }}>
              <div className="empty-icon">🌱</div>
              <p>No crops analyzed yet</p>
              <Link to="/crop-analysis">
                <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Analyze Now</button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card animate-in animate-delay-2">
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>⚡ Quick Actions</div>
        <div className="quick-actions-grid">
          <Link to="/crop-analysis" className="quick-action-btn">
            <div className="action-icon">🔬</div>
            <span>Analyze Crop</span>
          </Link>
          <Link to="/weather" className="quick-action-btn">
            <div className="action-icon">🌤️</div>
            <span>Check Weather</span>
          </Link>
          <Link to="/schemes" className="quick-action-btn">
            <div className="action-icon">📜</div>
            <span>Gov Schemes</span>
          </Link>
          <Link to="/voice" className="quick-action-btn">
            <div className="action-icon">🎙️</div>
            <span>Ask AI</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
