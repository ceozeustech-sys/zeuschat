import { useEffect, useState } from 'react'
import HeaderBar from '../components/HeaderBar'

function genId() { let s = ''; for (let i = 0; i < 16; i++) s += Math.floor(Math.random() * 16).toString(16); return s }
function toB64(ab) { let s = ''; const bytes = new Uint8Array(ab); for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s) }
async function hashPin(pin) { try { const enc = new TextEncoder().encode('ZEUSPIN:' + pin); const d = await crypto.subtle.digest('SHA-256', enc); const b = toB64(d); return b } catch { return btoa('ZEUSPIN:' + pin) } }
function genZeusCode() { const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; const digits = '23456789'; function seg(len, set) { let s = ''; for (let i = 0; i < len; i++) s += set[Math.floor(Math.random() * set.length)]; return s } return `ZEUS-${seg(4, letters)}-${seg(4, digits)}` }

export default function Register() {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [avatarB64, setAvatarB64] = useState('')
  const [zeuscode, setZeuscode] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    try { const z = localStorage.getItem('zeuscode') || ''; if (z) setZeuscode(z) } catch {}
  }, [])

  function onAvatar(e) {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => setAvatarB64(String(r.result).split(',')[1] || '')
    r.readAsDataURL(f)
  }

  async function onRegister() {
    const z = zeuscode || genZeusCode(); setZeuscode(z)
    const c = z.replace(/-/g, '') + '-' + Math.floor(Math.random() * 1e6).toString(16)
    const ph = await hashPin(pin)
    let contact = { method: 'phone', phone: '' }
    try { contact = JSON.parse(localStorage.getItem('verified_contact') || '{}') } catch {}
    const phone = contact.method === 'phone' ? (contact.phone || '') : (`email:${contact.email || ''}`)
    const payload = { code: c, name, phone, passwordHashB64: ph, avatarB64 }
    const r = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const j = await r.json().catch(() => ({}))
    if (j.status === 'ok') {
      try { localStorage.setItem('device_id', c); localStorage.setItem('user_id', c); localStorage.setItem('zeuscode', z); localStorage.setItem('pin_hash', ph); localStorage.setItem('profile', JSON.stringify({ name, phone, avatarB64 })) } catch {}
      setStatus('registered')
      try { window.location.replace('/profile') } catch { window.location.href = '/profile' }
    } else setStatus('error')
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0E1A24', color: '#C9A14A' }}>
      <HeaderBar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 420 }}>
        <h2>Create Profile</h2>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" style={{ width: '100%', padding: 8 }} />
        <div style={{ marginTop: 8 }}>
          <input value={pin} onChange={e => setPin(e.target.value)} placeholder="Choose a 4-digit PIN" type="password" style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginTop: 8, color: '#fff' }}>Your ZeusCode: <b>{zeuscode || 'Tap Generate'}</b></div>
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setZeuscode(genZeusCode())} style={{ padding: '6px 12px', background: '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 6 }}>Generate</button>
        </div>
        <div style={{ marginTop: 8 }}>
          <input type="file" accept="image/*" onChange={onAvatar} />
        </div>
        <button onClick={onRegister} disabled={!name || !pin || !zeuscode} style={{ marginTop: 12, padding: '8px 16px', background: (!name || !pin || !zeuscode) ? '#777' : '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 6 }}>Create Account</button>
        {status === 'error' ? <p style={{ color: '#ff6' }}>Failed to create account</p> : null}
        {zeuscode ? <p style={{ color: '#fff' }}>Your ZeusCode: {zeuscode}</p> : null}
      </div>
      </div>
    </main>
  )
}
