import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, FileText, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'

const MONTHS_SHORT = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr']

const fmt = (n) => `${Number(n || 0).toLocaleString('uz-UZ')} so'm`

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
  const [stats, setStats] = useState({ clients: 0, pending: 0, overdue: 0, revenue: 0 })
  const [recentInvoices, setRecentInvoices] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      const today = new Date().toISOString().split('T')[0]
      await supabase.from('invoices')
        .update({ status: 'overdue' })
        .eq('status', 'pending')
        .lt('due_date', today)
        .not('due_date', 'is', null)

      const [clientsRes, invoicesRes] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact' }),
        supabase.from('invoices')
          .select('*, clients(full_name, account_number)')
          .order('created_at', { ascending: false })
      ])

      const invoices = invoicesRes.data || []
      const pending = invoices.filter(i => i.status === 'pending').length
      const overdue = invoices.filter(i => i.status === 'overdue').length
      const revenue = invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (i.total_amount || 0), 0)

      setStats({ clients: clientsRes.count || 0, pending, overdue, revenue })
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

  if (loading) return <div className="loading">Dashboard yuklanmoqda...</div>

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      <div className="page-content">
        {/* Stat cards */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#eff6ff' }}>
              <Users size={20} color="#2563eb" />
            </div>
            <div className="stat-label">Jami Mijozlar</div>
            <div className="stat-value">{stats.clients}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f0fdf4' }}>
              <DollarSign size={20} color="#16a34a" />
            </div>
            <div className="stat-label">Jami Tushumlar</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{fmt(stats.revenue)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fffbeb' }}>
              <FileText size={20} color="#d97706" />
            </div>
            <div className="stat-label">Kutilayotgan</div>
            <div className="stat-value">{stats.pending}</div>
          </div>
          <div className="stat-card">
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
              { label: "To'langan", count: recentInvoices.filter(i => i.status === 'paid').length, cls: 'badge-paid' },
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
                    <td>{inv.clients?.full_name}</td>
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
    </div>
  )
}
