import { popAck, pushAck } from '../_relay_store'

export default async function handler(req, res) {
  const code = req.query.code
  if (req.method === 'GET') {
    const base = process.env.RELAY_BASE_URL
    if (base) {
      const r = await fetch(`${base}/ack/${code}`)
      if (r.status === 204) { res.status(204).end(); return }
      const j = await r.json(); res.status(r.ok ? 200 : 400).json(j); return
    }
    const a = popAck(code)
    if (!a) { res.status(204).end(); return }
    res.status(200).json(a)
    return
  }
  if (req.method === 'POST') {
    try {
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
      const { blobId, reason } = b
      const base = process.env.RELAY_BASE_URL
      if (base) {
        const r = await fetch(`${base}/ack/${code}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blobId, reason }) })
        const j = await r.json(); res.status(r.ok ? 200 : 400).json(j); return
      }
      pushAck(code, blobId || '', reason || 'wrong_password')
      res.status(200).json({ status: 'ok' })
    } catch { res.status(400).json({ error: 'bad_request' }) }
    return
  }
  res.status(405).end()
}
