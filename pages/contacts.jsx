import { useEffect, useState } from 'react'

export default function Contacts() {
  const [owner, setOwner] = useState('')
  const [list, setList] = useState([])
  const [peer, setPeer] = useState('')
  const [alias, setAlias] = useState('')

  useEffect(() => {
    const c = localStorage.getItem('device_id') || ''
    setOwner(c)
    ;(async () => {
      if (!c) return
      const r = await fetch(`/api/contacts/${c}`)
      if (r.ok) setList(await r.json())
    })()
  }, [])

  async function add() {
    if (!peer) return
    const r = await fetch(`/api/contacts/${owner}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: peer, alias }) })
    if (r.ok) setList(await r.json())
    setPeer(''); setAlias('')
  }

  return (
    <main style={{ display: 'flex', minHeight: '100vh', background: '#0E1A24', color: '#C9A14A', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 480 }}>
        <h2>Contacts</h2>
        <div>
          <input value={peer} onChange={e => setPeer(e.target.value)} placeholder="Friend's code" style={{ width: '60%', padding: 8 }} />
          <input value={alias} onChange={e => setAlias(e.target.value)} placeholder="Alias (optional)" style={{ width: '30%', padding: 8, marginLeft: 8 }} />
          <button onClick={add} style={{ marginLeft: 8, padding: '8px 16px', background: '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 6 }}>Add</button>
        </div>
        <div style={{ marginTop: 16 }}>
          {list.map(c => (
            <div key={c.code} style={{ background: '#102030', padding: 12, borderRadius: 8, marginBottom: 8 }}>
              <div style={{ color: '#fff' }}>{c.alias || c.code}</div>
              <a href={`/chat?peer=${encodeURIComponent(c.code)}`} style={{ color: '#C9A14A', textDecoration: 'underline' }}>Chat</a>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}><a href="/" style={{ color: '#C9A14A', textDecoration: 'underline' }}>Home</a></div>
      </div>
    </main>
  )
}
