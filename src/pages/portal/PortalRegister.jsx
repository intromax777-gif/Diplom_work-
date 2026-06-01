import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usePortalAuth } from '../../context/PortalAuthContext'
import { Zap, CreditCard, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function PortalRegister() {
  const [accountNumber, setAccountNumber] = useState('')
  const [email, setEmail]                 = useState('')
  const [password, setPassword]           = useState('')
  const [confirm, setConfirm]             = useState('')
  const [showPass, setShowPass]           = useState(false)
  const [error, setError]                 = useState('')
  const [loading, setLoading]             = useState(false)
  const { register } = usePortalAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak")
      return
    }
    if (password !== confirm) {
      setError("Parollar mos kelmadi")
      return
    }

    setLoading(true)
    const { error } = await register(accountNumber, email, password)
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      navigate('/portal/dashboard')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
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
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Ro'yxatdan o'tish</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 6 }}>
            Hisob raqamingizni kiriting va parol o'rnating
          </p>
        </div>

        <div style={{
          background: '#f0fdf4', border: '1px solid #86efac',
          borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: '#166534'
        }}>
          💡 Hisob raqamingizni bilmasangiz, administrator bilan bog'laning
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
            <label className="form-label">Hisob raqami *</label>
            <div style={{ position: 'relative' }}>
              <CreditCard size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                className="form-control"
                style={{ paddingLeft: 36, fontFamily: 'monospace', fontWeight: 600 }}
                placeholder="KP-0001"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email manzil *</label>
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
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Parol *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-control"
                  style={{ paddingLeft: 36, paddingRight: 36 }}
                  placeholder="••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Parolni takrorlang *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-control"
                  style={{ paddingLeft: 36 }}
                  placeholder="••••••"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-success w-full"
            style={{ justifyContent: 'center', padding: '11px', marginTop: 4, fontSize: 15 }}
            disabled={loading}
          >
            {loading ? "Ro'yxatdan o'tilmoqda..." : "Ro'yxatdan o'tish"}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 20 }}>
          Akkaunt bormi?{' '}
          <Link to="/portal/login" style={{ color: '#16a34a', fontWeight: 600 }}>
            Kirish
          </Link>
        </p>
      </div>
    </div>
  )
}
