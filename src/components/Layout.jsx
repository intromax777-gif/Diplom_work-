import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, Zap } from 'lucide-react'
import Sidebar from './Sidebar'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <div className="mobile-topbar">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} color="white" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: '#2563eb', borderRadius: 6, padding: '5px', display: 'flex' }}>
              <Zap size={14} color="white" />
            </div>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>KommunalPay</span>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
