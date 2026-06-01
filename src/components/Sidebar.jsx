import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Gauge, DollarSign,
  FileText, LogOut, Zap
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Mijozlar' },
  { to: '/meters', icon: Gauge, label: 'Hisoblagichlar' },
  { to: '/tariffs', icon: DollarSign, label: 'Tariflar' },
  { to: '/invoices', icon: FileText, label: 'Schyot-Fakturalar' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

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
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Kommunal Pay</div>
            <div style={{ color: '#64748b', fontSize: 11, marginTop: 1 }}>Billing System</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, padding: '4px 12px', marginBottom: 6 }}>
          Asosiy
        </div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ padding: '6px 12px', marginBottom: 6 }}>
          <div style={{ fontSize: 11, color: '#475569' }}>Administrator</div>
          <div style={{
            fontSize: 13, color: '#cbd5e1', fontWeight: 500,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {user?.email}
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
