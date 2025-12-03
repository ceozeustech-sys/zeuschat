import { verifyEmail } from '../_relay_store'

export default function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return }
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
    const { email, code } = b
    if (!email || !code) { res.status(400).json({ error: 'bad_request' }); return }
    const ok = verifyEmail(email, code)
    res.status(ok ? 200 : 400).json({ status: ok ? 'ok' : 'invalid' })
  } catch { res.status(400).json({ error: 'bad_request' }) }
}
