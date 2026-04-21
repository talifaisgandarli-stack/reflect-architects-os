const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST lazımdır' })

  const { phone, message, useAI, prompt } = req.body || {}
  if (!phone) return res.status(400).json({ error: 'phone lazımdır' })

  let finalMessage = message

  if (useAI && prompt && GEMINI_API_KEY) {
    try {
      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Azərbaycan dilində qısa professional WhatsApp mesajı yaz: ${prompt}` }] }],
            generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
          })
        }
      )
      const aiData = await aiRes.json()
      finalMessage = aiData.candidates?.[0]?.content?.parts?.[0]?.text || message
    } catch (err) { console.error('Gemini error:', err) }
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
