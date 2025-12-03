import { addContact, getContacts } from '../_relay_store'

export default function handler(req, res) {
  const owner = req.query.owner
  if (req.method === 'GET') {
    res.status(200).json(getContacts(owner))
    return
  }
  if (req.method === 'POST') {
    try {
      const entry = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
      if (!entry.code) { res.status(400).json({ error: 'bad_request' }); return }
      const list = addContact(owner, { code: entry.code, alias: entry.alias || '' })
      res.status(200).json(list)
    } catch { res.status(400).json({ error: 'bad_request' }) }
    return
  }
  res.status(405).end()
}
