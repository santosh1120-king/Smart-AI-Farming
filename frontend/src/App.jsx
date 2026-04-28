import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import CropAnalysisPage from './pages/CropAnalysisPage'
import CropHistoryPage from './pages/CropHistoryPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SchemesPage from './pages/SchemesPage'
import VoiceAssistantPage from './pages/VoiceAssistantPage'
import WeatherPage from './pages/WeatherPage'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">AF</div>
        <div className="loading-spinner" aria-hidden="true"></div>
        <p>Loading Smart Farming…</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/crop-analysis" element={<CropAnalysisPage />} />
        <Route path="/crop-history" element={<CropHistoryPage />} />
        <Route path="/weather" element={<WeatherPage />} />
        <Route path="/schemes" element={<SchemesPage />} />
        <Route path="/voice" element={<VoiceAssistantPage />} />
      </Route>

      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
