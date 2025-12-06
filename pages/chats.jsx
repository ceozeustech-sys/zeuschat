import { useEffect, useState } from 'react'
import HeaderBar from '../components/HeaderBar'

export default function Chats() {
  const [myId, setMyId] = useState('')
  const [items, setItems] = useState([])
  const [meshEnabled, setMeshEnabled] = useState(false)
  const [tab, setTab] = useState('chats')

  useEffect(() => {
    const c = localStorage.getItem('device_id') || ''
    setMyId(c)
    ;(async () => {
      if (!c) return
      try {
        const r = await fetch(`/api/contacts/${c}`)
        if (r.ok) {
          const list = await r.json()
          setItems(list.map(x => ({ peer: x.code, alias: x.alias || x.code })))
        }
      } catch {}
    })()
  }, [])

  useEffect(() => {
    function onOnline() { setMeshEnabled(false); try { const q = JSON.parse(localStorage.getItem('mesh_queue') || '[]'); if (q.length > 0) { q.forEach(async m => { await fetch('/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m) }) }); localStorage.removeItem('mesh_queue') } } catch {} }
    function onOffline() { setMeshEnabled(true) }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    if (!navigator.onLine) setMeshEnabled(true)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

  function queueMessage(peer, dataObj, ttlMs) {
    try { const q = JSON.parse(localStorage.getItem('mesh_queue') || '[]'); q.push({ device_id: peer, data: JSON.stringify(dataObj), ttl_ms: ttlMs, from: myId }); localStorage.setItem('mesh_queue', JSON.stringify(q)) } catch {}
  }

  return (
    <main style={{ minHeight: '100vh', background: '#000', color: '#C9A14A' }}>
      <HeaderBar />
      <div style={{ padding: 12 }}>
        {items.map(it => (
          <a key={it.peer} href={`/chat?peer=${encodeURIComponent(it.peer)}`} style={{ display: 'flex', alignItems: 'center', padding: 12, textDecoration: 'none', color: '#fff', borderBottom: '1px solid #102030' }}>
            <img src={'/icons/icon-192x192.png'} alt="avatar" width="40" height="40" style={{ borderRadius: 20, marginRight: 12 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{it.alias}</div>
              <div style={{ color: '#aaa', fontSize: 12 }}>Last message • 10:24</div>
            </div>
          </a>
        ))}
        {items.length === 0 ? <div style={{ color: '#888', padding: 24 }}>No chats yet</div> : null}
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', background: '#101010', borderTop: '1px solid #102030' }}>
        <button onClick={() => setTab('chats')} style={{ padding: 12, background: 'transparent', color: tab==='chats' ? '#C9A14A' : '#888' }}>Chats</button>
        <a href="/contacts" style={{ padding: 12, color: tab==='contacts' ? '#C9A14A' : '#888', textDecoration: 'none' }}>Contacts</a>
        <a href="/profile" style={{ padding: 12, color: tab==='profile' ? '#C9A14A' : '#888', textDecoration: 'none' }}>Profile</a>
      </div>
    </main>
  )
}
