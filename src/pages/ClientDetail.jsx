import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, MapPin, Phone, Mail, CreditCard, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr']
const SERVICE_LABELS = { electricity: '⚡ Elektr', water: '💧 Suv', gas: '🔥 Gaz' }
const SERVICE_UNITS = { electricity: 'kWh', water: 'm³', gas: 'm³' }

const statusBadge = (status) => {
  const map = {
    pending: ['badge-pending', "Kutilmoqda"],
    paid: ['badge-paid', "To'langan"],
    overdue: ['badge-overdue', "Muddati o'tgan"]
  }
  const [cls, label] = map[status] || ['', status]
  return <span className={`badge ${cls}`}>{label}</span>
}

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [readings, setReadings] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [id])

  async function fetchAll() {
    const [clientRes, readingsRes, invoicesRes] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('meter_readings').select('*').eq('client_id', id).order('reading_date', { ascending: false }).limit(20),
      supabase.from('invoices').select('*').eq('client_id', id).order('created_at', { ascending: false })
    ])
    setClient(clientRes.data)
    setReadings(readingsRes.data || [])
    setInvoices(invoicesRes.data || [])
    setLoading(false)
  }

  if (loading) return <div className="loading">Yuklanmoqda...</div>
  if (!client) return <div className="loading">Mijoz topilmadi</div>

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total_amount, 0)

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/clients')}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1>{client.full_name}</h1>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, fontFamily: 'monospace' }}>
              {client.account_number}
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
          {/* Left: Client info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16, background: '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <User size={32} color="#2563eb" />
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 600 }}>{client.full_name}</h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace', marginBottom: 20 }}>
                {client.account_number}
              </p>

              {[
                { icon: MapPin, label: 'Manzil', value: client.address },
                { icon: Phone, label: 'Telefon', value: client.phone || '—' },
                { icon: Mail, label: 'Email', value: client.email || '—' },
                { icon: CreditCard, label: 'Hisob raqami', value: client.account_number },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12, textAlign: 'left' }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, background: '#f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Icon size={14} color="#64748b" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 1 }}>{label}</div>
                    <div style={{ fontSize: 13 }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="card">
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Umumiy
              </h3>
              {[
                { label: 'Jami schyotlar', value: invoices.length },
                { label: "To'langan", value: invoices.filter(i => i.status === 'paid').length },
                { label: 'Kutilmoqda', value: invoices.filter(i => i.status === 'pending').length },
                { label: "To'langan summa", value: `${totalPaid.toLocaleString()} so'm` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Invoices */}
            <div className="card">
              <div className="flex-between mb-16">
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Schyotlar</h3>
                <button className="btn btn-primary btn-sm" onClick={() => navigate(`/invoices?client=${id}`)}>
                  <Plus size={14} /> Schyot yaratish
                </button>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Schyot #</th>
                      <th>Davr</th>
                      <th>Jami summa</th>
                      <th>Holat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>
                          Schyotlar mavjud emas
                        </td>
                      </tr>
                    ) : invoices.map(inv => (
                      <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/invoices/${inv.id}`)}>
                        <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{inv.invoice_number}</td>
                        <td>{MONTHS[inv.month - 1]} {inv.year}</td>
                        <td style={{ fontWeight: 600 }}>{inv.total_amount.toLocaleString()} so'm</td>
                        <td>{statusBadge(inv.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Meter readings */}
            <div className="card">
              <div className="flex-between mb-16">
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Hisoblagich Ko'rsatmalari</h3>
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/meters')}>
                  <Plus size={14} /> Ko'rsatma kiritish
                </button>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Xizmat turi</th>
                      <th>Ko'rsatma</th>
                      <th>Sana</th>
                      <th>Oy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>
                          Ko'rsatmalar mavjud emas
                        </td>
                      </tr>
                    ) : readings.map(r => (
                      <tr key={r.id}>
                        <td>{SERVICE_LABELS[r.service_type] || r.service_type}</td>
                        <td style={{ fontWeight: 600 }}>
                          {r.reading_value} {SERVICE_UNITS[r.service_type]}
                        </td>
                        <td>{new Date(r.reading_date).toLocaleDateString('ru-RU')}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{r.month}-oy, {r.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
