import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Zap, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function PortalResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  const [ready, setReady]       = useState(false)
  const navigate = useNavigate()

  // Supabase tiklash havolasi orqali kelganda sessiya o'rnatiladi
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true)
      }
    })
    // Sahifa to'g'ridan-to'g'ri ochilsa ham tekshiramiz
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

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
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message || "Parolni yangilashda xatolik")
    } else {
      setDone(true)
      await supabase.auth.signOut()
      setTimeout(() => navigate('/portal/login'), 2500)
    }
  }

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
              <Zap size={28} color="white" />
            </div>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Yangi Parol</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 6 }}>
            Hisobingiz uchun yangi parol o'rnating
          </p>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: '#dcfce7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
            }}>
              <CheckCircle size={30} color="#16a34a" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Parol yangilandi!</h3>
            <p style={{ fontSize: 13, color: '#64748b' }}>Kirish sahifasiga yo'naltirilmoqda...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca',
                padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16
              }}>
                {error}
              </div>
            )}

            {!ready && (
              <div style={{
                background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a',
                padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16
              }}>
                ⚙️ Havola tekshirilmoqda. Agar bu sahifaga emaildagi havola orqali kelmagan bo'lsangiz,
                qaytadan "Parolni unutdim" dan foydalaning.
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Yangi parol *</label>
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
                  autoFocus
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

            <button
              type="submit"
              className="btn btn-success w-full"
              style={{ justifyContent: 'center', padding: '11px', marginTop: 8, fontSize: 15 }}
              disabled={loading}
            >
              {loading ? 'Saqlanmoqda...' : 'Parolni yangilash'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
