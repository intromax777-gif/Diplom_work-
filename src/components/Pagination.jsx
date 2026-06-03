import { ChevronLeft, ChevronRight } from 'lucide-react'

export const PAGE_SIZE = 15

export default function Pagination({ page, totalItems, pageSize = PAGE_SIZE, onChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  if (totalItems <= pageSize) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 12
    }}>
      <span style={{ fontSize: 13, color: '#64748b' }}>
        {from}–{to} / {totalItems} ta
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="btn btn-outline btn-sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={15} /> Oldingi
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', minWidth: 70, textAlign: 'center' }}>
          {page} / {totalPages} sahifa
        </span>
        <button
          className="btn btn-outline btn-sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Keyingi <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}
