import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, Trash2, Layers, X, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Pagination, { PAGE_SIZE } from '../components/Pagination'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'

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
  const [page, setPage] = useState(1)
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

  // Ommaviy schyot holati
  const [showBulk, setShowBulk] = useState(false)
  const [bulkForm, setBulkForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() })
  const [bulkRunning, setBulkRunning] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 })
  const [bulkResult, setBulkResult] = useState(null)

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    const clientId = searchParams.get('client')
    if (clientId && clients.length > 0) {
      setForm(f => ({ ...f, client_id: clientId }))
      setShowModal(true)
    }
  }, [searchParams, clients])

  // Qidiruv/filter o'zgarsa birinchi sahifaga qaytish
  useEffect(() => { setPage(1) }, [search, filter])

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

  // ── Bitta mijoz uchun summa hisoblash (ham preview, ham bulk ishlatadi) ──
  async function computeAmounts(clientId, month, year) {
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

    return {
      electricity: elec,
      water,
      gas,
      total: +(elec.amount + water.amount + gas.amount).toFixed(2),
    }
  }

  async function calculatePreview(clientId, month, year) {
    if (!clientId) { setPreview(null); return }
    setPreviewLoading(true)
    const result = await computeAmounts(clientId, month, year)
    setPreview(result)
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

  // ── OMMAVIY SCHYOT YARATISH ──
  async function runBulkGenerate() {
    const { month, year } = bulkForm
    setBulkRunning(true)
    setBulkResult(null)
    setBulkProgress({ done: 0, total: clients.length })

    // Bu oy uchun mavjud schyotlar (dublikatni oldini olish)
    const { data: existingInvoices } = await supabase
      .from('invoices')
      .select('client_id')
      .eq('month', month)
      .eq('year', year)
    const existingSet = new Set((existingInvoices || []).map(i => i.client_id))

    const dueDate = new Date(year, month, 15).toISOString().split('T')[0]
    let created = 0, skipped = 0, noReadings = 0

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i]

      if (existingSet.has(client.id)) {
        skipped++
        setBulkProgress({ done: i + 1, total: clients.length })
        continue
      }

      const amounts = await computeAmounts(client.id, month, year)
      if (amounts.total === 0) {
        noReadings++
        setBulkProgress({ done: i + 1, total: clients.length })
        continue
      }

      const invoiceNum = `INV-${year}${String(month).padStart(2, '0')}-${Math.floor(Math.random() * 9000 + 1000)}`
      await supabase.from('invoices').insert({
        client_id: client.id,
        invoice_number: invoiceNum,
        month, year,
        electricity_amount: amounts.electricity.amount,
        water_amount: amounts.water.amount,
        gas_amount: amounts.gas.amount,
        total_amount: amounts.total,
        status: 'pending',
        due_date: dueDate,
      })
      created++
      setBulkProgress({ done: i + 1, total: clients.length })
    }

    setBulkRunning(false)
    setBulkResult({ created, skipped, noReadings })
    fetchAll()
  }

  function closeBulk() {
    setShowBulk(false)
    setBulkResult(null)
    setBulkProgress({ done: 0, total: 0 })
  }

  const filtered = invoices
    .filter(inv => filter === 'all' || inv.status === filter)
    .filter(inv =>
      (inv.invoice_number?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (inv.clients?.full_name?.toLowerCase() || '').includes(search.toLowerCase())
    )

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Schyot-Fakturalar</h1>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>KommunalPay › Schyot-Fakturalar</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => setShowBulk(true)}>
            <Layers size={16} /> Ommaviy Schyot
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Schyot Yaratish
          </button>
        </div>
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
            <Spinner />
          ) : (
            <>
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
                    {paginated.length === 0 ? (
                      <EmptyState colSpan={10} title="Schyotlar topilmadi" />
                    ) : paginated.map(inv => (
                      <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/invoices/${inv.id}`)}>
                        <td style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--primary)' }}>
                          {inv.invoice_number}
                        </td>
                        <td style={{ fontWeight: 500 }}>{inv.clients?.full_name}</td>
                        <td>{MONTHS[inv.month - 1]} {inv.year}</td>
                        <td>{(inv.electricity_amount || 0).toLocaleString()} so'm</td>
                        <td>{(inv.water_amount || 0).toLocaleString()} so'm</td>
                        <td>{(inv.gas_amount || 0).toLocaleString()} so'm</td>
                        <td style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>
                          {(inv.total_amount || 0).toLocaleString()} so'm
                        </td>
                        <td>{statusBadge(inv.status)}</td>
                        <td style={{
                          fontSize: 13,
                          color: inv.status === 'overdue' ? '#dc2626' : 'var(--text-secondary)',
                          fontWeight: inv.status === 'overdue' ? 600 : 400
                        }}>
                          {inv.due_date ? new Date(inv.due_date).toLocaleDateString('ru-RU') : '—'}
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
              <Pagination page={page} totalItems={filtered.length} onChange={setPage} />
            </>
          )}
        </div>
      </div>

      {/* ── Bitta schyot modal ── */}
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

      {/* ── Ommaviy schyot modal ── */}
      {showBulk && (
        <div className="modal-overlay" onClick={() => !bulkRunning && closeBulk()}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Ommaviy Schyot Yaratish</h2>
              <button className="btn btn-outline btn-sm" disabled={bulkRunning} onClick={closeBulk}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              {!bulkResult && (
                <>
                  <div style={{
                    background: '#eff6ff', border: '1px solid #bfdbfe',
                    borderRadius: 10, padding: '12px 14px', marginBottom: 18, fontSize: 13, color: '#1e40af'
                  }}>
                    💡 Tanlangan oy uchun barcha mijozlarga (ko'rsatmasi bor) bir vaqtda schyot yaratiladi. Mavjud schyotlar o'tkazib yuboriladi.
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Oy *</label>
                      <select
                        className="form-control"
                        value={bulkForm.month}
                        disabled={bulkRunning}
                        onChange={e => setBulkForm({ ...bulkForm, month: parseInt(e.target.value) })}
                      >
                        {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Yil *</label>
                      <select
                        className="form-control"
                        value={bulkForm.year}
                        disabled={bulkRunning}
                        onChange={e => setBulkForm({ ...bulkForm, year: parseInt(e.target.value) })}
                      >
                        {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: bulkRunning ? 12 : 0 }}>
                    Jami mijozlar: <strong>{clients.length}</strong> ta
                  </div>

                  {bulkRunning && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                        <span style={{ color: '#64748b' }}>Yaratilmoqda...</span>
                        <span style={{ fontWeight: 600 }}>{bulkProgress.done} / {bulkProgress.total}</span>
                      </div>
                      <div style={{ height: 8, background: '#e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${bulkProgress.total ? (bulkProgress.done / bulkProgress.total * 100) : 0}%`,
                          background: 'linear-gradient(90deg, #2563eb, #1d4ed8)',
                          transition: 'width 0.2s'
                        }} />
                      </div>
                    </div>
                  )}
                </>
              )}

              {bulkResult && (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', background: '#dcfce7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
                  }}>
                    <CheckCircle2 size={30} color="#16a34a" />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Tayyor!</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, fontSize: 14 }}>
                      <span style={{ color: '#15803d' }}>✅ Yaratilgan schyotlar</span>
                      <strong style={{ color: '#15803d' }}>{bulkResult.created} ta</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 14 }}>
                      <span style={{ color: '#64748b' }}>⏭ Mavjud (o'tkazildi)</span>
                      <strong style={{ color: '#64748b' }}>{bulkResult.skipped} ta</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#fffbeb', borderRadius: 8, fontSize: 14 }}>
                      <span style={{ color: '#92400e' }}>⚠️ Ko'rsatmasiz mijozlar</span>
                      <strong style={{ color: '#92400e' }}>{bulkResult.noReadings} ta</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {!bulkResult ? (
                <>
                  <button className="btn btn-outline" disabled={bulkRunning} onClick={closeBulk}>
                    Bekor qilish
                  </button>
                  <button className="btn btn-primary" disabled={bulkRunning || clients.length === 0} onClick={runBulkGenerate}>
                    {bulkRunning ? 'Yaratilmoqda...' : 'Hisoblash va Yaratish'}
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={closeBulk}>Yopish</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
