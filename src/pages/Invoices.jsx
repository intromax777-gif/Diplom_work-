import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr']

const statusBadge = (status) => {
  const map = {
    pending: ['badge-pending', "Kutilmoqda"],
    paid: ['badge-paid', "To'langan"],
    overdue: ['badge-overdue', "Muddati o'tgan"]
  }
  const [cls, label] = map[status] || ['', status]
  return <span className={`badge ${cls}`}>{label}</span>
}

export default function Invoices() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [tariffs, setTariffs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [form, setForm] = useState({
    client_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    due_date: '',
  })

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    const clientId = searchParams.get('client')
    if (clientId && clients.length > 0) {
      setForm(f => ({ ...f, client_id: clientId }))
      setShowModal(true)
    }
  }, [searchParams, clients])

  async function markOverdueInvoices() {
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('invoices')
      .update({ status: 'overdue' })
      .eq('status', 'pending')
      .lt('due_date', today)
      .not('due_date', 'is', null)
  }

  async function fetchAll() {
    await markOverdueInvoices()
    const [invRes, clientsRes, tariffsRes] = await Promise.all([
      supabase.from('invoices')
        .select('*, clients(full_name, account_number)')
        .order('created_at', { ascending: false }),
      supabase.from('clients').select('id, full_name, account_number').order('full_name'),
      supabase.from('tariffs').select('*'),
    ])
    setInvoices(invRes.data || [])
    setClients(clientsRes.data || [])
    setTariffs(tariffsRes.data || [])
    setLoading(false)
  }

  async function deleteInvoice(inv, e) {
    e.stopPropagation()
    if (!window.confirm(`"${inv.invoice_number}" schyotini o'chirishni xohlaysizmi?`)) return
    await supabase.from('invoices').delete().eq('id', inv.id)
    fetchAll()
  }

  async function calculatePreview(clientId, month, year) {
    if (!clientId) { setPreview(null); return }
    setPreviewLoading(true)

    const { data: readings } = await supabase
      .from('meter_readings')
      .select('*')
      .eq('client_id', clientId)
      .eq('month', month)
      .eq('year', year)

    const getTariff = (type) => tariffs.find(t => t.service_type === type)?.price_per_unit || 0

    const calcAmount = async (type) => {
      const current = readings?.find(r => r.service_type === type)
      if (!current) return { consumption: 0, amount: 0 }

      const { data: prev } = await supabase
        .from('meter_readings')
        .select('reading_value')
        .eq('client_id', clientId)
        .eq('service_type', type)
        .lt('reading_date', current.reading_date)
        .order('reading_date', { ascending: false })
        .limit(1)

      const prevVal = prev?.[0]?.reading_value || 0
      const consumption = Math.max(0, current.reading_value - prevVal)
      return { consumption: +consumption.toFixed(2), amount: +(consumption * getTariff(type)).toFixed(2) }
    }

    const [elec, water, gas] = await Promise.all([
      calcAmount('electricity'),
      calcAmount('water'),
      calcAmount('gas'),
    ])

    setPreview({
      electricity: elec,
      water,
      gas,
      total: +(elec.amount + water.amount + gas.amount).toFixed(2),
    })
    setPreviewLoading(false)
  }

  useEffect(() => {
    if (showModal) calculatePreview(form.client_id, form.month, form.year)
  }, [form.client_id, form.month, form.year, showModal])

  async function generateInvoice() {
    if (!form.client_id || !preview) return
    if (preview.total === 0) {
      alert("Bu oy uchun hisoblagich ko'rsatmalari topilmadi yoki summa 0 so'm")
      return
    }
    setGenerating(true)

    const { data: existing } = await supabase
      .from('invoices')
      .select('id')
      .eq('client_id', form.client_id)
      .eq('month', form.month)
      .eq('year', form.year)
      .maybeSingle()
    if (existing) {
      alert('Bu mijoz uchun bu oy schyot allaqachon yaratilgan!')
      setGenerating(false)
      return
    }

    const invoiceNum = `INV-${form.year}${String(form.month).padStart(2, '0')}-${Math.floor(Math.random() * 9000 + 1000)}`
    const dueDate = form.due_date || new Date(form.year, form.month, 15).toISOString().split('T')[0]

    await supabase.from('invoices').insert({
      client_id: form.client_id,
      invoice_number: invoiceNum,
      month: form.month,
      year: form.year,
      electricity_amount: preview.electricity.amount,
      water_amount: preview.water.amount,
      gas_amount: preview.gas.amount,
      total_amount: preview.total,
      status: 'pending',
      due_date: dueDate,
    })

    setGenerating(false)
    setShowModal(false)
    setPreview(null)
    setForm({ client_id: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), due_date: '' })
    fetchAll()
  }

  const filtered = invoices
    .filter(inv => filter === 'all' || inv.status === filter)
    .filter(inv =>
      (inv.invoice_number?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (inv.clients?.full_name?.toLowerCase() || '').includes(search.toLowerCase())
    )

  return (
    <div>
      <div className="page-header">
        <h1>Schyot-Fakturalar</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Schyot Yaratish
        </button>
      </div>

      <div className="page-content">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div className="tabs">
              {[
                ['all', 'Barchasi'],
                ['pending', 'Kutilmoqda'],
                ['paid', "To'langan"],
                ['overdue', "Muddati o'tgan"],
              ].map(([v, l]) => (
                <div key={v} className={`tab ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>
                  {l}
                </div>
              ))}
            </div>
            <div className="search-bar" style={{ maxWidth: 280 }}>
              <Search size={15} color="#94a3b8" />
              <input
                placeholder="Schyot # yoki mijoz..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="loading">Yuklanmoqda...</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Schyot #</th>
                    <th>Mijoz</th>
                    <th>Davr</th>
                    <th>Elektr</th>
                    <th>Suv</th>
                    <th>Gaz</th>
                    <th>Jami</th>
                    <th>Holat</th>
                    <th>Muddati</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40 }}>
                        Schyotlar topilmadi
                      </td>
                    </tr>
                  ) : filtered.map(inv => (
                    <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/invoices/${inv.id}`)}>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--primary)' }}>
                        {inv.invoice_number}
                      </td>
                      <td style={{ fontWeight: 500 }}>{inv.clients?.full_name}</td>
                      <td>{MONTHS[inv.month - 1]} {inv.year}</td>
                      <td>{(inv.electricity_amount || 0).toLocaleString()} so'm</td>
                      <td>{(inv.water_amount || 0).toLocaleString()} so'm</td>
                      <td>{(inv.gas_amount || 0).toLocaleString()} so'm</td>
                      <td style={{ fontWeight: 700 }}>{(inv.total_amount || 0).toLocaleString()} so'm</td>
                      <td>{statusBadge(inv.status)}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString('uz-UZ') : '—'}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <button
                          className="btn btn-sm"
                          style={{ color: '#dc2626', background: 'none', border: 'none', padding: '4px' }}
                          onClick={e => deleteInvoice(inv, e)}
                          title="O'chirish"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setPreview(null) }}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Yangi Schyot Yaratish</h2>
              <button className="btn btn-outline btn-sm" onClick={() => { setShowModal(false); setPreview(null) }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Mijoz *</label>
                <select
                  className="form-control"
                  value={form.client_id}
                  onChange={e => setForm({ ...form, client_id: e.target.value })}
                >
                  <option value="">— Mijozni tanlang —</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.account_number})</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Oy *</label>
                  <select
                    className="form-control"
                    value={form.month}
                    onChange={e => setForm({ ...form, month: parseInt(e.target.value) })}
                  >
                    {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Yil *</label>
                  <select
                    className="form-control"
                    value={form.year}
                    onChange={e => setForm({ ...form, year: parseInt(e.target.value) })}
                  >
                    {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">To'lov muddati</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.due_date}
                  onChange={e => setForm({ ...form, due_date: e.target.value })}
                />
              </div>

              {/* Preview */}
              {previewLoading && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, padding: 12 }}>
                  Hisoblanmoqda...
                </div>
              )}

              {preview && !previewLoading && (
                <div style={{
                  background: '#f8fafc', border: '1px solid var(--border)',
                  borderRadius: 10, padding: 16
                }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Hisoblangan Summa
                  </h4>
                  {[
                    { label: '⚡ Elektr energiya', val: preview.electricity },
                    { label: '💧 Suv', val: preview.water },
                    { label: '🔥 Gaz', val: preview.gas },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {label} <span style={{ fontSize: 12 }}>({val.consumption} birlik)</span>
                      </span>
                      <span style={{ fontWeight: 500 }}>{val.amount.toLocaleString()} so'm</span>
                    </div>
                  ))}
                  <div style={{
                    borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 10,
                    display: 'flex', justifyContent: 'space-between', fontWeight: 700
                  }}>
                    <span>Jami to'lov:</span>
                    <span style={{ color: 'var(--primary)', fontSize: 16 }}>
                      {preview.total.toLocaleString()} so'm
                    </span>
                  </div>
                </div>
              )}

              {form.client_id && !preview && !previewLoading && (
                <div style={{
                  textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13,
                  padding: '14px 0', background: '#fef9c3', borderRadius: 8, marginTop: 8
                }}>
                  ⚠️ Bu oy uchun hisoblagich ko'rsatmalari topilmadi
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => { setShowModal(false); setPreview(null) }}>
                Bekor qilish
              </button>
              <button
                className="btn btn-primary"
                onClick={generateInvoice}
                disabled={generating || !preview || preview.total === 0}
              >
                {generating ? 'Yaratilmoqda...' : 'Schyot Yaratish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
