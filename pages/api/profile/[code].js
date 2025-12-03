import { getUser, setProfile } from '../_relay_store'

export default function handler(req, res) {
  const code = req.query.code
  if (req.method === 'GET') {
    const u = getUser(code)
    if (!u) { res.status(404).end(); return }
    res.status(200).json(u)
    return
  }
  if (req.method === 'PUT') {
    try {
      const patch = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
      const nu = setProfile(code, patch)
      res.status(200).json(nu)
    } catch { res.status(400).json({ error: 'bad_request' }) }
    return
  }
  res.status(405).end()
}
