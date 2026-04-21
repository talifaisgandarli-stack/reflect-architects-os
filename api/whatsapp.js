const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { phone, message, useAI, prompt } = req.body || {}

  if (!phone) {
    return res.status(400).json({ error: 'phone tələb olunur' })
  }

  let finalMessage = message

  // AI ilə mesaj yaz
  if (useAI && prompt && ANTHROPIC_API_KEY) {
    try {
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          messages: [{ role: 'user', content: `Azərbaycan dilində qısa professional WhatsApp mesajı yaz: ${prompt}` }]
        })
      })
      const aiData = await aiRes.json()
      finalMessage = aiData.content?.[0]?.text || message
    } catch (err) {
      console.error('AI error:', err)
    }
  }

  if (!finalMessage) {
    return res.status(400).json({ error: 'message tələb olunur' })
  }

  // WhatsApp göndər
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    // Test rejimi - token olmadan
    return res.status(200).json({
      success: true,
      mode: 'test',
      message: 'WhatsApp token konfiqurasiya edilməyib. Test rejimindədir.',
      would_send: { phone, message: finalMessage }
    })
  }

  try {
    const waRes = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone.replace(/\D/g, ''),
          type: 'text',
          text: { body: finalMessage }
        })
      }
    )
    const waData = await waRes.json()
    return res.status(200).json({ success: true, result: waData, message: finalMessage })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
