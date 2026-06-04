import { useState, useEffect } from 'react'
import { usePortalAuth } from '../../context/PortalAuthContext'
import { supabase } from '../../lib/supabase'
import {
  Zap, LogOut, User, MapPin, Phone, Mail,
  CreditCard, FileText, CheckCircle, AlertTriangle, Clock, X, Pencil
} from 'lucide-react'

// ── Click to'lov sozlamalari (credentials kelganda o'zgartiring) ──
const CLICK_SERVICE_ID  = 'YOUR_SERVICE_ID'
const CLICK_MERCHANT_ID = 'YOUR_MERCHANT_ID'
const RETURN_URL = window.location.origin + '/portal/dashboard'

const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr']

const fmt = (n) => `${Number(n || 0).toLocaleString('uz-UZ')} so'm`

function statusInfo(status) {
  if (status === 'paid')    return { label: "To'langan",      color: '#16a34a', bg: '#dcfce7', Icon: CheckCircle }
  if (status === 'overdue') return { label: "Muddati o'tgan", color: '#dc2626', bg: '#fee2e2', Icon: AlertTriangle }
  return                           { label: 'Kutilmoqda',     color: '#d97706', bg: '#fef3c7', Icon: Clock }
}

export default function PortalDashboard() {
  const { client, signOut, updateProfile } = usePortalAuth()
  const [invoices, setInvoices]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [payModal, setPayModal]   = useState(null)   // invoice to pay
  const [paying, setPaying]       = useState(false)

  // Profil tahrirlash holati
  const [showEdit, setShowEdit]   = useState(false)
  const [editForm, setEditForm]   = useState({ full_name: '', address: '', phone: '', email: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [editError, setEditError] = useState('')

  useEffect(() => { if (client) fetchInvoices() }, [client])

  function openEditProfile() {
    setEditForm({
      full_name: client?.full_name || '',
      address: client?.address || '',
      phone: client?.phone || '',
      email: client?.email || '',
    })
    setEditError('')
    setShowEdit(true)
  }

  async function saveProfile() {
    if (!editForm.full_name.trim() || !editForm.address.trim()) {
      setEditError("Ism va manzil to'ldirilishi shart")
      return
    }
    setSavingProfile(true)
    setEditError('')
    const { error } = await updateProfile({
      full_name: editForm.full_name.trim(),
      address: editForm.address.trim(),
      phone: editForm.phone.trim(),
      email: editForm.email.trim(),
    })
    setSavingProfile(false)
    if (error) {
      setEditError(error.message || "Saqlashda xatolik yuz berdi")
    } else {
      setShowEdit(false)
    }
  }

  async function fetchInvoices() {
    // Muddati o'tganlarni avtomatik yangilash (fire-and-forget)
    const today = new Date().toISOString().split('T')[0]
    supabase.from('invoices')
      .update({ status: 'overdue' })
      .eq('client_id', client.id)
      .eq('status', 'pending')
      .lt('due_date', today)
      .not('due_date', 'is', null)

    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
    setInvoices(data || [])
    setLoading(false)
  }

  function openClickPayment(invoice) {
    const clickReady = CLICK_SERVICE_ID !== 'YOUR_SERVICE_ID'
    if (clickReady) {
      const url = `https://my.click.uz/services/pay?service_id=${CLICK_SERVICE_ID}&merchant_id=${CLICK_MERCHANT_ID}&amount=${invoice.total_amount}&transaction_param=${invoice.id}&return_url=${encodeURIComponent(RETURN_URL)}`
      window.open(url, '_blank')
    } else {
      setPayModal(invoice)
    }
  }

  async function simulatePay() {
    if (!payModal) return
    setPaying(true)
    await supabase.from('invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', payModal.id)
    setPaying(false)
    setPayModal(null)
    fetchInvoices()
  }

  const totalDebt = invoices
    .filter(i => i.status !== 'paid')
    .reduce((s, i) => s + (i.total_amount || 0), 0)

  const paidCount    = invoices.filter(i => i.status === 'paid').length
  const pendingCount = invoices.filter(i => i.status === 'pending').length
  const overdueCount = invoices.filter(i => i.status === 'overdue').length

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Top navbar */}
      <div style={{
        background: '#0f172a', padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#16a34a', borderRadius: 8, padding: '6px', display: 'flex' }}>
            <Zap size={16} color="white" />
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Kommunal Pay</span>
          <span style={{ color: '#475569', fontSize: 13, marginLeft: 4 }}>Mijoz Portali</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>{client?.full_name}</span>
          <button
            onClick={signOut}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            <LogOut size={15} /> Chiqish
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 16px' }}>
        {/* Client info card */}
        <div style={{
          background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
          padding: 24, marginBottom: 24,
          display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={24} color="#16a34a" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{client?.full_name}</div>
                <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{client?.account_number}</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={openEditProfile}>
                <Pencil size={13} /> Tahrirlash
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {[
                { Icon: MapPin, val: client?.address },
                { Icon: Phone, val: client?.phone || '—' },
                { Icon: Mail, val: client?.email || '—' },
              ].map(({ Icon, val }) => (
                <div key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
                  <Icon size={13} /> {val}
                </div>
              ))}
            </div>
          </div>

          {totalDebt > 0 && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
              padding: '16px 20px', textAlign: 'center', minWidth: 160
            }}>
              <div style={{ fontSize: 12, color: '#991b1b', fontWeight: 600, marginBottom: 4 }}>UMUMIY QARZ</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>{fmt(totalDebt)}</div>
            </div>
          )}
          {totalDebt === 0 && invoices.length > 0 && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12,
              padding: '16px 20px', textAlign: 'center', minWidth: 140
            }}>
              <CheckCircle size={28} color="#16a34a" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>Barcha to'langan</div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: "To'langan schyotlar", count: paidCount, color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Kutilayotgan', count: pendingCount, color: '#d97706', bg: '#fffbeb' },
            { label: "Muddati o'tgan", count: overdueCount, color: '#dc2626', bg: '#fef2f2' },
          ].map(({ label, count, color, bg }) => (
            <div key={label} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color }}>{count}</div>
            </div>
          ))}
        </div>

        {/* Invoices */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <FileText size={18} color="#64748b" />
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Schyotlar</h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Yuklanmoqda...</div>
          ) : invoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 56, color: '#94a3b8' }}>
              <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Schyotlar yo'q</div>
              <div style={{ fontSize: 13 }}>Schyotlar paydo bo'lganda bu yerda ko'rinadi</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {invoices.map(inv => {
                const st = statusInfo(inv.status)
                const StatusIcon = st.Icon
                const hasBreakdown = inv.electricity_amount > 0 || inv.water_amount > 0 || inv.gas_amount > 0
                return (
                  <div key={inv.id} style={{
                    border: '1px solid #e2e8f0', borderRadius: 14,
                    borderLeft: `4px solid ${st.color}`,
                    overflow: 'hidden',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                  }}>
                    {/* Asosiy qator */}
                    <div style={{
                      padding: '16px 20px',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
                    }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flex: 1 }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: 10, background: st.bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <StatusIcon size={20} color={st.color} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 14 }}>
                              {inv.invoice_number}
                            </span>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '2px 8px',
                              borderRadius: 12, background: st.bg, color: st.color
                            }}>
                              {st.label}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                            📅 {MONTHS[inv.month - 1]} {inv.year}
                            {inv.due_date && inv.status !== 'paid' && (
                              <span style={{ marginLeft: 8, color: inv.status === 'overdue' ? '#dc2626' : '#64748b' }}>
                                · Muddati: {new Date(inv.due_date).toLocaleDateString('uz-UZ')}
                              </span>
                            )}
                            {inv.paid_at && (
                              <span style={{ marginLeft: 8, color: '#16a34a' }}>
                                · To'langan: {new Date(inv.paid_at).toLocaleDateString('uz-UZ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>
                            {fmt(inv.total_amount)}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>Jami to'lov</div>
                        </div>
                        {inv.status !== 'paid' && (
                          <button
                            className="btn btn-success"
                            onClick={() => openClickPayment(inv)}
                          >
                            💳 To'lash
                          </button>
                        )}
                        {inv.status === 'paid' && (
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%', background: '#dcfce7',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <CheckCircle size={20} color="#16a34a" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Breakdown: elektr/suv/gaz */}
                    {hasBreakdown && (
                      <div style={{
                        borderTop: '1px solid #f1f5f9',
                        background: '#f8fafc',
                        padding: '12px 20px',
                        display: 'flex', gap: 24, flexWrap: 'wrap'
                      }}>
                        {inv.electricity_amount > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 16 }}>⚡</span>
                            <div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>Elektr</div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>
                                {inv.electricity_amount.toLocaleString()} so'm
                              </div>
                            </div>
                          </div>
                        )}
                        {inv.water_amount > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 16 }}>💧</span>
                            <div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>Suv</div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>
                                {inv.water_amount.toLocaleString()} so'm
                              </div>
                            </div>
                          </div>
                        )}
                        {inv.gas_amount > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 16 }}>🔥</span>
                            <div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>Gaz</div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>
                                {inv.gas_amount.toLocaleString()} so'm
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Payment modal (Click credentials yo'q bo'lganda) */}
      {payModal && (
        <div className="modal-overlay" onClick={() => setPayModal(null)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">To'lov</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setPayModal(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{
                background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: '#92400e'
              }}>
                ⚙️ Click to'lov tizimi hali ulanmagan. Test rejimi faol.
              </div>

              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                {[
                  ['Schyot raqami', payModal.invoice_number],
                  ['Davr', `${MONTHS[payModal.month - 1]} ${payModal.year}`],
                  ['To\'lov muddati', payModal.due_date ? new Date(payModal.due_date).toLocaleDateString('uz-UZ') : '—'],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: '#64748b' }}>{l}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Jami to'lov:</span>
                  <span style={{ color: '#16a34a', fontSize: 18 }}>{fmt(payModal.total_amount)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#eff6ff', borderRadius: 10, fontSize: 13, color: '#1e40af' }}>
                <CreditCard size={16} />
                Click credentials qo'shilganda haqiqiy to'lov ishlaydi
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setPayModal(null)}>Bekor qilish</button>
              <button className="btn btn-success" onClick={simulatePay} disabled={paying}>
                {paying ? 'Amalga oshirilmoqda...' : '✓ To\'landi (test)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Profil tahrirlash modal ── */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Profilni Tahrirlash</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setShowEdit(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {editError && (
                <div style={{
                  background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca',
                  padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16
                }}>
                  {editError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">To'liq ismi *</label>
                <input
                  className="form-control"
                  value={editForm.full_name}
                  onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Manzil *</label>
                <input
                  className="form-control"
                  value={editForm.address}
                  onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Telefon</label>
                  <input
                    className="form-control"
                    placeholder="+998 90 123 45 67"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="email@example.com"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{
                fontSize: 12, color: '#94a3b8', marginTop: 4
              }}>
                Hisob raqami ({client?.account_number}) o'zgartirib bo'lmaydi.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowEdit(false)}>Bekor qilish</button>
              <button className="btn btn-success" onClick={saveProfile} disabled={savingProfile}>
                {savingProfile ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
