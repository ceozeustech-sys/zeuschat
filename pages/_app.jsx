import { useEffect } from 'react'
import { startEmergencyWatcher } from '../utils/emergency'

export default function App({ Component, pageProps }) {
  useEffect(() => {
    try {
      const uid = localStorage.getItem('user_id') || ''
      const path = typeof window !== 'undefined' ? (window.location && window.location.pathname) || '/' : '/'
      const exempt = ['/', '/verify', '/register', '/_offline']
      if (!uid && !exempt.includes(path) && !path.startsWith('/api/')) {
        window.location.href = '/register'
        return
      }
    } catch {}
    function mark() { try { localStorage.setItem('screenshot_attempt', JSON.stringify({ ts: Date.now() })) } catch {} }
    function onKey(e) {
      const macShot = e.metaKey && e.shiftKey && e.key === '4'
      const prtsc = e.key && e.key.toLowerCase().includes('printscreen')
      if (macShot || prtsc) { mark(); try { document.exitFullscreen && document.exitFullscreen() } catch {} }
    }
    function onFull() { if (document.fullscreenElement) { mark() } }
    document.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFull)
    const stop = startEmergencyWatcher()
    async function registerSW() {
      try {
        const mod = await import('workbox-window')
        const WB = mod.Workbox
        if (WB) { const wb = new WB('/sw.js'); wb.register(); return }
      } catch {}
      try { if ('serviceWorker' in navigator) { await navigator.serviceWorker.register('/sw.js', { scope: '/' }) } } catch {}
    }
    registerSW()
    function onBIP(e) {
      try { e.preventDefault(); window.deferredInstallPrompt = e; localStorage.setItem('install_ready', '1') } catch {}
    }
    window.addEventListener('beforeinstallprompt', onBIP)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('fullscreenchange', onFull); try { stop && stop() } catch {} }
  }, [])
  return <Component {...pageProps} />
}
