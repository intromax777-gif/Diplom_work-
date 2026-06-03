import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usePortalAuth } from '../../context/PortalAuthContext'
import { supabase } from '../../lib/supabase'
import { Zap, Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react'

export default function PortalLogin() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login } = usePortalAuth()
  const navigate = useNavigate()

  // Parolni tiklash holati
  const [forgotMode, setForgotMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent]   = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')

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

  const handleReset = async (e) => {
    e.preventDefault()
    setResetError('')
    if (!resetEmail.trim()) {
      setResetError("Email manzilini kiriting")
      return
    }
    setResetLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: window.location.origin + '/portal/reset-password'
    })
    setResetLoading(false)
    if (error) {
      setResetError(error.message || "Havola yuborishda xatolik")
    } else {
      setResetSent(true)
    }
  }

  function backToLogin() {
    setForgotMode(false)
    setResetSent(false)
    setResetError('')
    setResetEmail('')
  }

  // ── Parolni tiklash ko'rinishi ──
  if (forgotMode) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 64, height: 64, background: '#f0fdf4', borderRadius: 16, marginBottom: 16
            }}>
              <div style={{
                background: '#16a34a', borderRadius: 12, padding: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Lock size={28} color="white" />
              </div>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Parolni tiklash</h1>
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 6 }}>
              Email manzilingizga tiklash havolasi yuboriladi
            </p>
          </div>

          {resetSent ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: '#dcfce7',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
              }}>
                <CheckCircle size={30} color="#16a34a" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Email yuborildi!</h3>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
                <strong>{resetEmail}</strong> manziliga tiklash havolasi yuborildi.
                Pochtangizni (va spam papkasini) tekshiring.
              </p>
              <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={backToLogin}>
                <ArrowLeft size={15} /> Kirishga qaytish
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset}>
              {resetError && (
                <div style={{
                  background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca',
                  padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16
                }}>
                  {resetError}
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
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-success w-full"
                style={{ justifyContent: 'center', padding: '11px', marginTop: 8, fontSize: 15 }}
                disabled={resetLoading}
              >
                {resetLoading ? 'Yuborilmoqda...' : 'Tiklash havolasini yuborish'}
              </button>

              <button
                type="button"
                className="btn btn-ghost w-full"
                style={{ justifyContent: 'center', marginTop: 12 }}
                onClick={backToLogin}
              >
                <ArrowLeft size={15} /> Kirishga qaytish
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  // ── Asosiy kirish ko'rinishi ──
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

          <div className="form-group" style={{ marginBottom: 8 }}>
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

          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setForgotMode(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontSize: 13, fontWeight: 600, padding: 0 }}
            >
              Parolni unutdingizmi?
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-success w-full"
            style={{ justifyContent: 'center', padding: '11px', fontSize: 15 }}
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
