export default function EmptyState({
  icon = '📭',
  title = "Ma'lumot topilmadi",
  hint = "Qidiruv shartlarini o'zgartiring yoki yangi yozuv qo'shing",
  colSpan,
}) {
  const content = (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: '#64748b' }}>{title}</div>
      <div style={{ fontSize: 13 }}>{hint}</div>
    </div>
  )

  // Jadval ichida ishlatilsa <tr><td colSpan> bilan o'raladi
  if (colSpan) {
    return (
      <tr>
        <td colSpan={colSpan} style={{ padding: 0 }}>{content}</td>
      </tr>
    )
  }
  return content
}
