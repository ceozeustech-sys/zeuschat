import { useEffect, useState } from 'react'
import HeaderBar from '../components/HeaderBar'

export default function Home() {
  const [canInstall, setCanInstall] = useState(false)
  const [evt, setEvt] = useState(null)
  useEffect(() => {
    try { const uid = localStorage.getItem('user_id') || ''; if (uid) { window.location.replace('/chats') } } catch {}
  }, [])
  useEffect(() => {
    function onBIP(e) { e.preventDefault(); setEvt(e); setCanInstall(true) }
    window.addEventListener('beforeinstallprompt', onBIP)
    try {
      if (window.deferredInstallPrompt || localStorage.getItem('install_ready') === '1') setCanInstall(true)
      if (window.deferredInstallPrompt) setEvt(window.deferredInstallPrompt)
    } catch {}
    return () => window.removeEventListener('beforeinstallprompt', onBIP)
  }, [])
  async function install() { if (!evt && window.deferredInstallPrompt) setEvt(window.deferredInstallPrompt); if (!evt) return; await evt.prompt(); setCanInstall(false); try { localStorage.removeItem('install_ready') } catch {} }
  function agree() { try { localStorage.setItem('agreed', '1') } catch {} ; try { window.location.replace('/verify') } catch { window.location.href = '/verify' } }
  return (
    <main style={{ minHeight: '100vh', background: '#000', color: '#C9A14A' }}>
      <HeaderBar />
      {canInstall ? (
        <div style={{ background: '#102030', color: '#fff', padding: 12, textAlign: 'center' }}>
          <span>Install ZeusChat</span>
          <button onClick={install} style={{ marginLeft: 12, padding: '6px 12px', background: '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 6 }}>Install</button>
        </div>
      ) : null}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 520, textAlign: 'center', paddingTop: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 120, borderRadius: 60, background: '#C9A14A' }}>
            <img src="/icons/icon-192x192.png" alt="ZeusChat" width="84" height="84" style={{ borderRadius: 16 }} />
          </div>
          <h1 style={{ marginTop: 12 }}>Welcome to ZeusChat</h1>
          <p style={{ marginTop: 8, color: '#fff' }}>Read our Privacy Policy. Tap ‘Agree & continue’ to accept the Terms of Service.</p>
          <div style={{ marginTop: 16 }}>
            <button onClick={agree} style={{ padding: '10px 18px', background: '#25D366', color: '#0E1A24', border: 'none', borderRadius: 8 }}>Agree & Continue</button>
          </div>
        </div>
      </div>
    </main>
  )
}
