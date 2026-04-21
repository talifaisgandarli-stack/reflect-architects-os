export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST lazımdır' })

  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN
  const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

  const { phone, message, useAI, prompt } = req.body || {}
  if (!phone) return res.status(400).json({ error: 'phone lazımdır' })

  let finalMessage = message

  if (useAI && prompt && OPENROUTER_API_KEY) {
    try {
      const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://reflect-architects-os.vercel.app',
          'X-Title': 'Reflect Architects OS'
        },
        body: JSON.stringify({
          model: 'google/gemma-3-4b-it:free',
          messages: [{ role: 'user', content: `Azərbaycan dilində qısa professional WhatsApp mesajı yaz: ${prompt}` }],
          max_tokens: 300,
          temperature: 0.7
        })
      })
      const aiData = await aiRes.json()
      finalMessage = aiData.choices?.[0]?.message?.content || message
    } catch (err) { console.error('OpenRouter error:', err) }
  }

  if (!finalMessage) return res.status(400).json({ error: 'message lazımdır' })

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    return res.status(200).json({ success: true, mode: 'test', would_send: { phone, message: finalMessage } })
  }

  try {
    const waRes = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${WHATSAPP_TOKEN}` },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: phone.replace(/\D/g, ''), type: 'text', text: { body: finalMessage } })
      }
    )
    const waData = await waRes.json()
    return res.status(200).json({ success: true, result: waData, message: finalMessage })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
