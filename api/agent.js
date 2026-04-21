import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN
  const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID

  // Debug — env vars var mı?
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(200).json({
      error: 'Environment variables tapılmadı',
      has_supabase_url: !!SUPABASE_URL,
      has_service_key: !!SUPABASE_SERVICE_KEY,
      has_gemini: !!GEMINI_API_KEY,
      tip: 'Vercel → Settings → Environment Variables yoxlayın'
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const type = req.query?.type || req.body?.type

  if (!type) {
    return res.status(200).json({
      status: 'Agent işləyir',
      env_ok: true,
      has_gemini: !!GEMINI_API_KEY,
      valid_types: ['daily_summary', 'deadline_warnings', 'finance_alerts']
    })
  }

  // Gemini ilə mesaj yaz
  async function generateMessage(prompt) {
    if (!GEMINI_API_KEY) return '[Gemini API key yoxdur]'
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 400, temperature: 0.7 }
        })
      }
    )
    const d = await r.json()
    return d.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  // WhatsApp göndər
  async function sendWA(phone, message) {
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) return { skipped: 'no_wa_token' }
    const r = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${WHATSAPP_TOKEN}` },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: phone.replace(/\D/g, ''), type: 'text', text: { body: message } })
    })
    return r.json()
  }

  // Bildiriş ayarı yoxla
  async function isEnabled(key) {
    try {
      const { data } = await supabase.from('notification_settings').select('value').eq('key', key).single()
      return data?.value === true
    } catch { return false }
  }

  try {
    if (type === 'daily_summary') {
      if (!(await isEnabled('agent_enabled'))) return res.status(200).json({ skipped: 'agent_disabled' })
      if (!(await isEnabled('daily_summary'))) return res.status(200).json({ skipped: 'daily_summary_disabled' })

      const today = new Date().toISOString().split('T')[0]
      const { data: tasks } = await supabase.from('tasks').select('assignee_id, due_date, status').in('status', ['not_started', 'in_progress'])
      const { data: members } = await supabase.from('profiles').select('id, full_name, whatsapp_number').eq('is_active', true).not('whatsapp_number', 'is', null)

      const results = []
      for (const m of (members || [])) {
        const mt = (tasks || []).filter(t => t.assignee_id === m.id)
        const mo = mt.filter(t => t.due_date && t.due_date < today)
        const msg = await generateMessage(`Azərbaycan dilində qısa günlük xülasə yaz. İşçi: ${m.full_name}. Açıq tapşırıq: ${mt.length} (${mo.length} vaxtı keçmiş). Maksimum 3 cümlə.`)
        const waEnabled = await isEnabled('whatsapp_auto')
        if (waEnabled && m.whatsapp_number) await sendWA(m.whatsapp_number, msg)
        results.push({ member: m.full_name, message: msg.slice(0, 100) + '...' })
      }
      return res.status(200).json({ success: true, type, count: results.length, results })
    }

    if (type === 'deadline_warnings') {
      if (!(await isEnabled('agent_enabled'))) return res.status(200).json({ skipped: 'agent_disabled' })
      const results = []
      for (const days of [1, 3]) {
        const date = new Date(Date.now() + days * 86400000).toISOString().split('T')[0]
        const { data: tasks } = await supabase.from('tasks').select('title, profiles(full_name, whatsapp_number), projects(name)').eq('due_date', date).not('status', 'eq', 'done')
        for (const t of (tasks || [])) {
          if (!t.profiles?.whatsapp_number) continue
          const msg = await generateMessage(`Azərbaycan dilində: ${t.profiles.full_name} üçün "${t.title}" tapşırığı ${days} günə qədər bitməlidir. 2 cümlə.`)
          if (await isEnabled('whatsapp_auto')) await sendWA(t.profiles.whatsapp_number, msg)
          results.push({ task: t.title, days })
        }
      }
      return res.status(200).json({ success: true, type, count: results.length, results })
    }

    if (type === 'finance_alerts') {
      if (!(await isEnabled('agent_enabled'))) return res.status(200).json({ skipped: 'agent_disabled' })
      const { data: overdue } = await supabase.from('receivables').select('expected_amount, paid_amount').eq('paid', false).lt('expected_date', new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0])
      const total = (overdue || []).reduce((s, r) => s + (r.expected_amount - r.paid_amount), 0)
      return res.status(200).json({ success: true, type, overdueCount: overdue?.length || 0, totalAmount: Math.round(total) })
    }

    return res.status(400).json({ error: 'Bilinməyən type', valid: ['daily_summary', 'deadline_warnings', 'finance_alerts'] })

  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack?.split('\n').slice(0, 3) })
  }
}
