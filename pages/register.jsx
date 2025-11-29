import { useState } from 'react'

function genId() { let s = ''; for (let i = 0; i < 16; i++) s += Math.floor(Math.random() * 16).toString(16); return s }
function b64(s) { if (typeof window === 'undefined') return ''; return btoa(s) }

export default function Register() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [pass, setPass] = useState('')
  const [avatarB64, setAvatarB64] = useState('')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('')

  function onAvatar(e) {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => setAvatarB64(String(r.result).split(',')[1] || '')
    r.readAsDataURL(f)
  }

  async function onRegister() {
    const c = genId(); setCode(c)
    const payload = { code: c, name, phone, passwordHashB64: b64(pass), avatarB64 }
    const r = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const j = await r.json()
    if (j.status === 'ok') {
      localStorage.setItem('device_id', c)
      localStorage.setItem('profile', JSON.stringify({ name, phone, avatarB64 }))
      setStatus('registered')
    } else setStatus('error')
  }

  return (
    <main style={{ display: 'flex', minHeight: '100vh', background: '#0E1A24', color: '#C9A14A', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 420 }}>
        <h2>Register</h2>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" style={{ width: '100%', padding: 8 }} />
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telephone" style={{ width: '100%', padding: 8, marginTop: 8 }} />
        <input value={pass} onChange={e => setPass(e.target.value)} placeholder="Password" type="password" style={{ width: '100%', padding: 8, marginTop: 8 }} />
        <div style={{ marginTop: 8 }}>
          <input type="file" accept="image/*" onChange={onAvatar} />
        </div>
        <button onClick={onRegister} style={{ marginTop: 12, padding: '8px 16px', background: '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 6 }}>Create Account</button>
        {code ? <p style={{ color: '#fff' }}>Your code: {code}</p> : null}
        <div style={{ marginTop: 12 }}><a href="/profile" style={{ color: '#C9A14A', textDecoration: 'underline' }}>Go to Profile</a></div>
      </div>
    </main>
  )
}
