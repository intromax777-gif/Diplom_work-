import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Gauge, DollarSign,
  FileText, LogOut, Zap
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Notifications from './Notifications'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: 0 },
  { to: '/clients', icon: Users, label: 'Mijozlar', badge: 0 },
  { to: '/meters', icon: Gauge, label: 'Hisoblagichlar', badge: 0 },
  { to: '/tariffs', icon: DollarSign, label: 'Tariflar', badge: 0 },
  { to: '/invoices', icon: FileText, label: 'Schyot-Fakturalar', badge: 0 },
]

export default function Sidebar({ isOpen, onClose }) {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const initial = (user?.email || 'A').charAt(0).toUpperCase()

  return (
    <div className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: '#2563eb', borderRadius: 8, padding: '7px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Zap size={18} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Kommunal Pay</span>
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#94a3b8', background: '#1e293b',
                padding: '1px 6px', borderRadius: 6, letterSpacing: 0.5
              }}>
                v1.0
              </span>
            </div>
            <div style={{ color: '#475569', fontSize: 11, marginTop: 1 }}>Billing System</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Asosiy</div>
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Icon size={17} />
            <span style={{ flex: 1 }}>{label}</span>
            {badge > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700, background: '#dc2626', color: 'white',
                minWidth: 18, height: 18, borderRadius: 9, display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: '0 5px'
              }}>
                {badge}
              </span>
            )}
          </NavLink>
        ))}
        <Notifications onNavigate={onClose} />
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0
          }}>
            {initial}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, color: '#475569' }}>Administrator</div>
            <div style={{
              fontSize: 12.5, color: '#cbd5e1', fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {user?.email}
            </div>
          </div>
        </div>
        <button className="nav-item" onClick={handleSignOut}>
          <LogOut size={17} />
          Chiqish
        </button>
      </div>
    </div>
  )
}
