import { useEffect, useState } from 'react'
import HeaderBar from '../components/HeaderBar'

export default function Home() {
  const [step, setStep] = useState('welcome')
  const [method, setMethod] = useState('phone')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('+234')
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [relayOk, setRelayOk] = useState(false)

  useEffect(() => { (async () => { try { const r = await fetch('/api/relay/test'); setRelayOk(r.ok) } catch { setRelayOk(false) } })() }, [])

  const flags = [
    { label: 'Nigeria', code: '+234', emoji: '🇳🇬' },
    { label: 'Ghana', code: '+233', emoji: '🇬🇭' },
    { label: 'Kenya', code: '+254', emoji: '🇰🇪' },
    { label: 'South Africa', code: '+27', emoji: '🇿🇦' },
    { label: 'Egypt', code: '+20', emoji: '🇪🇬' },
    { label: 'Other', code: '', emoji: '🌍' }
  ]

  function agree() { setStep('input') }

  function genCode() {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const digits = '23456789'
    function seg(len, set) { let s = ''; for (let i = 0; i < len; i++) s += set[Math.floor(Math.random() * set.length)]; return s }
    const c = `${seg(3, letters)}-${seg(3, digits)}-${seg(3, letters)}`
    setCode(c)
    setStep('code')
  }

  async function copy() {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600) } catch {}
  }

  function startChatting() {
    const id = code.replace(/-/g, '') + '-' + Math.floor(Math.random() * 1e6).toString(16)
    try { localStorage.setItem('device_id', id); localStorage.setItem('display_code', code) } catch {}
    location.href = '/contacts'
  }

  return (
    <main style={{ minHeight: '100vh', background: '#000', color: '#C9A14A' }}>
      <HeaderBar />
      {step === 'welcome' ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 520, textAlign: 'center', paddingTop: 40 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 140, height: 140, borderRadius: 70, background: '#C9A14A' }}>
              <img src="/icons/icon-192x192.png" alt="ZeusChat" width="96" height="96" style={{ borderRadius: 18 }} />
            </div>
            <h1 style={{ marginTop: 16 }}>ZeusChat</h1>
            <p style={{ color: '#fff' }}>Messages you see — then they’re gone • by ZEUSTECH</p>
            <div style={{ marginTop: 18 }}>
              <button onClick={agree} style={{ padding: '12px 28px', background: '#1DB954', color: '#0E1A24', borderRadius: 8, fontWeight: 700, border: 'none' }}>Agree & Continue</button>
            </div>
            <div style={{ marginTop: 12, color: '#fff', fontSize: 12 }}>
              Read our <a href="/privacy" style={{ color: '#C9A14A' }}>Privacy Policy</a>. Tap ‘Agree & continue’ to accept the <a href="/terms" style={{ color: '#C9A14A' }}>Terms of Service</a>.
            </div>
            <div style={{ marginTop: 10, color: '#fff', fontSize: 12 }}>Relay: {relayOk ? 'OK' : 'Offline'}</div>
          </div>
        </div>
      ) : null}

      {step === 'input' ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 520, paddingTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <button onClick={() => setMethod('phone')} style={{ padding: '8px 12px', marginRight: 8, background: method === 'phone' ? '#C9A14A' : '#101010', color: method === 'phone' ? '#0E1A24' : '#C9A14A', border: 'none', borderRadius: 6 }}>Phone</button>
              <button onClick={() => setMethod('email')} style={{ padding: '8px 12px', background: method === 'email' ? '#C9A14A' : '#101010', color: method === 'email' ? '#0E1A24' : '#C9A14A', border: 'none', borderRadius: 6 }}>Email</button>
            </div>
            {method === 'phone' ? (
              <div style={{ background: '#101010', padding: 12, borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <select value={country} onChange={e => setCountry(e.target.value)} style={{ background: '#0E1A24', color: '#C9A14A', border: '1px solid #C9A14A', borderRadius: 6, padding: '8px 6px', marginRight: 8 }}>
                    {flags.map(f => (<option key={f.code + f.label} value={f.code}>{f.emoji} {f.label} {f.code}</option>))}
                  </select>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" style={{ flex: 1, background: '#0E1A24', color: '#C9A14A', border: '1px solid #C9A14A', borderRadius: 6, padding: '10px 12px' }} />
                </div>
              </div>
            ) : (
              <div style={{ background: '#101010', padding: 12, borderRadius: 8 }}>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" style={{ width: '100%', background: '#0E1A24', color: '#C9A14A', border: '1px solid #C9A14A', borderRadius: 6, padding: '10px 12px' }} />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <button onClick={genCode} style={{ padding: '12px 28px', background: '#C9A14A', color: '#0E1A24', borderRadius: 8, fontWeight: 700, border: 'none' }}>Get Code</button>
            </div>
          </div>
        </div>
      ) : null}

      {step === 'code' ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 520, textAlign: 'center', paddingTop: 32 }}>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: 2 }}>{code}</div>
            <div style={{ marginTop: 10, color: '#fff' }}>Share this code with your contacts to start chatting securely.</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
              <button onClick={copy} style={{ padding: '10px 16px', background: '#101010', color: '#C9A14A', border: '1px solid #C9A14A', borderRadius: 8, marginRight: 8 }}>{copied ? 'Copied' : 'Copy Code'}</button>
              <button onClick={startChatting} style={{ padding: '10px 16px', background: '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 8 }}>Start Chatting</button>
            </div>
          </div>
        </div>
      ) : null}

      {step !== 'welcome' ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ marginTop: 24 }}>
            <a href="/register" style={{ color: '#C9A14A', textDecoration: 'underline', marginRight: 12 }}>Get Started</a>
            <a href="/chats" style={{ color: '#C9A14A', textDecoration: 'underline', marginRight: 12 }}>Chats</a>
            <a href="/about" style={{ color: '#C9A14A', textDecoration: 'underline', marginRight: 12 }}>About</a>
            <a href="/privacy" style={{ color: '#C9A14A', textDecoration: 'underline', marginRight: 12 }}>Privacy</a>
            <a href="/terms" style={{ color: '#C9A14A', textDecoration: 'underline', marginRight: 12 }}>Terms</a>
            <a href="/acceptable" style={{ color: '#C9A14A', textDecoration: 'underline' }}>Policy</a>
          </div>
        </div>
      ) : null}
    </main>
  )
}
