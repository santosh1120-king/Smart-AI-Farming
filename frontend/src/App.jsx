import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import CropAnalysisPage from './pages/CropAnalysisPage'
import CropHistoryPage from './pages/CropHistoryPage'
import WeatherPage from './pages/WeatherPage'
import SchemesPage from './pages/SchemesPage'
import VoiceAssistantPage from './pages/VoiceAssistantPage'
import Layout from './components/Layout'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">🌱</div>
        <div className="loading-spinner"></div>
        <p>Loading Smart Farming...</p>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/crop-analysis" element={<CropAnalysisPage />} />
        <Route path="/crop-history" element={<CropHistoryPage />} />
        <Route path="/weather" element={<WeatherPage />} />
        <Route path="/schemes" element={<SchemesPage />} />
        <Route path="/voice" element={<VoiceAssistantPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
