import { useEffect, useState } from 'react'
import HeaderBar from '../components/HeaderBar'

function genZeusCode() { const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; const digits = '23456789'; function seg(len, set) { let s = ''; for (let i = 0; i < len; i++) s += set[Math.floor(Math.random() * set.length)]; return s } return `ZEUS-${seg(4, letters)}-${seg(4, digits)}` }

function Avatar({ b64, name }) {
  const initials = (name || 'Z C').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
  const src = b64 ? `data:image/png;base64,${b64}` : ''
  return (
    <div style={{ width: 96, height: 96, borderRadius: 96, background: '#1b2a40', border: '2px solid #C9A14A', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {src ? (<img src={src} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : (
        <div style={{ color: '#C9A14A', fontWeight: 700 }}>{initials}</div>
      )}
    </div>
  )
}

export default function Profile() {
  const [profile, setProfile] = useState({ name: '', phone: '', avatarB64: '', status: 'available', lang: 'EN', disappearing: '24h', customNotif: true, mute: 'off', mediaVisible: true })
  const [status, setStatus] = useState('')
  const [zeuscode, setZeuscode] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchHits, setSearchHits] = useState([])

  useEffect(() => {
    try { const z = localStorage.getItem('zeuscode') || ''; setZeuscode(z) } catch {}
    ;(async () => {
      try {
        const id = localStorage.getItem('zeuscode') || ''
        if (!id) return
        const r = await fetch(`/api/profile/${id}`)
        if (r.ok) { const j = await r.json(); setProfile(p => ({ ...p, ...j })) }
      } catch {}
    })()
  }, [])

  function onAvatar(e) {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => setProfile(p => ({ ...p, avatarB64: String(r.result).split(',')[1] || '' }))
    r.readAsDataURL(f)
  }

  async function save() {
    if (!zeuscode) return
    const r = await fetch(`/api/profile/${zeuscode}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) })
    if (r.ok) { setStatus('saved'); localStorage.setItem('profile', JSON.stringify(profile)) } else setStatus('error')
  }

  async function saveContact() {
    if (!zeuscode) return
    try { await fetch(`/api/contacts/${zeuscode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: zeuscode || profile.phone || zeuscode }) }) } catch {}
  }

  function runSearch() {
    try {
      const conv = JSON.parse(localStorage.getItem('conv') || '[]')
      const q = (searchQ || '').toLowerCase()
      const hits = conv.filter(m => (m.text || '').toLowerCase().includes(q))
      setSearchHits(hits.slice(0, 20))
    } catch { setSearchHits([]) }
  }

  function makeBtn(icon, label, onClick) {
    return (
      <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#102030', color: '#C9A14A', border: '1px solid #1b2a40', borderRadius: 8 }}>
        {icon}
        <span>{label}</span>
      </button>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0E1A24', color: '#C9A14A' }}>
      <HeaderBar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar b64={profile.avatarB64} name={profile.name} />
          <div>
            <div style={{ fontSize: 20, color: '#fff', fontWeight: 600 }}>{profile.name || 'Your Name'}</div>
            <div style={{ color: '#aaa', marginTop: 4 }}>{zeuscode || '(no ZeusCode)'}</div>
            <div style={{ marginTop: 8 }}>
              <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Full Name" style={{ width: 280, padding: 8, background: '#0E1A24', color: '#C9A14A', border: '1px solid #1b2a40', borderRadius: 6 }} />
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {makeBtn(
            (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 2h4l2 4-3 3c1.5 3 4 5 7 6l3-3 4 2v4c0 1.1-.9 2-2 2-9.4 0-17-7.6-17-17 0-1.1.9-2 2-2z" fill="#C9A14A"/></svg>),
            'Call',
            () => { const tel = profile.phone || ''; if (tel) window.location.href = `tel:${tel}` }
          )}
          {makeBtn(
            (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="14" height="14" stroke="#C9A14A"/><path d="M21 7l-4 3v4l4 3V7z" fill="#C9A14A"/></svg>),
            'Video',
            async () => { try { await navigator.mediaDevices.getUserMedia({ video: true, audio: true }) } catch {} }
          )}
          {makeBtn(
            (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2l4 4-8 8H4V10l8-8z" fill="#C9A14A"/></svg>),
            'Save',
            saveContact
          )}
          {makeBtn(
            (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="10" cy="10" r="6" stroke="#C9A14A"/><path d="M14 14l6 6" stroke="#C9A14A"/></svg>),
            'Search',
            () => { setSearchOpen(true) }
          )}
        </div>

        <div style={{ marginTop: 20, background: '#102030', borderRadius: 12, padding: 12, border: '1px solid #1b2a40' }}>
          <div style={{ color: '#fff', fontWeight: 600 }}>Disappearing messages</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
            <label style={{ color: '#fff' }}><input type="radio" name="dis" checked={profile.disappearing === '24h'} onChange={() => setProfile({ ...profile, disappearing: '24h' })} /> 24 hours</label>
            <label style={{ color: '#fff' }}><input type="radio" name="dis" checked={profile.disappearing === '7d'} onChange={() => setProfile({ ...profile, disappearing: '7d' })} /> 7 days</label>
            <label style={{ color: '#fff' }}><input type="radio" name="dis" checked={profile.disappearing === 'off'} onChange={() => setProfile({ ...profile, disappearing: 'off' })} /> Off</label>
          </div>
        </div>

        <div style={{ marginTop: 12, background: '#102030', borderRadius: 12, padding: 12, border: '1px solid #1b2a40' }}>
          <div style={{ color: '#fff', fontWeight: 600 }}>Custom notifications</div>
          <label style={{ color: '#fff', marginTop: 8, display: 'block' }}><input type="checkbox" checked={!!profile.customNotif} onChange={e => setProfile({ ...profile, customNotif: e.target.checked })} /> Enable</label>
        </div>

        <div style={{ marginTop: 12, background: '#102030', borderRadius: 12, padding: 12, border: '1px solid #1b2a40' }}>
          <div style={{ color: '#fff', fontWeight: 600 }}>Mute notifications</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
            <label style={{ color: '#fff' }}><input type="radio" name="mute" checked={profile.mute === '8h'} onChange={() => setProfile({ ...profile, mute: '8h' })} /> 8 hours</label>
            <label style={{ color: '#fff' }}><input type="radio" name="mute" checked={profile.mute === '1w'} onChange={() => setProfile({ ...profile, mute: '1w' })} /> 1 week</label>
            <label style={{ color: '#fff' }}><input type="radio" name="mute" checked={profile.mute === 'always'} onChange={() => setProfile({ ...profile, mute: 'always' })} /> Always</label>
            <label style={{ color: '#fff' }}><input type="radio" name="mute" checked={profile.mute === 'off'} onChange={() => setProfile({ ...profile, mute: 'off' })} /> Off</label>
          </div>
        </div>

        <div style={{ marginTop: 12, background: '#102030', borderRadius: 12, padding: 12, border: '1px solid #1b2a40' }}>
          <div style={{ color: '#fff', fontWeight: 600 }}>Media visibility</div>
          <label style={{ color: '#fff', marginTop: 8, display: 'block' }}><input type="checkbox" checked={!!profile.mediaVisible} onChange={e => setProfile({ ...profile, mediaVisible: e.target.checked })} /> Show media in gallery</label>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button onClick={save} style={{ padding: '8px 12px', background: '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 6 }}>Save</button>
          <a href="/contacts" style={{ padding: '8px 12px', background: '#102030', color: '#C9A14A', border: '1px solid #1b2a40', borderRadius: 6, textDecoration: 'none' }}>Manage Contacts</a>
        </div>

        {status ? <p style={{ color: '#fff', marginTop: 8 }}>{status}</p> : null}

        {searchOpen ? (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#102030', color: '#fff', padding: 16, borderRadius: 8, width: 420 }}>
              <div style={{ fontWeight: 600 }}>Search in chat</div>
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="type to search" style={{ width: '100%', padding: 8, marginTop: 8, background: '#0E1A24', color: '#C9A14A', border: '1px solid #1b2a40', borderRadius: 6 }} />
              <div style={{ marginTop: 8 }}>
                <button onClick={runSearch} style={{ padding: '6px 12px', background: '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 6 }}>Search</button>
                <button onClick={() => { setSearchOpen(false); setSearchHits([]); setSearchQ('') }} style={{ marginLeft: 8, padding: '6px 12px', background: '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 6 }}>Close</button>
              </div>
              <div style={{ marginTop: 12, maxHeight: 240, overflowY: 'auto' }}>
                {searchHits.length === 0 ? <div style={{ color: '#aaa' }}>No results</div> : null}
                {searchHits.map(h => (
                  <div key={h.id} style={{ padding: 8, borderBottom: '1px solid #1b2a40' }}>
                    <div style={{ color: '#C9A14A' }}>{h.from === code ? 'You' : 'Peer'}</div>
                    <div style={{ color: '#fff' }}>{h.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}
