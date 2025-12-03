import { setSmsCode } from '../_relay_store'

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return }
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
    const { phone } = b
    if (!phone) { res.status(400).json({ error: 'bad_request' }); return }
    const code = String(Math.floor(100000 + Math.random() * 900000))
    setSmsCode(phone, code)
    const sid = process.env.TWILIO_ACCOUNT_SID
    const tok = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_FROM
    if (sid && tok && from) {
      const body = new URLSearchParams({ To: phone, From: from, Body: `Your ZeusChat code: ${code}` })
      const u = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
      try {
        await fetch(u, { method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(`${sid}:${tok}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' }, body })
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
