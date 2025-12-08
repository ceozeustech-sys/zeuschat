import { sendTo } from './_relay_store'

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return }
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
    const { to_zeuscode, device_id, data, ttl_ms, from } = b
    const to = to_zeuscode || device_id
    if (!to || !data) { res.status(400).json({ error: 'bad_request' }); return }
    const base = process.env.RELAY_BASE_URL
    if (base) {
      const r = await fetch(`${base}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, data, ttl_ms: ttl_ms || 30000, from: from || '' }) })
      const j = await r.json()
      res.status(r.ok ? 200 : 400).json(j)
      return
    }
    const id = sendTo(to, { data, ts: Date.now(), from: from || '' }, ttl_ms || 30000)
    res.status(200).json({ id })
  } catch {
    res.status(400).json({ error: 'bad_request' })
  }
}
