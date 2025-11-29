import { popInbox, peekBlob, pushAck } from '../_relay_store'

export default function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).end(); return }
  const code = req.query.code
  const id = popInbox(code)
  if (!id) { res.status(204).end(); return }
  const payload = peekBlob(id)
  try { const from = payload && payload.from; if (from) pushAck(from, id, 'delivered') } catch {}
  res.status(200).json({ id })
}
