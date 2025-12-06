import { popInbox, peekBlob, pushAck } from '../_relay_store'
import { getUser } from '../_relay_store'

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).end(); return }
  const code = req.query.code
  const pinHash = req.headers['x-pin-hash'] || ''
  try {
    const u = getUser(code)
    if (!u || !u.passwordHashB64 || String(u.passwordHashB64) !== String(pinHash)) {
      const id = popInbox(code)
      if (id) { try { const payload = peekBlob(id); const from = payload && payload.from; if (from) pushAck(from, id, 'wrong_password') } catch {} }
      res.status(403).json({ error: 'forbidden' }); return
    }
  } catch {}
  const base = process.env.RELAY_BASE_URL
  if (base) {
    const r = await fetch(`${base}/inbox/${code}`, { headers: { 'x-pin-hash': String(pinHash) } })
    if (r.status === 204) { res.status(204).end(); return }
    const j = await r.json()
    res.status(r.ok ? 200 : 400).json(j)
    return
  }
  const id = popInbox(code)
  if (!id) { res.status(204).end(); return }
  const payload = peekBlob(id)
  try { const from = payload && payload.from; if (from) pushAck(from, id, 'delivered') } catch {}
  res.status(200).json({ id })
}
