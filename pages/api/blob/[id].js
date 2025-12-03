import { getOnce } from '../_relay_store'

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).end(); return }
  const id = req.query.id
  const base = process.env.RELAY_BASE_URL
  if (base) {
    const r = await fetch(`${base}/blob/${id}`)
    if (!r.ok) { res.status(r.status).end(); return }
    const j = await r.json()
    res.status(200).json(j)
    return
  }
  const payload = getOnce(id)
  if (!payload) { res.status(404).end(); return }
  res.status(200).json(payload)
}
