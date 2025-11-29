import { popInbox } from '../_relay_store'

export default function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).end(); return }
  const code = req.query.code
  const id = popInbox(code)
  if (!id) { res.status(204).end(); return }
  res.status(200).json({ id })
}
