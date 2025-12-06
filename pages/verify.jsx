import { useState } from 'react'
import HeaderBar from '../components/HeaderBar'

function genZeusCode() { const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; const digits = '23456789'; function seg(len, set) { let s = ''; for (let i = 0; i < len; i++) s += set[Math.floor(Math.random() * set.length)]; return s } return `ZEUS-${seg(4, letters)}-${seg(4, digits)}` }

export default function Verify() {
  const [method, setMethod] = useState('phone')
  const [country, setCountry] = useState({ flag: '🇿🇦', code: '+27' })
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [sentCode, setSentCode] = useState('')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('')
  const [verified, setVerified] = useState(false)
  const [zeuscode, setZeuscode] = useState('')

  const countries = [
    { flag: '🇿🇦', code: '+27' },
    { flag: '🇳🇬', code: '+234' },
    { flag: '🇰🇪', code: '+254' },
    { flag: '🇺🇸', code: '+1' }
  ]

  async function onSend() {
    setStatus('sending')
    let r
    if (method === 'phone') {
      const full = `${country.code}${phone}`
      try { r = await fetch('/api/sms/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: full }) }) } catch {}
    } else {
      try { r = await fetch('/api/email/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }) } catch {}
    }
    try {
      const j = await r.json().catch(() => ({}))
      const c = j.code || String(Math.floor(100000 + Math.random() * 900000))
      setSentCode(c)
      setStatus('code_sent')
    } catch {
      const c = String(Math.floor(100000 + Math.random() * 900000))
      setSentCode(c)
      setStatus('code_sent')
    }
  }

  async function onVerify() {
    let r
    if (method === 'phone') {
      const full = `${country.code}${phone}`
      try { r = await fetch('/api/sms/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: full, code }) }) } catch {}
    } else {
      try { r = await fetch('/api/email/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) }) } catch {}
    }
    try {
      const j = await r.json()
      const ok = j.status === 'ok'
      setVerified(ok)
      setStatus(ok ? 'verified' : 'invalid')
      if (ok) {
        const z = genZeusCode()
        setZeuscode(z)
        try { localStorage.setItem('zeuscode', z) } catch {}
        try { localStorage.setItem('verified_contact', JSON.stringify(method === 'phone' ? { method, phone: `${country.code}${phone}` } : { method, email })) } catch {}
      }
    } catch { setVerified(false); setStatus('invalid') }
  }

  function continueNext() { try { window.location.replace('/register') } catch { window.location.href = '/register' } }

  return (
    <main style={{ minHeight: '100vh', background: '#0E1A24', color: '#C9A14A' }}>
      <HeaderBar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 420 }}>
        <h2>Verify Identity</h2>
        <div style={{ marginTop: 8, color: '#fff' }}>
          <label><input type="radio" checked={method==='phone'} onChange={() => setMethod('phone')} /> Phone</label>
          <label style={{ marginLeft: 12 }}><input type="radio" checked={method==='email'} onChange={() => setMethod('email')} /> Email</label>
        </div>
        {method === 'phone' ? (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <select value={country.code} onChange={e => setCountry(countries.find(x => x.code === e.target.value) || countries[0])} style={{ padding: 8, background: '#101820', color: '#C9A14A', border: '1px solid #C9A14A', borderRadius: 6 }}>
                {countries.map(c => (<option key={c.code} value={c.code}>{c.flag} {c.code}</option>))}
              </select>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" style={{ flex: 1, padding: 8, marginLeft: 8 }} />
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 8 }}>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" style={{ width: '100%', padding: 8 }} />
          </div>
        )}
        <div style={{ marginTop: 8 }}>
          <button onClick={onSend} style={{ padding: '8px 16px', background: '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 6 }}>Send Code</button>
        </div>
        {status === 'code_sent' ? (
          <div style={{ marginTop: 8, padding: 12, background: '#102030', color: '#fff', borderRadius: 8 }}>
            <div>Verification code: <b>{sentCode || '(check your inbox)'}</b></div>
          </div>
        ) : null}
        <div style={{ marginTop: 8 }}>
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="Enter verification code" style={{ width: '60%', padding: 8 }} />
          <button onClick={onVerify} style={{ marginLeft: 8, padding: '6px 12px', background: '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 6 }}>Verify</button>
          <span style={{ marginLeft: 8, color: verified ? '#0f0' : '#f00' }}>{verified ? 'Verified' : 'Not verified'}</span>
        </div>
        {zeuscode ? <div style={{ marginTop: 8, color: '#fff' }}>Your ZeusCode: <b>{zeuscode}</b></div> : null}
        <div style={{ marginTop: 12 }}>
          <button onClick={continueNext} disabled={!verified} style={{ padding: '8px 16px', background: verified ? '#25D366' : '#777', color: '#0E1A24', border: 'none', borderRadius: 8 }}>Continue</button>
        </div>
      </div>
      </div>
    </main>
  )
}
