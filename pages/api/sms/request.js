import { setSmsCode } from '../_relay_store'

export default function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return }
  try {
    const { phone } = JSON.parse(req.body || '{}')
    if (!phone) { res.status(400).json({ error: 'bad_request' }); return }
    const code = String(Math.floor(100000 + Math.random() * 900000))
    setSmsCode(phone, code)
    // Simulation: return code so you can test quickly
    res.status(200).json({ status: 'sent', code })
  } catch { res.status(400).json({ error: 'bad_request' }) }
}
