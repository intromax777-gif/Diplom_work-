import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, User, ChevronRight, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Pagination, { PAGE_SIZE } from '../components/Pagination'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'

const EMPTY_FORM = { full_name: '', address: '', phone: '', email: '', account_number: '' }

export default function Clients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchClients() }, [])
  useEffect(() => { setPage(1) }, [search])

  async function fetchClients() {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  const filtered = clients.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.account_number.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  )

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function handleSave() {
    if (!form.full_name.trim() || !form.address.trim() || !form.account_number.trim()) {
      alert("Iltimos, * bilan belgilangan maydonlarni to'ldiring")
      return
    }
    setSaving(true)
    if (editId) {
      await supabase.from('clients').update(form).eq('id', editId)
    } else {
      await supabase.from('clients').insert(form)
    }
    setSaving(false)
    closeModal()
    fetchClients()
  }

  function openEdit(client, e) {
    e.stopPropagation()
    setForm({
      full_name: client.full_name,
      address: client.address,
      phone: client.phone || '',
      email: client.email || '',
      account_number: client.account_number
    })
    setEditId(client.id)
    setShowModal(true)
  }

  function openAdd() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setForm(EMPTY_FORM)
    setEditId(null)
  }

  async function handleDelete(client, e) {
    e.stopPropagation()
    if (!window.confirm(`"${client.full_name}" mijozini barcha schyotlari bilan birga o'chirishni xohlaysizmi?`)) return
    await supabase.from('meter_readings').delete().eq('client_id', client.id)
    await supabase.from('invoices').delete().eq('client_id', client.id)
    await supabase.from('clients').delete().eq('id', client.id)
    fetchClients()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Mijozlar</h1>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>KommunalPay › Mijozlar</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Yangi Mijoz
        </button>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="flex-between mb-16">
            <div className="search-bar" style={{ flex: 1, maxWidth: 380 }}>
              <Search size={15} color="#94a3b8" />
              <input
                placeholder="Ism, hisob raqam yoki manzil..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {filtered.length} ta mijoz
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
                      <th>Hisob Raqami</th>
                      <th>To'liq Ismi</th>
                      <th>Manzil</th>
                      <th>Telefon</th>
                      <th>Portal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <EmptyState colSpan={6} title="Mijozlar topilmadi" />
                    ) : paginated.map(client => (
                      <tr
                        key={client.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/clients/${client.id}`)}
                      >
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                            {client.account_number}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <User size={15} color="#2563eb" />
                            </div>
                            <span style={{ fontWeight: 500 }}>{client.full_name}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{client.address}</td>
                        <td>{client.phone || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                        <td>
                          {client.user_id ? (
                            <span className="badge badge-paid">Faol</span>
                          ) : (
                            <span style={{
                              display: 'inline-flex', padding: '3px 10px', borderRadius: 20,
                              fontSize: 11.5, fontWeight: 700, background: '#f1f5f9', color: '#94a3b8'
                            }}>
                              Ro'yxatdan o'tmagan
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
                            <button className="btn btn-outline btn-sm" onClick={e => openEdit(client, e)}>
                              Tahrirlash
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ color: '#dc2626', background: 'none', border: 'none', padding: '4px' }}
                              onClick={e => handleDelete(client, e)}
                              title="O'chirish"
                            >
                              <Trash2 size={15} />
                            </button>
                            <ChevronRight size={16} color="#94a3b8" />
                          </div>
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
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editId ? 'Mijozni Tahrirlash' : "Yangi Mijoz Qo'shish"}
              </h2>
              <button className="btn btn-outline btn-sm" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">To'liq Ismi *</label>
                  <input
                    className="form-control"
                    placeholder="Alisher Karimov"
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hisob Raqami *</label>
                  <input
                    className="form-control"
                    placeholder="KP-0001"
                    value={form.account_number}
                    onChange={e => setForm({ ...form, account_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Manzil *</label>
                <input
                  className="form-control"
                  placeholder="Toshkent sh., Chilonzor t., 15-uy, 3-xonadon"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Telefon raqami</label>
                  <input
                    className="form-control"
                    placeholder="+998 90 123 45 67"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email manzil</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeModal}>Bekor qilish</button>
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
