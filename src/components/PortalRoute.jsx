import { Navigate } from 'react-router-dom'
import { usePortalAuth } from '../context/PortalAuthContext'

export default function PortalRoute({ children }) {
  const { user, client, loading } = usePortalAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#f1f5f9', color: '#64748b', fontSize: 14
      }}>
        Yuklanmoqda...
      </div>
    )
  }

  if (!user || !client) return <Navigate to="/portal/login" replace />

  return children
}
