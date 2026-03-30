import { useState, useEffect } from 'react'
import api from '../services/api'

const WEATHER_ICONS = {
  '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '⛅',
  '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
  '50d': '🌫️', '50n': '🌫️',
}

export default function WeatherPage() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [locationDenied, setLocationDenied] = useState(false)

  const fetchWeather = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported in your browser')
      return
    }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { data } = await api.get(`/api/weather?lat=${coords.latitude}&lon=${coords.longitude}`)
          setWeather(data)
        } catch (err) {
          setError(err.response?.data?.detail || 'Failed to fetch weather. Check your API key.')
        } finally {
          setLoading(false)
        }
      },
      () => {
        setLocationDenied(true)
        setLoading(false)
        setError('Location access denied. Please enable location in browser settings.')
      },
      { timeout: 10000 }
    )
  }

  useEffect(() => { fetchWeather() }, [])

  const riskColors = { none: null, low: 'low', medium: 'medium', high: 'high' }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>🌤️ Weather Monitor</h1>
        <p>Real-time weather conditions and risk alerts for your farm</p>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>Detecting your location and fetching weather...</p>
        </div>
      )}

      {error && (
        <div className="card">
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📍</div>
            <h3 style={{ marginBottom: 8 }}>{locationDenied ? 'Location Access Needed' : 'Weather Unavailable'}</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 20, lineHeight: 1.6 }}>{error}</p>
            <button className="btn btn-primary" onClick={fetchWeather}>Try Again</button>
          </div>
        </div>
      )}

      {weather && !loading && (
        <div className="animate-in">
          {/* Main Weather Card */}
          <div className="weather-card" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: '#93c5fd', fontWeight: 600, marginBottom: 16 }}>
              📍 {weather.city}, {weather.country}
            </div>
            <div className="weather-main">
              <div>
                <div className="weather-temp">{weather.temperature}°C</div>
                <div className="weather-condition" style={{ fontSize: 20 }}>{weather.condition}</div>
                <div className="weather-city" style={{ marginTop: 4 }}>Feels like {weather.feels_like}°C</div>
              </div>
              <div className="weather-icon" style={{ fontSize: 80 }}>
                {WEATHER_ICONS[weather.condition_icon] || '🌤️'}
              </div>
            </div>

            <div className="weather-stats">
              <div className="weather-stat">
                <div className="weather-stat-value" style={{ fontSize: 22 }}>💧</div>
                <div className="weather-stat-value">{weather.humidity}%</div>
                <div className="weather-stat-label">Humidity</div>
              </div>
              <div className="weather-stat">
                <div className="weather-stat-value" style={{ fontSize: 22 }}>💨</div>
                <div className="weather-stat-value">{weather.wind_speed} m/s</div>
                <div className="weather-stat-label">Wind</div>
              </div>
              <div className="weather-stat">
                <div className="weather-stat-value" style={{ fontSize: 22 }}>👁️</div>
                <div className="weather-stat-value">{weather.visibility} km</div>
                <div className="weather-stat-label">Visibility</div>
              </div>
            </div>

            {weather.risk.level !== 'none' && (
              <div className={`risk-alert ${weather.risk.level}`} style={{ marginTop: 20 }}>
                <span className="risk-alert-icon">
                  {weather.risk.level === 'high' ? '🚨' : weather.risk.level === 'medium' ? '⚠️' : 'ℹ️'}
                </span>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{weather.risk.message}</div>
                  <div style={{ opacity: 0.9 }}>{weather.risk.advice}</div>
                </div>
              </div>
            )}
          </div>

          {/* Farming Advice Based on Weather */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>🌾 Farming Advice for Today</div>
            {[
              weather.humidity > 80 ? '💧 High humidity may promote fungal diseases. Avoid overhead irrigation.' : null,
              weather.humidity < 30 ? '🌵 Low humidity — water crops frequently and mulch soil to retain moisture.' : null,
              weather.temperature > 35 ? '🔥 Heat stress warning! Water crops in early morning or evening only.' : null,
              weather.temperature < 10 ? '❄️ Cold conditions — protect sensitive seedlings with covers or mulch.' : null,
              weather.wind_speed > 10 ? '💨 High winds — avoid spraying pesticides. Check crop supports.' : null,
              weather.risk.level === 'none' ? '✅ Great farming weather! Ideal conditions for field work.' : null,
            ].filter(Boolean).map((advice, i) => (
              <div key={i} className="recommendation-item">
                <span>{advice}</span>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button className="btn btn-outline btn-sm" onClick={fetchWeather}>
              🔄 Refresh Weather
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
