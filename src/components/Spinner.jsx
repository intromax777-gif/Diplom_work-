export default function Spinner({ text = 'Yuklanmoqda...' }) {
  return (
    <div className="loading">
      <div style={{
        width: 36, height: 36, border: '3px solid #e2e8f0',
        borderTopColor: '#2563eb', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite'
      }} />
      {text}
    </div>
  )
}
