import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, AlertTriangle, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr']
const fmt = (n) => `${Number(n || 0).toLocaleString('uz-UZ')} so'm`
const SEEN_KEY = 'kp_seen_overdue'

function getSeen() {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY)) || [] }
  catch { return [] }
}

// Necha kun o'tganini hisoblash
function daysOverdue(dueDate) {
  if (!dueDate) return 0
  const diff = Date.now() - new Date(dueDate).getTime()
  return Math.max(0, Math.floor(diff / 86400000))
}

export default function Notifications({ onNavigate }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [overdue, setOverdue] = useState([])
  const [unseen, setUnseen] = useState(0)

  useEffect(() => { fetchOverdue() }, [])

  async function fetchOverdue() {
    // Muddati o'tgan schyotlarni avtomatik belgilash (fire-and-forget)
    const today = new Date().toISOString().split('T')[0]
    supabase.from('invoices')
      .update({ status: 'overdue' })
      .eq('status', 'pending')
      .lt('due_date', today)
      .not('due_date', 'is', null)

    const { data } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, due_date, month, year, client_id, clients(full_name, account_number)')
      .eq('status', 'overdue')
      .order('due_date', { ascending: true })

    const list = data || []
    setOverdue(list)
    const seen = getSeen()
    setUnseen(list.filter(i => !seen.includes(i.id)).length)
  }

  function openPanel() {
    setOpen(true)
    // Ko'rilgan deb belgilash
    localStorage.setItem(SEEN_KEY, JSON.stringify(overdue.map(i => i.id)))
    setUnseen(0)
  }

  function goTo(inv) {
    setOpen(false)
    onNavigate?.()
    navigate(`/invoices/${inv.id}`)
  }

  return (
    <>
      <button className="nav-item" onClick={openPanel} style={{ width: '100%' }}>
        <Bell size={17} />
        <span style={{ flex: 1, textAlign: 'left' }}>Bildirishnomalar</span>
        {unseen > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 700, background: '#dc2626', color: 'white',
            minWidth: 18, height: 18, borderRadius: 9, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '0 5px'
          }}>
            {unseen}
          </span>
        )}
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} color="#dc2626" /> Qarzdorlar bildirishnomasi
              </h2>
              <button className="btn btn-outline btn-sm" onClick={() => setOpen(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {overdue.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                  <Bell size={32} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
                  <div>Muddati o'tgan schyotlar yo'q</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: '#991b1b', marginBottom: 12 }}>
                    {overdue.length} ta schyot bo'yicha to'lov muddati o'tgan
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {overdue.map(inv => (
                      <div
                        key={inv.id}
                        onClick={() => goTo(inv)}
                        style={{
                          border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 10,
                          padding: '12px 14px', cursor: 'pointer',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>
                            {inv.clients?.full_name || 'Noma\'lum mijoz'}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                            {inv.invoice_number} · {MONTHS[inv.month - 1]} {inv.year}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 700, color: '#dc2626', fontSize: 14 }}>{fmt(inv.total_amount)}</div>
                          <div style={{ fontSize: 11, color: '#991b1b' }}>{daysOverdue(inv.due_date)} kun kechikdi</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
