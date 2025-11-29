export default function HeaderBar() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: 12, background: '#0E1A24', color: '#C9A14A', borderBottom: '1px solid #102030' }}>
      <img src="/icons/icon-192x192.png" alt="ZeusChat" width="32" height="32" style={{ borderRadius: 6, marginRight: 10 }} />
      <div style={{ fontWeight: 700 }}>ZeusChat</div>
      <div style={{ marginLeft: 8, color: '#fff' }}>by ZEUSTECH</div>
      <div style={{ marginLeft: 'auto' }}>
        <a href="/" style={{ color: '#C9A14A', textDecoration: 'underline', marginRight: 12 }}>Home</a>
        <a href="/privacy" style={{ color: '#C9A14A', textDecoration: 'underline', marginRight: 12 }}>Privacy</a>
        <a href="/terms" style={{ color: '#C9A14A', textDecoration: 'underline', marginRight: 12 }}>Terms</a>
        <a href="/acceptable" style={{ color: '#C9A14A', textDecoration: 'underline' }}>Policy</a>
      </div>
    </div>
  )
}
