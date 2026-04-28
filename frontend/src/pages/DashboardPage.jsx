import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import api from '../services/api'
import {
  Bell,
  CloudRainWind,
  Droplets,
  Eye,
  Leaf,
  MessageSquareQuote,
  ScanSearch,
  ScrollText,
  Sprout,
  Wind,
} from 'lucide-react'

function NotificationBanner({ notifications }) {
  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="risk-alert high animate-in animate-delay-1" style={{ marginBottom: '1.2rem' }}>
      <Bell size={18} style={{ flexShrink: 0 }} aria-hidden="true" />
      <div>
        <strong>{notifications[0].title}</strong>
        <div style={{ marginTop: '0.2rem' }}>{notifications[0].body}</div>
      </div>
    </div>
  )
}

function WeatherLoadingState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', paddingBlock: '1rem' }}>
      <div className="loading-spinner" aria-hidden="true" />
      <span className="text-muted">Collecting live weather details{'\u2026'}</span>
    </div>
  )
}

function WeatherStats({ weather }) {
  return (
    <div className="weather-stats">
      <div className="weather-stat">
        <Droplets size={18} className="weather-stat-icon" aria-hidden="true" />
        <div className="weather-stat-value">{weather.humidity}%</div>
        <div className="weather-stat-label">Humidity</div>
      </div>
      <div className="weather-stat">
        <Wind size={18} className="weather-stat-icon" aria-hidden="true" />
        <div className="weather-stat-value">{weather.wind_speed}</div>
        <div className="weather-stat-label">Wind m/s</div>
      </div>
      <div className="weather-stat">
        <Eye size={18} className="weather-stat-icon" aria-hidden="true" />
        <div className="weather-stat-value">{weather.visibility}</div>
        <div className="weather-stat-label">Visibility km</div>
      </div>
    </div>
  )
}

function WeatherCard({ weather, loadingWeather }) {
  return (
    <div className="weather-card">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.8rem',
          marginBottom: '0.5rem',
        }}
      >
        <div>
          <div className="form-label" style={{ marginBottom: '0.2rem' }}>Local Weather</div>
          <div style={{ color: 'var(--ink-soft)' }}>
            {weather?.city ? `${weather.city}, ${weather.country}` : 'Current field location'}
          </div>
        </div>
        <CloudRainWind size={22} color="var(--ink-strong)" className="weather-icon-hover" aria-hidden="true" />
      </div>

      {loadingWeather ? (
        <WeatherLoadingState />
      ) : weather ? (
        <>
          <div className="weather-main">
            <div>
              <div className="weather-temp">{weather.temperature}°</div>
              <div className="weather-condition">{weather.condition}</div>
              <div className="weather-city">Feels like {weather.feels_like}°C</div>
            </div>
            <div className="weather-icon">
              <CloudRainWind size={58} strokeWidth={1.5} className="weather-icon-hover" aria-hidden="true" />
            </div>
          </div>

          <WeatherStats weather={weather} />

          {weather.risk.level !== 'none' && (
            <div className={`risk-alert ${weather.risk.level}`}>
              <Bell size={18} className="risk-alert-icon" aria-hidden="true" />
              <div>
                <strong>{weather.risk.message}</strong>
                <div style={{ marginTop: '0.2rem' }}>{weather.risk.advice}</div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ color: 'var(--ink-soft)' }}>
          <Link to="/weather" style={{ color: 'var(--gold)' }}>Enable your location</Link> to pull the weather ledger for this area.
        </div>
      )}
    </div>
  )
}

