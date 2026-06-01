import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Download, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  Document, Page, Text, View, StyleSheet, PDFDownloadLink
} from '@react-pdf/renderer'

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr']

// ── PDF Styles ──────────────────────────────────────────────────
const S = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11, color: '#0f172a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingBottom: 20, marginBottom: 24, borderBottom: '2 solid #2563eb'
  },
  companyName: { fontSize: 20, fontWeight: 'bold', color: '#2563eb' },
  sub: { fontSize: 10, color: '#64748b', marginTop: 3 },
  invoiceLabel: { fontSize: 28, fontWeight: 'bold', color: '#0f172a' },
  invoiceNum: { fontSize: 11, color: '#64748b', marginTop: 4 },
  section: { marginBottom: 20 },
  sTitle: { fontSize: 9, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { fontSize: 11, color: '#64748b' },
  value: { fontSize: 11 },
  tHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: '8 12', marginBottom: 1 },
  tRow: { flexDirection: 'row', padding: '9 12', borderBottom: '1 solid #e2e8f0' },
  tCell: { flex: 1, fontSize: 11 },
  tCellR: { flex: 1, fontSize: 11, textAlign: 'right' },
  totalRow: { flexDirection: 'row', padding: '12 12', backgroundColor: '#eff6ff', marginTop: 4 },
  totalLabel: { flex: 1, fontSize: 13, fontWeight: 'bold', color: '#2563eb' },
  totalValue: { flex: 1, fontSize: 13, fontWeight: 'bold', color: '#2563eb', textAlign: 'right' },
  info: { backgroundColor: '#f8fafc', padding: '12 14', borderRadius: 6, marginTop: 16 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 9, color: '#94a3b8' },
})

// ── PDF Document ─────────────────────────────────────────────────
function InvoicePDF({ invoice, client }) {
  const statusText = { pending: "To'lanmagan", paid: "To'langan", overdue: "Muddati o'tgan" }
  const statusColor = { pending: '#d97706', paid: '#16a34a', overdue: '#dc2626' }

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.header}>
          <View>
            <Text style={S.companyName}>Kommunal Pay</Text>
            <Text style={S.sub}>Kommunal Xizmatlar Billing Tizimi</Text>
            <Text style={[S.sub, { marginTop: 2 }]}>Tel: +998 71 123 45 67</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={S.invoiceLabel}>SCHYOT</Text>
            <Text style={S.invoiceNum}>{invoice.invoice_number}</Text>
          </View>
        </View>

        {/* Client + Invoice info */}
        <View style={{ flexDirection: 'row', gap: 40, marginBottom: 24 }}>
          <View style={[S.section, { flex: 1 }]}>
            <Text style={S.sTitle}>Mijoz Ma'lumotlari</Text>
            <Text style={[S.value, { fontWeight: 'bold', marginBottom: 4 }]}>{client?.full_name}</Text>
            <Text style={S.label}>{client?.address}</Text>
            {client?.phone && <Text style={S.label}>{client.phone}</Text>}
            <Text style={[S.label, { marginTop: 4 }]}>Hisob raqami: {client?.account_number}</Text>
          </View>
          <View style={[S.section, { flex: 1 }]}>
            <Text style={S.sTitle}>Schyot Ma'lumotlari</Text>
            <View style={S.row}>
              <Text style={S.label}>Sana:</Text>
              <Text style={S.value}>{new Date(invoice.created_at).toLocaleDateString('ru-RU')}</Text>
            </View>
            <View style={S.row}>
              <Text style={S.label}>Hisob davri:</Text>
              <Text style={S.value}>{MONTHS[invoice.month - 1]} {invoice.year}</Text>
            </View>
            <View style={S.row}>
              <Text style={S.label}>To'lov muddati:</Text>
              <Text style={S.value}>
                {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('ru-RU') : '—'}
              </Text>
            </View>
            <View style={S.row}>
              <Text style={S.label}>Holat:</Text>
              <Text style={[S.value, { color: statusColor[invoice.status], fontWeight: 'bold' }]}>
                {statusText[invoice.status]}
              </Text>
            </View>
          </View>
        </View>

        {/* Services table */}
        <View style={S.section}>
          <Text style={S.sTitle}>Xizmatlar Bo'yicha Tafsilot</Text>
          <View style={S.tHeader}>
            <Text style={[S.tCell, { fontWeight: 'bold', fontSize: 10 }]}>Xizmat turi</Text>
            <Text style={[S.tCellR, { fontWeight: 'bold', fontSize: 10 }]}>Summa (so'm)</Text>
          </View>
          {invoice.electricity_amount > 0 && (
            <View style={S.tRow}>
              <Text style={S.tCell}>Elektr Energiya (kWh)</Text>
              <Text style={S.tCellR}>{invoice.electricity_amount.toLocaleString()}</Text>
            </View>
          )}
          {invoice.water_amount > 0 && (
            <View style={S.tRow}>
              <Text style={S.tCell}>Suv Ta'minoti (m³)</Text>
              <Text style={S.tCellR}>{invoice.water_amount.toLocaleString()}</Text>
            </View>
          )}
          {invoice.gas_amount > 0 && (
            <View style={S.tRow}>
              <Text style={S.tCell}>Gaz Ta'minoti (m³)</Text>
              <Text style={S.tCellR}>{invoice.gas_amount.toLocaleString()}</Text>
            </View>
          )}
          <View style={S.totalRow}>
            <Text style={S.totalLabel}>JAMI TO'LOV:</Text>
            <Text style={S.totalValue}>{invoice.total_amount.toLocaleString()} so'm</Text>
          </View>
        </View>

        {/* Payment details */}
        <View style={S.info}>
          <Text style={S.sTitle}>To'lov Rekvizitlari</Text>
          <View style={S.row}>
            <Text style={S.label}>Bank:</Text>
            <Text style={S.value}>O'zbekiston Milliy Banki (NBU)</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>Hisob raqam:</Text>
            <Text style={S.value}>2020 8000 8700 0001</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>MFO:</Text>
            <Text style={S.value}>00873</Text>
          </View>
          <View style={S.row}>
            <Text style={S.label}>STIR:</Text>
            <Text style={S.value}>302 345 678</Text>
          </View>
        </View>

        <Text style={S.footer}>
          Ushbu hujjat "Kommunal Pay" avtomatlashtirilgan billing tizimi tomonidan yaratilgan. Murojaat: Kommunal Pay.uz
        </Text>
      </Page>
    </Document>
  )
}

