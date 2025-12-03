import { registerUser } from './_relay_store'

export default function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return }
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
    const { code, name, phone, passwordHashB64, avatarB64 } = b
    if (!code || !name || !phone || !passwordHashB64) { res.status(400).json({ error: 'bad_request' }); return }
    registerUser(code, { name, phone, passwordHashB64, avatarB64: avatarB64 || '' })
    res.status(200).json({ status: 'ok' })
  } catch { res.status(400).json({ error: 'bad_request' }) }
}
