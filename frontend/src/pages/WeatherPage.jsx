import { useEffect, useState } from 'react'
import { AlertTriangle, CloudRainWind, LocateFixed, RefreshCw } from 'lucide-react'
import api from '../services/api'

export default function WeatherPage() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [locationDenied, setLocationDenied] = useState(false)

  const fetchWeather = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { data } = await api.get(`/api/weather?lat=${coords.latitude}&lon=${coords.longitude}`)
          setWeather(data)
        } catch (requestError) {
          setError(requestError.response?.data?.detail || 'Failed to fetch weather. Check your API key.')
        } finally {
          setLoading(false)
        }
      },
      () => {
        setLocationDenied(true)
        setLoading(false)
        setError('Location access was denied. Enable it in your browser settings and try again.')
      },
      { timeout: 10000 },
    )
  }

  useEffect(() => {
    fetchWeather()
  }, [])

  const farmingAdvice = weather
    ? [
        weather.humidity > 80 ? 'High humidity can increase fungal pressure. Avoid overhead watering and inspect dense foliage.' : null,
        weather.humidity < 30 ? 'Low humidity means moisture escapes quickly. Irrigate earlier in the day and consider mulching.' : null,
        weather.temperature > 30 ? `High temperature: ${weather.temperature}°C. Increase irrigation frequency. Monitor crops for heat stress.` : null,
        weather.temperature < 10 ? 'Cold-sensitive crops may need cover, mulch, or wind protection tonight.' : null,
        weather.wind_speed > 10 ? 'Strong wind is not ideal for spraying. Delay pesticide or foliar applications if possible.' : null,
        weather.risk.level === 'none' ? 'Conditions look steady for normal field work. This is a good window for inspections and planning.' : null,
      ].filter(Boolean)
    : []

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Weather Monitor</h1>
        <p>Use your live location to track current field conditions and turn weather into decisions you can actually use today.</p>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 0.9rem' }} aria-hidden="true" />
          <p className="text-muted">Detecting location and fetching weather conditions…</p>
        </div>
      )}

      {error && !loading && (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div className="empty-icon" style={{ marginBottom: '0.8rem' }}>
              <LocateFixed size={22} aria-hidden="true" />
            </div>
            <h3 style={{ margin: 0, fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', color: 'var(--ink-strong)' }}>
              {locationDenied ? 'Location Access Required' : 'Weather Unavailable'}
            </h3>
            <p style={{ color: 'var(--ink-soft)', marginBottom: '1rem' }}>{error}</p>
            <button className="btn btn-primary" onClick={fetchWeather}>Try Again</button>
          </div>
        </div>
      )}

      {weather && !loading && (
        <div className="animate-in">
          <div className="weather-card" style={{ marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem', marginBottom: '1rem' }}>
              <div>
                <div className="form-label" style={{ marginBottom: '0.2rem' }}>Current Location</div>
                <div style={{ color: 'var(--ink-soft)' }}>{weather.city}, {weather.country}</div>
              </div>
              <CloudRainWind size={22} color="var(--ink-strong)" aria-hidden="true" />
            </div>

            <div className="weather-main">
              <div>
                <div className="weather-temp">{weather.temperature}°C</div>
                <div className="weather-condition">{weather.condition}</div>
                <div className="weather-city">Feels like {weather.feels_like}°C</div>
              </div>
              <div className="weather-icon">
                <CloudRainWind size={82} strokeWidth={1.4} aria-hidden="true" />
              </div>
            </div>

            <div className="weather-stats">
              <div className="weather-stat">
                <div className="weather-stat-value">{weather.humidity}%</div>
                <div className="weather-stat-label">Humidity</div>
              </div>
              <div className="weather-stat">
                <div className="weather-stat-value">{weather.wind_speed} m/s</div>
                <div className="weather-stat-label">Wind</div>
              </div>
              <div className="weather-stat">
                <div className="weather-stat-value">{weather.visibility} km</div>
                <div className="weather-stat-label">Visibility</div>
              </div>
            </div>

          </div>

          <div className="card">
            <div className="form-label" style={{ marginBottom: '0.45rem' }}>Today&apos;s Field Advice</div>
            {farmingAdvice.map((advice, index) => (
              <div key={index} className="recommendation-item">
                <span>{advice}</span>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button className="btn btn-outline btn-sm" onClick={fetchWeather}>
              <RefreshCw size={14} aria-hidden="true" />
              Refresh Weather
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
