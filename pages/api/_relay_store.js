const inbox = new Map()
const blobs = new Map()

function genId() {
  let s = ''
  for (let i = 0; i < 16; i++) s += Math.floor(Math.random() * 16).toString(16)
  return s
}

export function sendTo(code, payload, ttlMs) {
  const id = genId()
  blobs.set(id, { id, payload, exp: Date.now() + (ttlMs || 30000) })
  const q = inbox.get(code) || []
  q.push(id)
  inbox.set(code, q)
  setTimeout(() => {
    const b = blobs.get(id)
    if (b && Date.now() > b.exp) blobs.delete(id)
  }, ttlMs || 30000)
  return id
}

export function popInbox(code) {
  const q = inbox.get(code) || []
  if (q.length === 0) return null
  const id = q.shift()
  inbox.set(code, q)
  return id
}

export function getOnce(id) {
  const b = blobs.get(id)
  if (!b) return null
  blobs.delete(id)
  return b.payload
}