// ── Page Component ───────────────────────────────────────────────
const statusBadge = (status) => {
  const map = {
    pending: ['badge-pending', "Kutilmoqda"],
    paid: ['badge-paid', "To'langan"],
    overdue: ['badge-overdue', "Muddati o'tgan"]
  }
  const [cls, label] = map[status] || ['', status]
  return <span className={`badge ${cls}`} style={{ fontSize: 13, padding: '5px 14px' }}>{label}</span>
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  useEffect(() => { fetchInvoice() }, [id])

  async function fetchInvoice() {
    const { data } = await supabase
      .from('invoices')
      .select('*, clients(*)')
      .eq('id', id)
      .single()
    setInvoice(data)
    setClient(data?.clients)
    setLoading(false)
  }

  async function deleteInvoice() {
    if (!window.confirm(`"${invoice.invoice_number}" schyotini o'chirishni xohlaysizmi?`)) return
    await supabase.from('invoices').delete().eq('id', id)
    navigate('/invoices')
  }

  async function markAsPaid() {
    setMarking(true)
    await supabase.from('invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id)
    setMarking(false)
    fetchInvoice()
  }

  if (loading) return <div className="loading">Yuklanmoqda...</div>
  if (!invoice) return <div className="loading">Schyot topilmadi</div>

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/invoices')}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1 style={{ fontFamily: 'monospace' }}>{invoice.invoice_number}</h1>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              {MONTHS[invoice.month - 1]} {invoice.year} — {client?.full_name}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {statusBadge(invoice.status)}

          {invoice.status !== 'paid' && (
            <button className="btn btn-success" onClick={markAsPaid} disabled={marking}>
              <CheckCircle size={15} />
              {marking ? "Belgilanmoqda..." : "To'langan deb belgilash"}
            </button>
          )}

          <button className="btn btn-danger" onClick={deleteInvoice}>
            <Trash2 size={15} />
            O'chirish
          </button>

          <PDFDownloadLink
            document={<InvoicePDF invoice={invoice} client={client} />}
            fileName={`${invoice.invoice_number}.pdf`}
            style={{ textDecoration: 'none' }}
          >
            {({ loading: pdfLoading }) => (
              <span className="btn btn-primary">
                <Download size={15} />
                {pdfLoading ? 'Tayyorlanmoqda...' : 'PDF Yuklab olish'}
              </span>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Client info */}
          <div className="card">
            <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
              Mijoz Ma'lumotlari
            </h3>
            {[
              ["To'liq ismi", client?.full_name],
              ['Manzil', client?.address],
              ['Telefon', client?.phone || '—'],
              ['Email', client?.email || '—'],
              ['Hisob raqami', client?.account_number],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 500, maxWidth: '60%', textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Invoice info */}
          <div className="card">
            <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
              Schyot Ma'lumotlari
            </h3>
            {[
              ['Schyot raqami', invoice.invoice_number],
              ['Hisob davri', `${MONTHS[invoice.month - 1]} ${invoice.year}`],
              ['Yaratilgan sana', new Date(invoice.created_at).toLocaleDateString('uz-UZ')],
              ["To'lov muddati", invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('uz-UZ') : '—'],
              ["To'langan sana", invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString('uz-UZ') : '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Services breakdown */}
        <div className="card">
          <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
            Xizmatlar Bo'yicha Tafsilot
          </h3>
          <table>
            <thead>
              <tr>
                <th>Xizmat turi</th>
                <th style={{ textAlign: 'right' }}>Summa</th>
              </tr>
            </thead>
            <tbody>
              {invoice.electricity_amount > 0 && (
                <tr>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>⚡</span> Elektr Energiya
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }}>
                    {invoice.electricity_amount.toLocaleString()} so'm
                  </td>
                </tr>
              )}
              {invoice.water_amount > 0 && (
                <tr>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>💧</span> Suv Ta'minoti
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }}>
                    {invoice.water_amount.toLocaleString()} so'm
                  </td>
                </tr>
              )}
              {invoice.gas_amount > 0 && (
                <tr>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>🔥</span> Gaz Ta'minoti
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }}>
                    {invoice.gas_amount.toLocaleString()} so'm
                  </td>
                </tr>
              )}
              <tr style={{ background: '#eff6ff' }}>
                <td style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)', padding: '16px 16px' }}>
                  JAMI TO'LOV
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 20, color: 'var(--primary)', padding: '16px 16px' }}>
                  {invoice.total_amount.toLocaleString()} so'm
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment info */}
        <div className="card mt-20" style={{ background: '#f8fafc' }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
            To'lov Rekvizitlari
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['Bank', "O'zbekiston Milliy Banki (NBU)"],
              ['Hisob raqam', '2020 8000 8700 0001'],
              ['MFO', '00873'],
              ['STIR', '302 345 678'],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
