export function startEmergencyWatcher() {
  try { localStorage.removeItem('disaster_mode') } catch {}
  let offlineSince = 0
  function onOffline() { offlineSince = Date.now() }
  function onOnline() { offlineSince = 0; try { localStorage.removeItem('disaster_mode') } catch {} }
  window.addEventListener('offline', onOffline)
  window.addEventListener('online', onOnline)
  const t = setInterval(() => {
    if (!navigator.onLine) {
      if (!offlineSince) offlineSince = Date.now()
      const mins = (Date.now() - offlineSince) / 60000
      if (mins >= 5) {
        try { localStorage.setItem('disaster_mode', '1'); localStorage.setItem('meshEnabled', '1'); localStorage.setItem('sos_broadcast', JSON.stringify({ ts: Date.now() })) } catch {}
      }
    }
  }, 10000)
  return () => { clearInterval(t); window.removeEventListener('offline', onOffline); window.removeEventListener('online', onOnline) }
}
