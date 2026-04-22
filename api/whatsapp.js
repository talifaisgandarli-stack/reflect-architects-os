import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const VERIFY_TOKEN = 'reflect_architects_2026'

export default async function handler(req, res) {

  // GET — Webhook doğrulama (Meta tərəfindən)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified')
      return res.status(200).send(challenge)
    }
    return res.status(403).json({ error: 'Forbidden' })
  }

  // POST — Gələn mesajlar
  if (req.method === 'POST') {
    try {
      const body = req.body
      const entry = body?.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value

      if (value?.messages) {
        for (const msg of value.messages) {
          const contact = value.contacts?.find(c => c.wa_id === msg.from)
          const fromName = contact?.profile?.name || msg.from

          await supabase.from('whatsapp_messages').insert({
            wa_id: msg.id,
            from_number: msg.from,
            from_name: fromName,
            message_type: msg.type,
            message_text: msg.text?.body || msg.caption || null,
            timestamp: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
            direction: 'inbound',
            status: 'received',
            raw_data: msg
          })
        }
      }

      // Status yeniləmələri
      if (value?.statuses) {
        for (const status of value.statuses) {
          await supabase.from('whatsapp_messages')
            .update({ status: status.status })
            .eq('wa_id', status.id)
        }
      }

      return res.status(200).json({ success: true })
    } catch (err) {
      console.error('Webhook error:', err)
      return res.status(200).json({ success: true }) // Meta 200 gözləyir
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
