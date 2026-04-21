import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN
  const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Environment variables tapılmadı' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const type = req.query?.type || req.body?.type
  console.log("Agent request type:", type)

  if (!type) {
    return res.status(200).json({
      status: 'Agent işləyir ✅',
      valid_types: ['daily_summary','deadline_warnings','meeting_reminders','outsource_deadlines','finance_alerts','transfer_reminders','weekly_report','monthly_report']
    })
  }

  // 🔁 SAFE FETCH (retry ilə)
  async function fetchWithRetry(url, options, retries = 2) {
    try {
      const res = await fetch(url, options)
      if (!res.ok) throw new Error(await res.text())
      return await res.json()
    } catch (err) {
      if (retries > 0) return fetchWithRetry(url, options, retries - 1)
      throw err
    }
  }

  // 🤖 AI
  async function generateMessage(prompt) {
    if (!OPENROUTER_KEY) return '[API key yoxdur]'
    try {
      console.log("AI prompt:", prompt.slice(0, 100))

      const data = await fetchWithRetry(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_KEY}`,
          },
          body: JSON.stringify({
            model: 'google/gemma-3-4b-it:free',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 300
          })
        }
      )

      return data?.choices?.[0]?.message?.content || '[Boş cavab]'
    } catch (e) {
      console.error("AI error:", e.message)
      return '[AI xətası]'
    }
  }

  // 📱 WhatsApp
  async function sendWA(phone, message) {
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) return

    try {
      const res = await fetch(
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
            text: { body: message }
          })
        }
      )

      if (!res.ok) {
        console.error("WhatsApp error:", await res.text())
      }

    } catch (e) {
      console.error("WhatsApp crash:", e.message)
    }
  }

  async function isEnabled(key) {
    try {
      const { data } = await supabase
        .from('notification_settings')
        .select('value')
        .eq('key', key)
        .single()

      return data?.value === true
    } catch {
      return false
    }
  }

  async function getActiveMembers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, whatsapp_number')
      .eq('is_active', true)

    return data || []
  }

  const today = new Date().toISOString().split('T')[0]

  try {

    // ✅ TEST TYPE (sistemi yoxlamaq üçün)
    if (type === 'test') {
      return res.json({ success: true, message: "API işləyir" })
    }

    // ✅ DAILY SUMMARY (sadə və stabil versiya)
    if (type === 'daily_summary') {

      if (!(await isEnabled('agent_enabled'))) {
        return res.json({ skipped: 'agent_disabled' })
      }

      const members = await getActiveMembers()

      const results = []

      for (const m of members) {
        const msg = await generateMessage(
          `Qısa günlük plan yaz. İşçi: ${m.full_name}`
        )

        if (m.whatsapp_number) {
          await sendWA(m.whatsapp_number, msg)
        }

        results.push({
          member: m.full_name,
          message: msg
        })
      }

      return res.json({
        success: true,
        type,
        count: results.length,
        results
      })
    }

    return res.status(400).json({
      error: 'Bilinməyən type'
    })

  } catch (err) {
    console.error("FATAL ERROR:", err)
    return res.status(500).json({
      error: err.message
    })
  }
}
