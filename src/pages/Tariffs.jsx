import { useState, useEffect } from 'react'
import { Zap, Droplets, Flame, Edit2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Spinner from '../components/Spinner'

const formatDate = (d) =>
  new Date(d).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })

const SERVICE_CONFIG = {
  electricity: { icon: Zap, label: 'Elektr Energiya', unit: 'kWh', color: '#d97706', bg: '#fffbeb' },
  water: { icon: Droplets, label: 'Suv Ta\'minoti', unit: 'm³', color: '#2563eb', bg: '#eff6ff' },
  gas: { icon: Flame, label: 'Gaz Ta\'minoti', unit: 'm³', color: '#dc2626', bg: '#fef2f2' },
}

export default function Tariffs() {
  const [tariffs, setTariffs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [newPrice, setNewPrice] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchTariffs() }, [])

  async function fetchTariffs() {
    const { data } = await supabase.from('tariffs').select('*')
    setTariffs(data || [])
    setLoading(false)
  }

  async function handleSave() {
    const price = parseFloat(newPrice)
    if (!price || price <= 0) {
      alert("Iltimos, to'g'ri narx kiriting")
      return
    }
    setSaving(true)
    if (editing.id) {
      await supabase.from('tariffs')
        .update({ price_per_unit: price, updated_at: new Date().toISOString() })
        .eq('id', editing.id)
    } else {
      await supabase.from('tariffs')
        .insert({ service_type: editing.service_type, price_per_unit: price, updated_at: new Date().toISOString() })
    }
    setSaving(false)
    setEditing(null)
    setNewPrice('')
    fetchTariffs()
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tariflar</h1>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>KommunalPay › Tariflar</div>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Xizmat turlari bo'yicha narxlar
        </span>
      </div>

      <div className="page-content">
        {/* Tariff cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
          {Object.entries(SERVICE_CONFIG).map(([type, config]) => {
            const tariff = tariffs.find(t => t.service_type === type)
            const Icon = config.icon
            return (
              <div key={type} className="card card-hover" style={{ textAlign: 'center' }}>
                <div style={{
                  width: 68, height: 68, borderRadius: 18, background: config.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <Icon size={32} color={config.color} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{config.label}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>
                  1 {config.unit} uchun narx
                </p>

                {tariff ? (
                  <>
                    <div style={{ fontSize: 30, fontWeight: 700, color: config.color, marginBottom: 4 }}>
                      {tariff.price_per_unit.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      so'm / {config.unit}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 20 }}>
                      Yangilangan: {formatDate(tariff.updated_at)}
                    </div>
                  </>
                ) : (
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
                    Tarif belgilanmagan
                  </div>
                )}

                <button
                  className="btn btn-outline"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    const t = tariff || { service_type: type }
                    setEditing(t)
                    setNewPrice(t.price_per_unit?.toString() || '')
                  }}
                >
                  <Edit2 size={14} /> Narxni o'zgartirish
                </button>
              </div>
            )
          })}
        </div>

        {/* Tariffs history table */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Joriy Tariflar Jadvali</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Xizmat turi</th>
                  <th>Birlik</th>
                  <th>Narx</th>
                  <th>Oxirgi yangilanish</th>
                </tr>
              </thead>
              <tbody>
                {tariffs.map(t => {
                  const cfg = SERVICE_CONFIG[t.service_type]
                  const Icon = cfg?.icon
                  return (
                    <tr key={t.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {Icon && (
                            <div style={{
                              width: 30, height: 30, borderRadius: 8, background: cfg.bg,
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <Icon size={15} color={cfg.color} />
                            </div>
                          )}
                          {cfg?.label || t.service_type}
                        </div>
                      </td>
                      <td>{cfg?.unit || '—'}</td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>
                          {t.price_per_unit.toLocaleString()}
                        </span>
                        <span style={{ color: 'var(--text-secondary)', marginLeft: 4 }}>so'm</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(t.updated_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Tarif O'zgartirish</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                {SERVICE_CONFIG[editing?.service_type]?.label} uchun yangi narx kiriting
              </p>
              <div className="form-group">
                <label className="form-label">
                  Narx (so'm / {SERVICE_CONFIG[editing?.service_type]?.unit})
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0"
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value)}
                  autoFocus
                  style={{ fontSize: 18, fontWeight: 600 }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setEditing(null)}>Bekor qilish</button>
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
