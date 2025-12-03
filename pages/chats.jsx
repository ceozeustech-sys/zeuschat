import { useEffect, useState } from 'react'
import HeaderBar from '../components/HeaderBar'

export default function Chats() {
  const [myId, setMyId] = useState('')
  const [items, setItems] = useState([])

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

  return (
    <main style={{ minHeight: '100vh', background: '#ECECEC', color: '#222' }}>
      <HeaderBar />
      <div style={{ display: 'flex' }}>
      <div style={{ width: 340, borderRight: '1px solid #ddd', background: '#fff' }}>
        <div style={{ padding: 12, borderBottom: '1px solid #eee', fontWeight: 600 }}>Chats</div>
        <div>
          {items.map(it => (
            <a key={it.peer} href={`/chat?peer=${encodeURIComponent(it.peer)}`} style={{ display: 'flex', alignItems: 'center', padding: 12, textDecoration: 'none', color: '#222', borderBottom: '1px solid #f0f0f0' }}>
              <img src={'/icons/icon-192x192.png'} alt="avatar" width="36" height="36" style={{ borderRadius: 18, marginRight: 12 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{it.alias}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Select a chat</div>
      </div>
    </main>
  )
}