function LatestCropCard({ latestCrop, healthBadge }) {
  if (!latestCrop) {
    return (
      <div className="card">
        <div className="form-label" style={{ marginBottom: '0.9rem' }}>Latest Diagnosis</div>
        <div className="empty-state" style={{ padding: '1.5rem 0.4rem' }}>
          <div className="empty-icon"><Leaf size={22} aria-hidden="true" /></div>
          <h3>No crop records yet</h3>
          <p>Run your first crop scan to start building a health history for the season.</p>
          <Link to="/crop-analysis">
            <button className="btn btn-primary btn-sm" style={{ marginTop: '0.9rem' }}>Start Analysis</button>
          </Link>
        </div>
      </div>
    )
  }

  const growthBarBackground =
    healthBadge === 'healthy'
      ? 'linear-gradient(90deg, #8ea173, #708456)'
      : healthBadge === 'risk'
        ? 'linear-gradient(90deg, #d2b17a, #b27a35)'
        : 'linear-gradient(90deg, #cf7a69, #b45442)'

  return (
    <div className="card">
      <div className="form-label" style={{ marginBottom: '0.9rem' }}>Latest Diagnosis</div>

      {latestCrop.image_url && (
        <img
          src={latestCrop.image_url}
          alt="Latest crop scan"
          className="crop-preview"
          width="640"
          height="320"
          style={{ maxHeight: '12rem', marginBottom: '1rem' }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.8rem' }}>
        <div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', lineHeight: 0.92, color: 'var(--ink-strong)' }}>
            {latestCrop.analysis.crop_type}
          </div>
          <div style={{ color: 'var(--ink-soft)' }}>{latestCrop.analysis.growth_stage}</div>
        </div>
        <span className={`badge badge-${healthBadge}`}>{latestCrop.analysis.health_status}</span>
      </div>

      <div className="health-bar-track">
        <div
          className="health-bar-fill"
          style={{
            width: `${latestCrop.analysis.growth_percentage}%`,
            background: growthBarBackground,
          }}
        />
      </div>

      <div style={{ marginTop: '0.7rem', color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
        Growth indicator: {latestCrop.analysis.growth_percentage}% complete
      </div>

      <div className="recommendation-item" style={{ marginTop: '1rem', paddingBottom: 0, borderBottom: 'none' }}>
        <Sprout size={18} color="var(--moss)" aria-hidden="true" />
        <span>{latestCrop.analysis.recommendations?.[0] || 'No recommendation captured yet.'}</span>
      </div>
    </div>
  )
}

function QuickActionsCard() {
  return (
    <div className="card animate-in animate-delay-2" style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div className="form-label" style={{ marginBottom: '0.2rem' }}>Action Board</div>
          <div style={{ color: 'var(--ink-soft)' }}>Jump to the tasks farmers usually need most during the day.</div>
        </div>
      </div>

      <div className="quick-actions-grid">
        <Link to="/crop-analysis" className="quick-action-btn">
          <div className="action-icon"><ScanSearch size={22} aria-hidden="true" /></div>
          <strong>Analyze Crop</strong>
          <span>Upload a fresh photo and get disease and growth guidance.</span>
        </Link>

        <Link to="/weather" className="quick-action-btn">
          <div className="action-icon"><CloudRainWind size={22} aria-hidden="true" /></div>
          <strong>Check Weather</strong>
          <span>Review local conditions before irrigation, spraying, or field work.</span>
        </Link>

        <Link to="/schemes" className="quick-action-btn">
          <div className="action-icon"><ScrollText size={22} aria-hidden="true" /></div>
          <strong>View Schemes</strong>
          <span>Filter support programs by crop and state in one place.</span>
        </Link>

        <Link to="/voice" className="quick-action-btn">
          <div className="action-icon"><MessageSquareQuote size={22} aria-hidden="true" /></div>
          <strong>Ask the Advisor</strong>
          <span>Use voice or text for instant field-side recommendations.</span>
        </Link>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [weather, setWeather] = useState(null)
  const [latestCrop, setLatestCrop] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [loadingWeather, setLoadingWeather] = useState(false)

  useEffect(() => {
    async function loadPageData() {
      await fetchLatestCrop()
      await fetchNotifications()

      if (!navigator.geolocation) {
        return
      }

      setLoadingWeather(true)
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          try {
            const { data } = await api.get(`/api/weather?lat=${coords.latitude}&lon=${coords.longitude}`)
            setWeather(data)
          } catch (error) {
            console.warn('Weather request failed:', error?.message || error)
          } finally {
            setLoadingWeather(false)
          }
        },
        () => setLoadingWeather(false),
      )
    }

    loadPageData()
  }, [])

  async function fetchLatestCrop() {
    try {
      const { data } = await api.get('/api/crop/history?limit=1')
      if (data.history.length > 0) {
        setLatestCrop(data.history[0])
      }
    } catch (error) {
      console.warn('Latest crop request failed:', error?.message || error)
    }
  }

  async function fetchNotifications() {
    try {
      const { data } = await api.get('/api/notifications?limit=5')
      const unreadNotifications = data.notifications.filter((notification) => !notification.read)
      setNotifications(unreadNotifications)
    } catch (error) {
      console.warn('Notification request failed:', error?.message || error)
    }
  }

  function greeting() {
    const hour = new Date().getHours()

    if (hour < 12) {
      return 'Good morning'
    }

    if (hour < 17) {
      return 'Good afternoon'
    }

    return 'Good evening'
  }

  const firstName = user?.name?.split(' ')[0] || 'Farmer'
  const healthBadge = latestCrop?.analysis?.health_status?.toLowerCase() || 'none'

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>{greeting()}, {firstName}</h1>
        <p>Your field desk brings together crop health, local weather, alerts, and next actions in one practical daily view.</p>
      </div>

      <NotificationBanner notifications={notifications} />

      <div className="dashboard-grid animate-in animate-delay-1">
        <WeatherCard weather={weather} loadingWeather={loadingWeather} />
        <LatestCropCard latestCrop={latestCrop} healthBadge={healthBadge} />
      </div>

      <QuickActionsCard />
    </div>
  )
}
