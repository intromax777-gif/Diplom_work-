import { useState, useEffect } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Pagination, { PAGE_SIZE } from '../components/Pagination'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'

const SERVICE_TYPES = [
  { value: 'electricity', label: '⚡ Elektr energiya', unit: 'kWh' },
  { value: 'water', label: '💧 Suv', unit: 'm³' },
  { value: 'gas', label: '🔥 Gaz', unit: 'm³' },
]

const EMPTY_FORM = {
  client_id: '',
  service_type: 'electricity',
  reading_value: '',
  reading_date: new Date().toISOString().split('T')[0],
}

export default function Meters() {
  const [readings, setReadings] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [prevReading, setPrevReading] = useState(null)
  const [search, setSearch] = useState('')
  const [filterClient, setFilterClient] = useState('')
  const [filterService, setFilterService] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { setPage(1) }, [search, filterClient, filterService])

  async function fetchAll() {
    const [readingsRes, clientsRes] = await Promise.all([
      supabase.from('meter_readings')
        .select('*, clients(full_name)')
        .order('created_at', { ascending: false }),
      supabase.from('clients')
        .select('id, full_name, account_number')
        .order('full_name')
    ])
    setReadings(readingsRes.data || [])
    setClients(clientsRes.data || [])
    setLoading(false)
  }

  async function fetchPrevReading(clientId, serviceType) {
    if (!clientId || !serviceType) { setPrevReading(null); return }
    const { data } = await supabase
      .from('meter_readings')
      .select('reading_value, reading_date')
      .eq('client_id', clientId)
      .eq('service_type', serviceType)
      .order('reading_date', { ascending: false })
      .limit(1)
    setPrevReading(data?.[0] || null)
  }

  useEffect(() => {
    fetchPrevReading(form.client_id, form.service_type)
  }, [form.client_id, form.service_type])

  async function handleDelete(id) {
    if (!window.confirm("Bu ko'rsatmani o'chirishni xohlaysizmi?")) return
    await supabase.from('meter_readings').delete().eq('id', id)
    fetchAll()
  }

  const filtered = readings.filter(r => {
    const matchSearch = !search || r.clients?.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchClient = !filterClient || r.client_id === filterClient
    const matchService = !filterService || r.service_type === filterService
    return matchSearch && matchClient && matchService
  })

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function handleSave() {
    if (!form.client_id || !form.reading_value) {
      alert("Iltimos, barcha maydonlarni to'ldiring")
      return
    }
    const date = new Date(form.reading_date)
    setSaving(true)
    await supabase.from('meter_readings').insert({
      client_id: form.client_id,
      service_type: form.service_type,
      reading_value: parseFloat(form.reading_value),
      reading_date: form.reading_date,
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    })
    setSaving(false)
    setShowModal(false)
    setForm(EMPTY_FORM)
    setPrevReading(null)
    fetchAll()
  }

  const consumption = prevReading && form.reading_value
    ? Math.max(0, parseFloat(form.reading_value) - prevReading.reading_value).toFixed(2)
    : null

  const getUnit = (type) => SERVICE_TYPES.find(s => s.value === type)?.unit || ''
  const getLabel = (type) => SERVICE_TYPES.find(s => s.value === type)?.label || type

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Hisoblagich Ko'rsatmalari</h1>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>KommunalPay › Hisoblagichlar</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Ko'rsatma Kiritish
        </button>
      </div>

      <div className="page-content">
        <div className="card">
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ flex: 1, minWidth: 180 }}>
              <Search size={15} color="#94a3b8" />
              <input
                placeholder="Mijoz nomi..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: 160 }}
              value={filterClient}
              onChange={e => setFilterClient(e.target.value)}
            >
              <option value="">Barcha mijozlar</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: 160 }}
              value={filterService}
              onChange={e => setFilterService(e.target.value)}
            >
              <option value="">Barcha xizmatlar</option>
              {SERVICE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', alignSelf: 'center' }}>
              {filtered.length} ta
            </span>
          </div>

          {loading ? (
            <Spinner />
          ) : (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Mijoz</th>
                      <th>Xizmat turi</th>
                      <th>Ko'rsatma</th>
                      <th>Sana</th>
                      <th>Oy</th>
                      <th>Yil</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <EmptyState colSpan={7} title="Ko'rsatmalar mavjud emas" />
                    ) : paginated.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 500 }}>{r.clients?.full_name}</td>
                        <td>{getLabel(r.service_type)}</td>
                        <td style={{ fontWeight: 600 }}>
                          {r.reading_value} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{getUnit(r.service_type)}</span>
                        </td>
                        <td>{new Date(r.reading_date).toLocaleDateString('ru-RU')}</td>
                        <td>{r.month}-oy</td>
                        <td>{r.year}</td>
                        <td>
                          <button
                            className="btn btn-sm"
                            style={{ color: '#dc2626', background: 'none', border: 'none', padding: '4px' }}
                            onClick={() => handleDelete(r.id)}
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Yangi Ko'rsatma Kiritish</h2>
              <button className="btn btn-outline btn-sm" onClick={() => { setShowModal(false); setPrevReading(null) }}>✕</button>
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

              <div className="form-group">
                <label className="form-label">Xizmat turi *</label>
                <select
                  className="form-control"
                  value={form.service_type}
                  onChange={e => setForm({ ...form, service_type: e.target.value })}
                >
                  {SERVICE_TYPES.map(s => (
                    <option key={s.value} value={s.value}>{s.label} ({s.unit})</option>
                  ))}
                </select>
              </div>

              {prevReading && (
                <div style={{
                  background: '#f0f9ff', border: '1px solid #bae6fd',
                  borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13
                }}>
                  📊 Oldingi ko'rsatma: <strong>{prevReading.reading_value} {getUnit(form.service_type)}</strong>
                  <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
                    ({new Date(prevReading.reading_date).toLocaleDateString('ru-RU')})
                  </span>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ko'rsatma qiymati ({getUnit(form.service_type)}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder="0.00"
                    value={form.reading_value}
                    onChange={e => setForm({ ...form, reading_value: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sana *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.reading_date}
                    onChange={e => setForm({ ...form, reading_date: e.target.value })}
                  />
                </div>
              </div>

              {consumption !== null && (
                <div style={{
                  background: '#f0fdf4', border: '1px solid #86efac',
                  borderRadius: 8, padding: '10px 14px', fontSize: 13
                }}>
                  ✅ Sarflangan: <strong>{consumption} {getUnit(form.service_type)}</strong>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => { setShowModal(false); setPrevReading(null) }}>
                Bekor qilish
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
