import { useState } from 'react'

export default function PaymentModal({ open, onClose, onSend }) {
  const [amount, setAmount] = useState('')
  const [network, setNetwork] = useState('M-Pesa')
  const [note, setNote] = useState('')
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#102030', color: '#fff', padding: 16, borderRadius: 8, width: 380 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>ZeusPay</div>
        <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" style={{ width: '100%', padding: 8, background: '#0E1A24', color: '#C9A14A', border: '1px solid #C9A14A', borderRadius: 6 }} />
        <select value={network} onChange={e => setNetwork(e.target.value)} style={{ width: '100%', marginTop: 8, padding: 8 }}>
          <option>M-Pesa</option>
          <option>Zamtel</option>
          <option>Mobile Money</option>
        </select>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note" style={{ width: '100%', padding: 8, marginTop: 8, background: '#0E1A24', color: '#C9A14A', border: '1px solid #C9A14A', borderRadius: 6 }} />
        <div style={{ marginTop: 12 }}>
          <button onClick={() => { const payload = { kind: 'payment', amount, network, note, ts: Date.now() }; onSend && onSend(payload) }} style={{ padding: '8px 16px', background: '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 6 }}>Send</button>
          <button onClick={onClose} style={{ marginLeft: 8, padding: '8px 16px', background: '#C9A14A', color: '#0E1A24', border: 'none', borderRadius: 6 }}>Close</button>
        </div>
      </div>
    </div>
  )
}
