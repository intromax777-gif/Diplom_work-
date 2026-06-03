import * as XLSX from 'xlsx'

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr']

const STATUS_LABEL = {
  pending: 'Kutilmoqda',
  paid: "To'langan",
  overdue: "Muddati o'tgan",
}

function downloadSheet(rows, sheetName, fileName) {
  const ws = XLSX.utils.json_to_sheet(rows)
  // Ustun kengligini avtomatik moslash
  const cols = Object.keys(rows[0] || {}).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String(r[key] ?? '').length)) + 2
  }))
  ws['!cols'] = cols
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, fileName)
}

// ── Schyotlar ro'yxati ──
export function exportInvoices(invoices) {
  const rows = invoices.map(inv => ({
    'Schyot #': inv.invoice_number,
    'Mijoz': inv.clients?.full_name || '',
    'Hisob raqami': inv.clients?.account_number || '',
    'Davr': `${MONTHS[inv.month - 1]} ${inv.year}`,
    'Elektr (so\'m)': inv.electricity_amount || 0,
    'Suv (so\'m)': inv.water_amount || 0,
    'Gaz (so\'m)': inv.gas_amount || 0,
    'Jami (so\'m)': inv.total_amount || 0,
    'Holat': STATUS_LABEL[inv.status] || inv.status,
    'To\'lov muddati': inv.due_date || '',
    'To\'langan sana': inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('uz-UZ') : '',
  }))
  if (rows.length === 0) rows.push({ 'Schyot #': 'Ma\'lumot yo\'q' })
  downloadSheet(rows, 'Schyotlar', `KommunalPay_Schyotlar_${new Date().getFullYear()}.xlsx`)
}

// ── Mijozlar ro'yxati ──
export function exportClients(clients) {
  const rows = clients.map(c => ({
    'Hisob raqami': c.account_number,
    'To\'liq ismi': c.full_name,
    'Manzil': c.address,
    'Telefon': c.phone || '',
    'Email': c.email || '',
    'Portal': c.user_id ? 'Faol' : 'Ro\'yxatdan o\'tmagan',
  }))
  if (rows.length === 0) rows.push({ 'Hisob raqami': 'Ma\'lumot yo\'q' })
  downloadSheet(rows, 'Mijozlar', `KommunalPay_Mijozlar_${new Date().getFullYear()}.xlsx`)
}

// ── Oylik hisobot ──
export function exportMonthlyReport(invoices, month, year) {
  const monthInvoices = invoices.filter(i => i.month === month && i.year === year)

  const rows = monthInvoices.map(inv => ({
    'Schyot #': inv.invoice_number,
    'Mijoz': inv.clients?.full_name || '',
    'Hisob raqami': inv.clients?.account_number || '',
    'Elektr (so\'m)': inv.electricity_amount || 0,
    'Suv (so\'m)': inv.water_amount || 0,
    'Gaz (so\'m)': inv.gas_amount || 0,
    'Jami (so\'m)': inv.total_amount || 0,
    'Holat': STATUS_LABEL[inv.status] || inv.status,
  }))

  // Yakuniy qator
  const sum = (key) => monthInvoices.reduce((s, i) => s + (i[key] || 0), 0)
  rows.push({})
  rows.push({
    'Schyot #': 'JAMI',
    'Mijoz': `${monthInvoices.length} ta schyot`,
    'Hisob raqami': '',
    'Elektr (so\'m)': sum('electricity_amount'),
    'Suv (so\'m)': sum('water_amount'),
    'Gaz (so\'m)': sum('gas_amount'),
    'Jami (so\'m)': sum('total_amount'),
    'Holat': '',
  })

  if (monthInvoices.length === 0) {
    downloadSheet([{ 'Natija': `${MONTHS[month - 1]} ${year} uchun schyotlar topilmadi` }], 'Hisobot',
      `KommunalPay_Hisobot_${MONTHS[month - 1]}_${year}.xlsx`)
    return
  }

  downloadSheet(rows, `${MONTHS[month - 1]} ${year}`,
    `KommunalPay_Hisobot_${MONTHS[month - 1]}_${year}.xlsx`)
}
