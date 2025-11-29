import { sendTo } from './_relay_store'

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return }
  try {
    const { device_id, data, ttl_ms } = JSON.parse(req.body || '{}')
    if (!device_id || !data) { res.status(400).json({ error: 'bad_request' }); return }
    const id = sendTo(device_id, { data, ts: Date.now() }, ttl_ms || 30000)
    res.status(200).json({ id })
  } catch {
    res.status(400).json({ error: 'bad_request' })
  }
}
