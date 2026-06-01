import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, Mail, Lock } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError("Email yoki parol noto'g'ri")
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, background: '#eff6ff', borderRadius: 16, marginBottom: 16
          }}>
            <div style={{
              background: '#2563eb', borderRadius: 12, padding: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Zap size={28} color="white" />
            </div>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>KommunalPay</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 6 }}>
            Kommunal xizmatlar billing tizimi
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
              <Mail size={16} style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', color: '#94a3b8'
              }} />
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: 36 }}
                placeholder="admin@kommunal.uz"
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
              <Lock size={16} style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', color: '#94a3b8'
              }} />
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
            className="btn btn-primary w-full"
            style={{ justifyContent: 'center', padding: '11px', marginTop: 8, fontSize: 15 }}
            disabled={loading}
          >
            {loading ? 'Kirish...' : 'Tizimga kirish'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 24 }}>
          Faqat avtorizatsiyalangan foydalanuvchilar uchun
        </p>
      </div>
    </div>
  )
}
