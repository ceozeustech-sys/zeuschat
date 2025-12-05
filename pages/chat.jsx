import { useEffect, useState } from 'react'
import HeaderBar from '../components/HeaderBar'

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
  const [peerAllowed, setPeerAllowed] = useState(true)
  const [warn, setWarn] = useState('')

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
    const ttlMs = Math.min(30000, Math.max(10000, parseInt(ttl || '30', 10) * 1000))
    if (useServer) {
      let dataObj = { kind: 'text', text: msg }
      if (attachB64 && attachKind) dataObj = { kind: attachKind, b64: attachB64, mime: attachMime }
      const payload = { device_id: peerId, data: JSON.stringify(dataObj), ttl_ms: ttlMs, from: myId }
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

  function view(id) { expire(id) }

  useEffect(() => {
    const t = setInterval(async () => {
      if (!useServer || !myId) return
      try {
        const r = await fetch(`/api/inbox/${myId}`)
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
            try { const o = JSON.parse(p.data); text = o.text; const sender2 = p.from || 'peer';
              const entered = prompt('Enter your viewing password to open:') || ''
              if (btoa(entered) !== myPassHash) {
                await fetch(`/api/ack/${sender2}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blobId: j.id, reason: 'wrong_password' }) })
                return
              } else {
                await fetch(`/api/ack/${sender2}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blobId: j.id, reason: 'viewed' }) })
              }
            } catch { text = String(p.data || ''); }
            let kind = 'text', b64 = '', mime = ''
            try { const o2 = JSON.parse(p.data); kind = o2.kind || 'text'; b64 = o2.b64 || ''; mime = o2.mime || ''; text = o2.text || text } catch {}
            const item = { id: j.id, from: (p.from || peerId || 'peer'), to: myId, text, kind, b64, mime, ts: Date.now(), ttl: 30000 }
            setList(prev => { const next = [item, ...prev]; setLS('conv', next); return next })
            setTimeout(() => expire(item.id), item.ttl)
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
    const ttlMs = Math.min(30000, Math.max(10000, parseInt(ttl || '30', 10) * 1000))
    if (useServer) {
      const payload = { device_id: targetCode, data: JSON.stringify({ text: body }), ttl_ms: ttlMs, from: myId }
      const r = await fetch('/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await r.json()
      const item = { id: j.id || genId(), from: myId, to: targetCode, text: body, ts: Date.now(), ttl: ttlMs, status: 'sent' }
      setList(prev => { const next = [item, ...prev]; setLS('conv', next); return next })
      setReplies(prev => ({ ...prev, [originalId]: '' }))
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0E1A24', color: '#C9A14A' }}>
      <HeaderBar />
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
      <div style={{ flex: 1, padding: 16 }}>
        <h2>ZeusChat</h2>
        <p style={{ color: '#fff' }}>Your ID: {myId} • Relay: {relayOk ? 'OK' : 'Offline'}</p>
        <label style={{ color: '#fff' }}>Peer ID</label>
        <input value={peerId} onChange={e => savePeer(e.target.value)} placeholder="friend's device id" style={{ width: '100%', padding: 8 }} />
        <div style={{ marginTop: 12 }}>
          <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="type a message" style={{ width: '50%', padding: 8 }} />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="message password" type="password" style={{ width: '20%', padding: 8, marginLeft: 8 }} />
          <select value={ttl} onChange={e => setTtl(e.target.value)} style={{ marginLeft: 8, padding: 8 }}>
            <option value="10">10s</option>
            <option value="20">20s</option>
            <option value="30">30s</option>
          </select>
          <button onClick={send} disabled={!peerAllowed} style={{ marginLeft: 8, padding: '8px 16px', background: peerAllowed ? '#C9A14A' : '#777', color: '#0E1A24', border: 'none', borderRadius: 6 }}>Send</button>
          {warn ? <span style={{ marginLeft: 8, color: '#ff6' }}>{warn}</span> : null}
        </div>
        <div style={{ marginTop: 8 }}>
          <input type="file" accept="image/*,video/*" onChange={onAttachFile} />
          <button onClick={startRecord} disabled={recording} style={{ marginLeft: 8, padding: '6px 12px', background: recording ? '#777' : '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 6 }}>Record voice ≤30s</button>
        </div>
        {attachB64 ? (
          <div style={{ marginTop: 8 }}>
            <div style={{ color: '#fff' }}>Attachment ready: {attachKind}</div>
            {attachKind === 'image' ? (
              <img src={`data:${attachMime};base64,${attachB64}`} alt="preview" style={{ maxWidth: '60%', borderRadius: 8 }} />
            ) : attachKind === 'video' ? (
              <video src={`data:${attachMime};base64,${attachB64}`} controls style={{ maxWidth: '60%', borderRadius: 8 }} />
            ) : attachKind === 'audio' ? (
              <audio src={`data:${attachMime};base64,${attachB64}`} controls />
            ) : null}
          </div>
        ) : null}
        <p style={{ color: '#fff', marginTop: 8 }}>Messages expire after viewing or 30s. Mode: {useServer ? 'Server' : 'Local'}</p>
        <div style={{ marginTop: 8 }}>
          <label style={{ color: '#fff' }}><input type="checkbox" checked={useServer} onChange={e => setUseServer(e.target.checked)} /> Use server relay</label>
        </div>
        <div style={{ marginTop: 16 }}>
          {list.length === 0 ? <p style={{ color: '#fff' }}>No messages</p> : null}
          {list.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: item.from === myId ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
              <div style={{ maxWidth: '70%', background: item.from === myId ? '#1b2a40' : '#102030', padding: 12, borderRadius: 12 }}>
                <div style={{ color: '#fff' }}><b>{item.from === myId ? 'You' : 'Peer'}</b></div>
                {item.kind === 'image' ? (
                  <img src={`data:${item.mime || 'image/png'};base64,${item.b64}`} alt="image" style={{ maxWidth: '100%', borderRadius: 8 }} />
                ) : item.kind === 'video' ? (
                  <video src={`data:${item.mime || 'video/mp4'};base64,${item.b64}`} controls style={{ width: '100%', borderRadius: 8 }} />
                ) : item.kind === 'audio' ? (
                  <audio src={`data:${item.mime || 'audio/webm'};base64,${item.b64}`} controls />
                ) : (
                  <div style={{ color: '#fff' }}>{item.text}</div>
                )}
                <div style={{ color: '#888', fontSize: 12 }}>ttl: {Math.floor((item.ttl - (Date.now() - item.ts)) / 1000)}s • {item.status === 'viewed' ? '✓✓' : item.status === 'delivered' ? '✓✓' : item.status === 'wrong_password' ? '✗' : '✓'}</div>
              <button onClick={() => view(item.id)} style={{ marginTop: 6, padding: '4px 8px', background: '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 6 }}>View (expire)</button>
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
        <div style={{ marginTop: 18 }}>
          <a href="/" style={{ color: '#C9A14A', textDecoration: 'underline' }}>Home</a>
        </div>
      </div>
      </div>
    </main>
  )
}
