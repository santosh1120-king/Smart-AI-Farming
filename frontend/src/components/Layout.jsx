import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Leaf, CloudSun, BookOpen, Mic, History, LogOut, Bell } from 'lucide-react'
import { useState, useEffect } from 'react'
import api from '../services/api'
import { requestNotificationPermission } from '../services/firebase'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/crop-analysis', label: 'Crop Analysis', icon: Leaf },
  { path: '/weather', label: 'Weather', icon: CloudSun },
  { path: '/schemes', label: 'Gov Schemes', icon: BookOpen },
  { path: '/voice', label: 'Voice Assistant', icon: Mic },
  { path: '/crop-history', label: 'Crop History', icon: History },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/api/notifications/unread-count')
        setUnreadCount(data.unread_count)
      } catch {}
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const syncFcmToken = async () => {
      if (!user) return

      try {
        const fcmToken = await requestNotificationPermission()
        if (!fcmToken) return

        await api.put('/api/auth/fcm-token', { fcm_token: fcmToken })
      } catch (error) {
        console.warn('FCM token sync skipped:', error?.message || error)
      }
    }

    syncFcmToken()
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const avatarLetter = user?.name?.[0]?.toUpperCase() || 'F'

  return (
    <div className="app-layout">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🌱</div>
          <div className="sidebar-logo-text">
            Smart Farming
            <span>AI Assistant</span>
          </div>
        </div>

        <div className="sidebar-nav">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon />
              <span>{label}</span>
              {path === '/dashboard' && unreadCount > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: 'var(--red-500)',
                  color: 'white',
                  borderRadius: '100px',
                  padding: '1px 7px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}>
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{avatarLetter}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">🌾 Farmer</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Mobile top bar */}
        <div style={{ display: 'none' }} className="mobile-topbar">
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: 'white', fontSize: 24, cursor: 'pointer' }}
          >
            ☰
          </button>
          <span style={{ fontWeight: 700 }}>🌱 Smart Farming</span>
          <Bell size={20} />
        </div>

        <style>{`
          @media (max-width: 768px) {
            .mobile-topbar { 
              display: flex !important; 
              align-items: center; 
              justify-content: space-between;
              padding: 12px 4px 20px;
            }
          }
        `}</style>

        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        {NAV_ITEMS.slice(0, 5).map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon />
            <span>{label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
