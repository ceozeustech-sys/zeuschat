import { useEffect, useState } from 'react'
import HeaderBar from '../components/HeaderBar'
import PaymentModal from '../components/PaymentModal'

function getLS(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def } catch { return def }
}
function setLS(key, v) { try { localStorage.setItem(key, JSON.stringify(v)) } catch {} }

export default function Chat() {
  const [myId, setMyId] = useState('')
  const [peerId, setPeerId] = useState('')
  const [msg, setMsg] = useState('')
  const [list, setList] = useState([])
  const [useServer, setUseServer] = useState(true)
  const [password, setPassword] = useState('')
  const [ttl, setTtl] = useState('30')
  const [myPassHash, setMyPassHash] = useState('')
  const [replies, setReplies] = useState({})
  const [relayOk, setRelayOk] = useState(false)
  const [showReq, setShowReq] = useState({ visible: false, sender: '', blobId: '' })
  const [attachB64, setAttachB64] = useState('')
  const [attachKind, setAttachKind] = useState('')
  const [attachMime, setAttachMime] = useState('')
  const [recording, setRecording] = useState(false)
  const [recChunks, setRecChunks] = useState([])
  const [recMime, setRecMime] = useState('')
  const [view, setView] = useState({ open: false, blobId: '', sender: '', text: '', kind: 'text', b64: '', mime: '', ttlMs: 30000, remaining: 0, pin: '' })
  const [payOpen, setPayOpen] = useState(false)
  const [peerAllowed, setPeerAllowed] = useState(true)
  const [warn, setWarn] = useState('')
  function toB64(ab) { let s = ''; const bytes = new Uint8Array(ab); for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s) }
  function fromB64(str) { const bin = atob(str); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); return bytes.buffer }
  async function deriveKey(a, b) { const pair = [a, b].sort().join(':'); const enc = new TextEncoder().encode('MLS:' + pair); const d = await crypto.subtle.digest('SHA-256', enc); return await crypto.subtle.importKey('raw', d, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']) }

  useEffect(() => {
    const existing = getLS('device_id', '')
    if (existing) setMyId(existing)
    else {
      const id = genId(); setMyId(id); setLS('device_id', id)
    }
    const peer = getLS('peer_id', '')
    setPeerId(peer || '')
    const conv = getLS('conv', [])
    setList(conv)
    try {
      const qp = new URLSearchParams(window.location.search); const p = qp.get('peer'); if (p) { setPeerId(p); setLS('peer_id', p) }
    } catch {}
    ;(async () => {
      try { const r = await fetch(`/api/profile/${existing || getLS('device_id','')}`); if (r.ok) { const j = await r.json(); setMyPassHash(j.passwordHashB64 || '') } } catch {}
    })()
    ;(async () => { try { const t = await fetch('/api/relay/test'); setRelayOk(t.ok) } catch { setRelayOk(false) } })()
  }, [])

  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const raw = localStorage.getItem('screenshot_attempt')
        if (raw && view.open) {
          await fetch(`/api/ack/${view.sender}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blobId: view.blobId, reason: 'screenshot_attempt' }) })
          localStorage.removeItem('screenshot_attempt')
        }
      } catch {}
    }, 1000)
    return () => clearInterval(t)
  }, [view.open, view.sender, view.blobId])

  function genId() {
    let s = ''; for (let i = 0; i < 16; i++) s += Math.floor(Math.random() * 16).toString(16); return s
  }

  function savePeer(v) { setPeerId(v); setLS('peer_id', v); setWarn(''); setPeerAllowed(true) }

  async function validatePeer() {
    if (!peerId || !myId) return false
    try {
      const r = await fetch(`/api/contacts/${myId}`)
      if (!r.ok) { setWarn('contacts_unavailable'); setPeerAllowed(false); return false }
      const cl = await r.json()
      const exists = !!cl.find(x => x.code === peerId)
      if (!exists) { setWarn('not_in_contacts'); setPeerAllowed(false); return false }
      const pr = await fetch(`/api/profile/${peerId}`)
      if (!pr.ok) { setWarn('peer_not_found'); setPeerAllowed(false); return false }
      const pj = await pr.json()
      const active = pj.status !== 'offline'
      setPeerAllowed(active)
      if (!active) setWarn('peer_offline')
      return active
    } catch { setWarn('network_error'); setPeerAllowed(false); return false }
  }

  async function send() {
    if (!peerId || !msg) return
    const ok = await validatePeer()
    if (!ok) return
    const ttlMs = Math.max(5000, Math.min(86400000, parseInt(ttl || '30', 10) * 1000))
    if (useServer) {
      let dataObj = { kind: 'text', text: msg, ttl: ttlMs }
      if (attachB64 && attachKind) dataObj = { kind: attachKind, b64: attachB64, mime: attachMime, ttl: ttlMs }
      let encPayload = JSON.stringify(dataObj)
      try { const key = await deriveKey(myId, peerId); const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(encPayload)); encPayload = JSON.stringify({ enc: toB64(ct), iv: toB64(iv.buffer) }) } catch {}
      const payload = { device_id: peerId, data: encPayload, ttl_ms: ttlMs, from: myId }
      const r = await fetch('/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await r.json()
      const item = { id: j.id || genId(), from: myId, to: peerId, text: msg, kind: dataObj.kind, b64: dataObj.b64 || '', mime: dataObj.mime || '', ts: Date.now(), ttl: ttlMs, status: 'sent' }
      const next = [item, ...list]
      setList(next); setLS('conv', next)
      setMsg('')
      setAttachB64(''); setAttachKind(''); setAttachMime('')
    } else {
      const item = { id: genId(), from: myId, to: peerId, text: msg, kind: attachKind || 'text', b64: attachB64 || '', mime: attachMime || '', ts: Date.now(), ttl: ttlMs, status: 'sent' }
      const next = [item, ...list]
      setList(next); setLS('conv', next)
      setMsg('')
      setTimeout(() => expire(item.id), item.ttl)
      setAttachB64(''); setAttachKind(''); setAttachMime('')
    }
  }

  function expire(id) {
    setList(prev => { const next = prev.filter(x => x.id !== id); setLS('conv', next); return next })
  }

  function viewMessage(id) { expire(id) }

  useEffect(() => {
    const t = setInterval(async () => {
      if (!useServer || !myId) return
      try {
        const r = await fetch(`/api/inbox/${myId}`, { headers: { 'x-pin-hash': myPassHash || '' } })
        if (r.status === 204) return
        const j = await r.json()
        if (j && j.id) {
          const pk = await fetch(`/api/peek/${j.id}`)
          if (!pk.ok) return
          const pv = await pk.json()
          const sender = pv.from || 'peer'
          let isKnown = false
          try { const cr = await fetch(`/api/contacts/${myId}`); if (cr.ok) { const cl = await cr.json(); isKnown = !!cl.find(x => x.code === sender) } } catch {}
          if (!isKnown) { setShowReq({ visible: true, sender, blobId: j.id }); return }
          const b = await fetch(`/api/blob/${j.id}`)
          if (b.ok) {
            const p = await b.json()
            let text = ''
            let kind = 'text', b64 = '', mime = ''
            try {
              const obj = JSON.parse(p.data)
              if (obj && obj.enc && obj.iv) {
                const key = await deriveKey(myId, sender)
                const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(fromB64(obj.iv)) }, key, fromB64(obj.enc))
                const s = new TextDecoder().decode(pt)
                const o2 = JSON.parse(s)
                kind = o2.kind || 'text'; b64 = o2.b64 || ''; mime = o2.mime || ''; text = o2.text || ''
              } else {
                const o2 = JSON.parse(p.data); kind = o2.kind || 'text'; b64 = o2.b64 || ''; mime = o2.mime || ''; text = o2.text || ''
              }
            } catch { text = String(p.data || '') }
            setView({ open: true, blobId: j.id, sender: p.from || sender, text, kind, b64, mime, ttlMs: 30000, remaining: 30, pin: '' })
          }
        }
      } catch {}
    }, 2000)
    return () => clearInterval(t)
  }, [useServer, myId, peerId])

  useEffect(() => {
    const t = setInterval(async () => {
      if (!useServer || !myId) return
      try { const r = await fetch(`/api/ack/${myId}`); if (r.status === 204) return; const a = await r.json(); if (a && a.blobId) {
        setList(prev => { const next = prev.map(m => m.id === a.blobId ? { ...m, status: a.reason } : m); setLS('conv', next); return next })
      } } catch {}
    }, 2000)
    return () => clearInterval(t)
  }, [useServer, myId])

  async function onAttachFile(e) {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    setAttachMime(f.type)
    if (f.type.startsWith('image')) setAttachKind('image')
    else if (f.type.startsWith('video')) setAttachKind('video')
    else setAttachKind('file')
    const r = new FileReader()
    r.onload = () => setAttachB64(String(r.result).split(',')[1] || '')
    r.readAsDataURL(f)
  }

  async function startRecord() {
    if (recording) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      setRecMime(mr.mimeType || 'audio/webm')
      setRecChunks([])
      mr.ondataavailable = e => setRecChunks(prev => [...prev, e.data])
      mr.onstop = async () => {
        const blob = new Blob(recChunks, { type: recMime || 'audio/webm' })
        const fr = new FileReader()
        fr.onload = () => { setAttachB64(String(fr.result).split(',')[1] || ''); setAttachKind('audio'); setAttachMime(recMime || 'audio/webm') }
        fr.readAsDataURL(blob)
        setRecording(false)
      }
      mr.start()
      setRecording(true)
      setTimeout(() => { try { mr.stop() } catch {} }, Math.min(30000, parseInt(ttl || '30', 10) * 1000))
    } catch {}
  }

  async function sendReply(targetCode, originalId) {
    const body = replies[originalId] || ''
    if (!body) return
    const ttlMs = Math.max(5000, Math.min(86400000, parseInt(ttl || '30', 10) * 1000))
    if (useServer) {
      const payload = { device_id: targetCode, data: JSON.stringify({ text: body, ttl: ttlMs }), ttl_ms: ttlMs, from: myId }
      const r = await fetch('/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await r.json()
      const item = { id: j.id || genId(), from: myId, to: targetCode, text: body, ts: Date.now(), ttl: ttlMs, status: 'sent' }
      setList(prev => { const next = [item, ...prev]; setLS('conv', next); return next })
      setReplies(prev => ({ ...prev, [originalId]: '' }))
    }
  }

  async function confirmPin() {
    const entered = view.pin
    let ok = false
    try {
      const enc = new TextEncoder().encode('ZEUSPIN:' + entered)
      const d = await crypto.subtle.digest('SHA-256', enc)
      let s = ''; const bytes = new Uint8Array(d); for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); const b = btoa(s)
      ok = b === myPassHash
    } catch {
      ok = btoa('ZEUSPIN:' + entered) === myPassHash
    }
    if (!ok) { return }
    try { await fetch(`/api/ack/${view.sender}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blobId: view.blobId, reason: 'viewed' }) }) } catch {}
    const item = { id: view.blobId, from: view.sender, to: myId, text: view.text, kind: view.kind, b64: view.b64, mime: view.mime, ts: Date.now(), ttl: view.ttlMs }
    setList(prev => { const next = [item, ...prev]; setLS('conv', next); return next })
    const t = setInterval(() => {
      setView(v => { const r = v.remaining - 1; if (r <= 0) { clearInterval(t); expire(item.id); return { ...v, open: false, remaining: 0 } } return { ...v, remaining: r } })
    }, 1000)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0E1A24', color: '#C9A14A' }}>
      <HeaderBar />
      <div style={{ padding: '8px 16px' }}>
        <a href="/chats" style={{ color: '#C9A14A', textDecoration: 'none' }}>← Back to Chats</a>
      </div>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
      <div style={{ flex: 1, padding: 16 }}>
        <h2>ZeusChat</h2>
        <p style={{ color: '#fff' }}>Your ID: {myId} • Relay: {relayOk ? 'OK' : 'Offline'}</p>
        <div style={{ color: '#aaa', marginTop: 4 }}>{peerId ? (`Chat with ${peerId}`) : 'Select a contact to start chatting'}</div>
        <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} onSend={async payload => { const ttlMs = Math.max(5000, Math.min(86400000, parseInt(ttl || '30', 10) * 1000)); const p = { device_id: peerId, data: JSON.stringify({ ...payload, ttl: ttlMs }), ttl_ms: ttlMs, from: myId }; try { const r = await fetch('/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }); const j = await r.json(); const item = { id: j.id || genId(), from: myId, to: peerId, text: `${payload.network} ${payload.amount}`, kind: 'payment', b64: '', mime: '', ts: Date.now(), ttl: ttlMs, status: 'sent' }; const next = [item, ...list]; setList(next); setLS('conv', next) } catch {} setPayOpen(false) }} />
        {view.open ? (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#102030', color: '#fff', padding: 16, borderRadius: 8, width: 360 }}>
              <div>Enter PIN to view • {view.remaining}s</div>
              <input value={view.pin} onChange={e => setView(v => ({ ...v, pin: e.target.value }))} type="password" placeholder="PIN" style={{ width: '100%', padding: 8, marginTop: 8, background: '#0E1A24', color: '#C9A14A', border: '1px solid #C9A14A', borderRadius: 6 }} />
              <div style={{ marginTop: 12 }}>
                <button onClick={confirmPin} style={{ padding: '8px 16px', background: '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 6 }}>Unlock</button>
                <button onClick={() => setView({ open: false, blobId: '', sender: '', text: '', kind: 'text', b64: '', mime: '', ttlMs: 30000, remaining: 0, pin: '' })} style={{ marginLeft: 8, padding: '8px 16px', background: '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 6 }}>Dismiss</button>
              </div>
            </div>
          </div>
        ) : null}
        {attachB64 ? (
          <div style={{ marginTop: 8 }}>
            <div style={{ color: '#fff' }}>Attachment ready: {attachKind}</div>
            {attachKind === 'image' ? (
              <img src={`data:${attachMime};base64,${attachB64}`} alt="preview" style={{ maxWidth: '60%', borderRadius: 8 }} onContextMenu={e => e.preventDefault()} />
            ) : attachKind === 'video' ? (
              <video src={`data:${attachMime};base64,${attachB64}`} style={{ maxWidth: '60%', borderRadius: 8 }} onContextMenu={e => e.preventDefault()} />
            ) : attachKind === 'audio' ? (
              <audio src={`data:${attachMime};base64,${attachB64}`} />
            ) : null}
          </div>
        ) : null}
        <p style={{ color: '#fff', marginTop: 8 }}>Messages expire after viewing or 30s. Mode: {useServer ? 'Server' : 'Local'}</p>
        <div style={{ marginTop: 8 }}>
          <label style={{ color: '#fff' }}><input type="checkbox" checked={useServer} onChange={e => setUseServer(e.target.checked)} /> Use server relay</label>
        </div>
        <div style={{ marginTop: 16, paddingBottom: 100 }}>
          {list.length === 0 ? <p style={{ color: '#fff' }}>No messages</p> : null}
          {list.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: item.from === myId ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
              <div style={{ maxWidth: '70%', background: item.from === myId ? '#1b2a40' : '#102030', padding: 12, borderRadius: 12 }}>
                <div style={{ color: '#fff' }}><b>{item.from === myId ? 'You' : 'Peer'}</b></div>
                {item.kind === 'image' ? (
                  <img src={`data:${item.mime || 'image/png'};base64,${item.b64}`} alt="image" style={{ maxWidth: '100%', borderRadius: 8 }} onContextMenu={e => e.preventDefault()} />
                ) : item.kind === 'video' ? (
                  <video src={`data:${item.mime || 'video/mp4'};base64,${item.b64}`} style={{ width: '100%', borderRadius: 8 }} onContextMenu={e => e.preventDefault()} />
                ) : item.kind === 'audio' ? (
                  <audio src={`data:${item.mime || 'audio/webm'};base64,${item.b64}`} />
                ) : (
                  <div style={{ color: '#fff' }}>{item.text}</div>
                )}
                <div style={{ color: '#888', fontSize: 12 }}>ttl: {Math.floor((item.ttl - (Date.now() - item.ts)) / 1000)}s • {item.status === 'viewed' ? '✓✓' : item.status === 'delivered' ? '✓✓' : item.status === 'wrong_password' ? '✗' : '✓'}</div>
              <button onClick={() => viewMessage(item.id)} style={{ marginTop: 6, padding: '4px 8px', background: '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 6 }}>View (expire)</button>
              {item.from !== myId ? (
                <div style={{ marginTop: 8 }}>
                  <input value={replies[item.id] || ''} onChange={e => setReplies(prev => ({ ...prev, [item.id]: e.target.value }))} placeholder="reply within time" style={{ width: '60%', padding: 6 }} />
                  <button onClick={() => sendReply(item.from, item.id)} style={{ marginLeft: 8, padding: '6px 12px', background: '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 6 }}>Reply</button>
                </div>
              ) : null}
              </div>
            </div>
          ))}
        </div>
        {showReq.visible ? (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#102030', color: '#fff', padding: 16, borderRadius: 8, width: 360 }}>
              <div>Message request from {showReq.sender}</div>
              <div style={{ marginTop: 12 }}>
                <button onClick={async () => { await fetch(`/api/contacts/${myId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: showReq.sender }) }); setShowReq({ visible: false, sender: '', blobId: '' }) }} style={{ marginRight: 8, padding: '6px 12px', background: '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 6 }}>Save Contact</button>
                <button onClick={async () => { setShowReq({ visible: false, sender: '', blobId: '' }); const b = await fetch(`/api/blob/${showReq.blobId}`); if (b.ok) { const p = await b.json(); let text = ''; try { const o = JSON.parse(p.data); text = o.text } catch { text = String(p.data || '') } const item = { id: showReq.blobId, from: (p.from || 'peer'), to: myId, text, ts: Date.now(), ttl: 30000 }; setList(prev => { const next = [item, ...prev]; setLS('conv', next); return next }) } }} style={{ marginRight: 8, padding: '6px 12px', background: '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 6 }}>Accept</button>
                <button onClick={async () => { await fetch(`/api/ack/${showReq.sender}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blobId: showReq.blobId, reason: 'declined' }) }); await fetch(`/api/blob/${showReq.blobId}`); setShowReq({ visible: false, sender: '', blobId: '' }) }} style={{ padding: '6px 12px', background: '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 6 }}>Decline</button>
              </div>
            </div>
          </div>
        ) : null}
        <div style={{ height: 72 }}></div>
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', padding: 8, background: '#101010', borderTop: '1px solid #102030' }}>
          <input id="attach-file" type="file" accept="image/*,video/*" onChange={onAttachFile} style={{ display: 'none' }} />
          <label htmlFor="attach-file" style={{ padding: '6px 10px', background: '#1b2a40', color: '#C9A14A', borderRadius: 6, marginRight: 8 }}>+</label>
          <button onClick={startRecord} disabled={recording} style={{ padding: '6px 10px', background: recording ? '#777' : '#1b2a40', color: '#C9A14A', border: 'none', borderRadius: 6, marginRight: 8 }}>Mic</button>
          <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Type a message" style={{ flex: 1, padding: 8, background: '#0E1A24', color: '#C9A14A', border: '1px solid #102030', borderRadius: 20 }} />
          <select value={ttl} onChange={e => setTtl(e.target.value)} style={{ marginLeft: 8, padding: 8, background: '#0E1A24', color: '#C9A14A', border: '1px solid #102030', borderRadius: 12 }}>
            <option value="5">5s</option>
            <option value="15">15s</option>
            <option value="30">30s</option>
            <option value="60">1m</option>
            <option value="300">5m</option>
            <option value="86400">24h</option>
          </select>
          <button onClick={send} disabled={!peerAllowed} style={{ marginLeft: 8, padding: '8px 16px', background: peerAllowed ? '#C9A14A' : '#777', color: '#0E1A24', border: 'none', borderRadius: 20 }}>Send</button>
          <button onClick={() => setPayOpen(true)} disabled={!peerAllowed} style={{ marginLeft: 8, padding: '8px 12px', background: peerAllowed ? '#C9A14A' : '#777', color: '#0E1A24', border: 'none', borderRadius: 12 }}>Pay</button>
        </div>
      </div>
      </div>
    </main>
  )
}
