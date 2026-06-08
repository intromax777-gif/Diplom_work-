import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, FileText, DollarSign, AlertTriangle, TrendingUp, FileDown, X, UserCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { exportInvoices, exportClients, exportMonthlyReport } from '../lib/reports'
import Spinner from '../components/Spinner'

const MONTHS_SHORT = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr']

const fmt = (n) => `${Math.round(Number(n || 0)).toLocaleString('uz-UZ')} so'm`

const statusBadge = (status) => {
  const map = {
    pending: ['badge-pending', "Kutilmoqda"],
    paid: ['badge-paid', "To'langan"],
    overdue: ['badge-overdue', "Muddati o'tgan"]
  }
  const [cls, label] = map[status] || ['', status]
  return <span className={`badge ${cls}`}>{label}</span>
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ clients: 0, pending: 0, overdue: 0, revenue: 0, portalUsers: 0 })
  const [recentInvoices, setRecentInvoices] = useState([])
  const [allInvoices, setAllInvoices] = useState([])
  const [allClients, setAllClients] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [loading, setLoading] = useState(true)

  // Hisobot modal holati
  const [showReport, setShowReport] = useState(false)
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1)
  const [reportYear, setReportYear] = useState(new Date().getFullYear())

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const today = new Date().toISOString().split('T')[0]
      // Overdue update: kutmasdan yuboramiz (fire-and-forget)
      supabase.from('invoices')
        .update({ status: 'overdue' })
        .eq('status', 'pending')
        .lt('due_date', today)
        .not('due_date', 'is', null)

      const [clientsRes, invoicesRes] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('invoices')
          .select('*, clients(full_name, account_number)')
          .order('created_at', { ascending: false }),
      ])

      const clients = clientsRes.data || []
      const invoices = invoicesRes.data || []
      const pending = invoices.filter(i => i.status === 'pending').length
      const overdue = invoices.filter(i => i.status === 'overdue').length
      const revenue = invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (i.total_amount || 0), 0)
      const portalUsers = clients.filter(c => c.user_id).length

      setStats({ clients: clients.length, pending, overdue, revenue, portalUsers })
      setAllClients(clients)
      setAllInvoices(invoices)
      setRecentInvoices(invoices.slice(0, 6))

      // Last 6 months chart
      const now = new Date()
      const monthly = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const m = date.getMonth() + 1
        const y = date.getFullYear()
        const monthPaid = invoices.filter(inv => inv.month === m && inv.year === y && inv.status === 'paid')
        monthly.push({
          name: MONTHS_SHORT[m - 1],
          total: monthPaid.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
        })
      }
      setMonthlyData(monthly)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Spinner text="Dashboard yuklanmoqda..." />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>KommunalPay › Dashboard</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <button className="btn btn-outline" onClick={() => setShowReport(true)}>
            <FileDown size={16} /> Hisobot
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Stat cards */}
        <div className="stat-grid">
          <div className="stat-card blue">
            <div className="stat-icon" style={{ background: '#eff6ff' }}>
              <Users size={20} color="#2563eb" />
            </div>
            <div className="stat-label">Jami Mijozlar</div>
            <div className="stat-value">{stats.clients}</div>
            <div style={{ fontSize: 12, color: '#16a34a', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <UserCheck size={13} /> {stats.portalUsers} ta portalda faol
            </div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon" style={{ background: '#f0fdf4' }}>
              <DollarSign size={20} color="#16a34a" />
            </div>
            <div className="stat-label">Jami Tushumlar</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{fmt(stats.revenue)}</div>
          </div>
          <div className="stat-card amber">
            <div className="stat-icon" style={{ background: '#fffbeb' }}>
              <FileText size={20} color="#d97706" />
            </div>
            <div className="stat-label">Kutilayotgan</div>
            <div className="stat-value">{stats.pending}</div>
          </div>
          <div className="stat-card red">
            <div className="stat-icon" style={{ background: '#fef2f2' }}>
              <AlertTriangle size={20} color="#dc2626" />
            </div>
            <div className="stat-label">Muddati O'tgan</div>
            <div className="stat-value">{stats.overdue}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="chart-grid mb-20">
          <div className="card">
            <div className="flex-between mb-16">
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>So'nggi 6 oylik tushumlar</h3>
              <TrendingUp size={17} color="var(--text-secondary)" />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v) => [fmt(v), 'Tushum']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                />
                <Bar dataKey="total" fill="#2563eb" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Schyot holatlari</h3>
            {[
              { label: "To'langan", count: allInvoices.filter(i => i.status === 'paid').length, cls: 'badge-paid' },
              { label: 'Kutilmoqda', count: stats.pending, cls: 'badge-pending' },
              { label: "Muddati o'tgan", count: stats.overdue, cls: 'badge-overdue' },
            ].map(({ label, count, cls }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 0', borderBottom: '1px solid var(--border)'
              }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
                <span className={`badge ${cls}`} style={{ fontSize: 14, padding: '4px 12px' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent invoices */}
        <div className="card">
          <div className="flex-between mb-16">
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>So'nggi schyotlar</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/invoices')}>
              Barchasini ko'rish →
            </button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Schyot #</th>
                  <th>Mijoz</th>
                  <th>Oy / Yil</th>
                  <th>Jami</th>
                  <th>Holat</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 32 }}>
                      Hozircha schyotlar yo'q
                    </td>
                  </tr>
                ) : recentInvoices.map(inv => (
                  <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/invoices/${inv.id}`)}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{inv.invoice_number}</td>
                    <td onClick={e => e.stopPropagation()}>
                      {inv.client_id ? (
                        <span
                          style={{ color: 'var(--primary)', fontWeight: 500, cursor: 'pointer' }}
                          onClick={() => navigate(`/clients/${inv.client_id}`)}
                        >
                          {inv.clients?.full_name}
                        </span>
                      ) : inv.clients?.full_name}
                    </td>
                    <td>{MONTHS[inv.month - 1]} {inv.year}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(inv.total_amount)}</td>
                    <td>{statusBadge(inv.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Hisobot modal ── */}
      {showReport && (
        <div className="modal-overlay" onClick={() => setShowReport(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Hisobot Yuklab Olish</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setShowReport(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {/* Schyotlar */}
              <div style={{
                border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Schyotlar ro'yxati</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Barcha schyotlar ({allInvoices.length} ta)</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => exportInvoices(allInvoices)}>
                  <FileDown size={14} /> Yuklab olish
                </button>
              </div>

              {/* Mijozlar */}
              <div style={{
                border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Mijozlar ro'yxati</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Barcha mijozlar ({allClients.length} ta)</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => exportClients(allClients)}>
                  <FileDown size={14} /> Yuklab olish
                </button>
              </div>

              {/* Oylik hisobot */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Oylik hisobot</div>
                <div className="form-row" style={{ marginBottom: 12 }}>
                  <select className="form-control" value={reportMonth} onChange={e => setReportMonth(parseInt(e.target.value))}>
                    {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                  <select className="form-control" value={reportYear} onChange={e => setReportYear(parseInt(e.target.value))}>
                    {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <button
                  className="btn btn-primary w-full"
                  style={{ justifyContent: 'center' }}
                  onClick={() => exportMonthlyReport(allInvoices, reportMonth, reportYear)}
                >
                  <FileDown size={14} /> {MONTHS[reportMonth - 1]} {reportYear} hisobotini yuklab olish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
