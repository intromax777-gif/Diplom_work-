import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f1f5f9',
        color: '#64748b',
        fontSize: 14
      }}>
        Yuklanmoqda...
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // Mijoz portali foydalanuvchisi admin paneliga kira olmaydi
  if (user.user_metadata?.role === 'client') {
    return <Navigate to="/portal/dashboard" replace />
  }

  return children
}
