import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import {
  Bell,
  BookOpen,
  CloudRain,
  CloudSun,
  Droplets,
  History,
  KeyRound,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Mic,
  ThermometerSun,
  Wind,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../services/api'
import { requestNotificationPermission } from '../services/firebase'
import APIKeySettingsModal from './APIKeySettingsModal'
import { hasAnyAIKey, loadAIKeys } from '../services/aiKeys'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { path: '/crop-analysis', label: 'Crop Analysis', shortLabel: 'Crop', icon: Leaf },
  { path: '/weather', label: 'Weather', shortLabel: 'Weather', icon: CloudSun },
  { path: '/schemes', label: 'Gov Schemes', shortLabel: 'Schemes', icon: BookOpen },
  { path: '/voice', label: 'Voice Assistant', shortLabel: 'Voice', icon: Mic },
  { path: '/crop-history', label: 'Crop History', shortLabel: 'History', icon: History },
]

const SECTION_TITLES = {
  '/dashboard': 'Field Desk',
  '/crop-analysis': 'Diagnostics',
  '/weather': 'Weather Ledger',
  '/schemes': 'Scheme Index',
  '/voice': 'Advisor Console',
  '/crop-history': 'Season Archive',
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false)
  const [hasKeys, setHasKeys] = useState(hasAnyAIKey(loadAIKeys()))
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifList, setNotifList] = useState([])

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/api/notifications/unread-count')
        setUnreadCount(data.unread_count)
      } catch (error) {
        console.warn('Unread notification request failed:', error?.message || error)
      }
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!notifOpen) return
    const fetchNotifs = async () => {
      try {
        const { data } = await api.get('/api/notifications?limit=8')
        setNotifList(data.notifications)
      } catch (error) {
        console.warn('Notification list request failed:', error?.message || error)
      }
    }
    fetchNotifs()
  }, [notifOpen])

  const handleMarkAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all')
      setUnreadCount(0)
      setNotifList((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (error) {
      console.warn('Mark all read failed:', error?.message || error)
    }
  }

  const getNotifIcon = (type) => {
    if (type?.includes('rain')) return <CloudRain size={14} />
    if (type?.includes('storm')) return <Wind size={14} />
    if (type?.includes('disease')) return <Droplets size={14} />
    if (type?.includes('heatwave')) return <ThermometerSun size={14} />
    if (type?.includes('frost')) return <CloudSun size={14} />
    if (type?.includes('crop')) return <Leaf size={14} />
    return <Bell size={14} />
  }

  const getNotifColor = (type) => {
    if (type?.includes('rain') || type?.includes('storm')) return 'var(--blue-soft, #5b8fc9)'
    if (type?.includes('disease')) return 'var(--moss)'
    if (type?.includes('heatwave')) return 'var(--gold)'
    if (type?.includes('frost')) return 'var(--ink-soft)'
    return 'var(--ink-soft)'
  }

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
  const sectionTitle = SECTION_TITLES[location.pathname] || 'Smart Farming'

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(12, 18, 13, 0.45)', zIndex: 998 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">AI</div>
          <div className="sidebar-logo-text">
            Smart Farming
            <span>AI Assistant</span>
          </div>
        </div>

        <div className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon />
              <span>{item.label}</span>
              {item.path === '/dashboard' && unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: 'auto',
                    background: 'rgba(180, 84, 66, 0.95)',
                    color: '#fffdfa',
                    borderRadius: 999,
                    padding: '0.08rem 0.5rem',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                  }}
                >
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
              <div className="sidebar-user-name">{user?.name || 'Farmer'}</div>
              <div className="sidebar-user-role">Farm operator</div>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <main id="main-content" className="main-content">
        <div
          className="mobile-topbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.8rem',
            marginBottom: '1.2rem',
          }}
        >
          <button
            className="icon-btn menu-toggle-btn"
            onClick={() => {
              if (window.innerWidth <= 980) {
                setSidebarOpen((prev) => !prev)
              } else {
                setSidebarCollapsed((prev) => !prev)
              }
            }}
            aria-label={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
            type="button"
          >
            {sidebarCollapsed ? <Menu size={18} /> : <X size={18} />}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                color: 'var(--ink-soft)',
                fontSize: '0.72rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '0.15rem',
              }}
            >
              {sectionTitle}
            </div>
            <div style={{ fontWeight: 700, color: 'var(--ink-strong)' }}>{user?.name || 'Farmer'}</div>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              className="icon-btn"
              style={{ padding: '0.35rem', position: 'relative' }}
              onClick={() => setNotifOpen((prev) => !prev)}
              aria-label='Notifications'
              type='button'
            >
              <Bell size={18} color="var(--ink-strong)" aria-hidden="true" />
              {unreadCount > 0 && <span className="notif-dot" />}
            </button>

            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-header">
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      style={{
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        background: 'rgba(255, 253, 250, 0.15)',
                        border: '1px solid rgba(255, 253, 250, 0.3)',
                        borderRadius: '6px',
                        color: '#fffdfa',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={handleMarkAllRead}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 253, 250, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 253, 250, 0.15)';
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                {notifList.length === 0 ? (
                  <div className="notif-dropdown-empty">No notifications yet</div>
                ) : (
                  notifList.map((n) => (
                    <div key={n.id} className={`notif-dropdown-item ${n.read ? 'read' : ''}`}>
                      <div className="notif-dropdown-icon" style={{ color: getNotifColor(n.type) }}>
                        {getNotifIcon(n.type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.3, color: 'var(--ink-strong)' }}>{n.title}</div>
                        <div style={{ color: 'var(--ink-soft)', fontSize: '0.75rem', lineHeight: 1.4, marginTop: '0.15rem' }}>{n.body}</div>
                      </div>
                      {!n.read && <span className="notif-unread-dot" />}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <Outlet />
      </main>

      <nav className="mobile-nav">
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <item.icon />
            <span>{item.shortLabel}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  )
}
