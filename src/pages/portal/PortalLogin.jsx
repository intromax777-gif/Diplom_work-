import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usePortalAuth } from '../../context/PortalAuthContext'
import { Zap, Mail, Lock } from 'lucide-react'

export default function PortalLogin() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login } = usePortalAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await login(email, password)
    setLoading(false)
    if (error) {
      setError(error.message || "Email yoki parol noto'g'ri")
    } else {
      navigate('/portal/dashboard')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, background: '#f0fdf4', borderRadius: 16, marginBottom: 16
          }}>
            <div style={{
              background: '#16a34a', borderRadius: 12, padding: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Zap size={28} color="white" />
            </div>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Mijoz Portali</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 6 }}>
            Schyotlaringizni ko'ring va to'lang
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca',
              padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email manzil</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: 36 }}
                placeholder="email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Parol</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: 36 }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-success w-full"
            style={{ justifyContent: 'center', padding: '11px', marginTop: 8, fontSize: 15 }}
            disabled={loading}
          >
            {loading ? 'Kirish...' : 'Kirish'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 20 }}>
          Akkaunt yo'qmi?{' '}
          <Link to="/portal/register" style={{ color: '#16a34a', fontWeight: 600 }}>
            Ro'yxatdan o'tish
          </Link>
        </p>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
          <Link to="/login" style={{ color: '#94a3b8' }}>Administrator kirishi →</Link>
        </p>
      </div>
    </div>
  )
}
