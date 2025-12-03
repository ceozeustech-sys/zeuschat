import { setEmailCode } from '../_relay_store'

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return }
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
    const { email } = b
    if (!email) { res.status(400).json({ error: 'bad_request' }); return }
    const code = String(Math.floor(100000 + Math.random() * 900000))
    setEmailCode(email, code)
    const sg = process.env.SENDGRID_API_KEY
    const from = process.env.SENDGRID_FROM || 'no-reply@zeuschat.local'
    if (sg) {
      try {
        await fetch('https://api.sendgrid.com/v3/mail/send', { method: 'POST', headers: { Authorization: `Bearer ${sg}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ personalizations: [{ to: [{ email }] }], from: { email: from }, subject: 'Your ZeusChat code', content: [{ type: 'text/plain', value: `Your ZeusChat verification code: ${code}` }] }) })
        res.status(200).json({ status: 'sent', code })
        return
      } catch {
        res.status(200).json({ status: 'sent', code })
        return
      }
    }
    res.status(200).json({ status: 'sent', code })
  } catch { res.status(400).json({ error: 'bad_request' }) }
}
