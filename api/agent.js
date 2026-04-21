const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID

async function generateMessage(prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
      })
    }
  )
  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function sendWhatsApp(phone, message) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) return { skipped: true }
  const response = await fetch(
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
  return response.json()
}

async function isEnabled(key) {
  try {
    const { data } = await supabase
      .from('notification_settings')
      .select('value')
      .eq('key', key)
      .single()
    return data?.value === true
  } catch { return false }
}

async function sendDailySummary() {
  if (!(await isEnabled('agent_enabled'))) return { skipped: 'agent_disabled' }
  if (!(await isEnabled('daily_summary'))) return { skipped: 'daily_summary_disabled' }

  const today = new Date().toISOString().split('T')[0]
  const weekLater = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  const [tasksRes, projectsRes, receivablesRes] = await Promise.all([
    supabase.from('tasks').select('assignee_id, due_date, status'),
    supabase.from('projects').select('name, deadline').eq('status', 'active').lte('deadline', weekLater).not('deadline', 'is', null),
    supabase.from('receivables').select('expected_amount, paid_amount, expected_date').eq('paid', false),
  ])

  const tasks = tasksRes.data || []
  const upcomingDeadlines = projectsRes.data || []
  const overdueReceivables = (receivablesRes.data || []).filter(r => r.expected_date && r.expected_date < today)

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, whatsapp_number')
    .eq('is_active', true)
    .not('whatsapp_number', 'is', null)

  const results = []
  for (const member of (members || [])) {
    const memberTasks = tasks.filter(t => t.assignee_id === member.id && ['not_started','in_progress'].includes(t.status))
    const memberOverdue = memberTasks.filter(t => t.due_date && t.due_date < today)

    const prompt = `Sən Reflect Architects memarlıq şirkətinin AI köməkçisisən. Azərbaycan dilində qısa günlük xülasə yaz.
İşçi: ${member.full_name}
Bu gün: ${new Date().toLocaleDateString('az-AZ', { weekday: 'long', day: 'numeric', month: 'long' })}
Açıq tapşırıqlar: ${memberTasks.length} (${memberOverdue.length} vaxtı keçmiş)
Bu həftə layihə deadlinləri: ${upcomingDeadlines.length}
Gecikmiş alacaqlar: ${overdueReceivables.length}
Maksimum 4 cümlə. Salamla başla, əsas məsələləri qeyd et.`

    const message = await generateMessage(prompt)
    const waEnabled = await isEnabled('whatsapp_auto')

    if (waEnabled && member.whatsapp_number) {
      const result = await sendWhatsApp(member.whatsapp_number, message)
      results.push({ member: member.full_name, sent: true, result })
    } else {
      results.push({ member: member.full_name, sent: false, message })
    }
  }

  return { success: true, sent: results.length, results }
}

async function sendDeadlineWarnings() {
  if (!(await isEnabled('agent_enabled'))) return { skipped: 'agent_disabled' }
  if (!(await isEnabled('deadline_warnings'))) return { skipped: 'disabled' }

  const results = []
  for (const days of [1, 3]) {
    const targetDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0]
    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, due_date, assignee_id, profiles(full_name, whatsapp_number), projects(name)')
      .eq('due_date', targetDate)
      .not('status', 'eq', 'done')
      .not('assignee_id', 'is', null)

    for (const task of (tasks || [])) {
      if (!task.profiles?.whatsapp_number) continue
      const message = await generateMessage(`Azərbaycan dilində qısa deadline xatırlatması yaz:
İşçi: ${task.profiles.full_name}, Tapşırıq: ${task.title}, Qalan: ${days} gün. Maksimum 2 cümlə.`)
      if (await isEnabled('whatsapp_auto')) await sendWhatsApp(task.profiles.whatsapp_number, message)
      results.push({ task: task.title, days })
    }
  }
  return { success: true, warnings: results.length, results }
}

async function sendFinanceAlerts() {
  if (!(await isEnabled('agent_enabled'))) return { skipped: 'agent_disabled' }
  if (!(await isEnabled('finance_alerts'))) return { skipped: 'disabled' }

  const { data: ceo } = await supabase.from('profiles').select('full_name, whatsapp_number').eq('is_active', true).order('created_at').limit(1).single()
  if (!ceo?.whatsapp_number) return { skipped: 'no_phone' }

  const { data: overdueRec } = await supabase.from('receivables').select('expected_amount, paid_amount').eq('paid', false).lt('expected_date', new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0])
  if (!overdueRec?.length) return { skipped: 'no_alerts' }

  const total = (overdueRec || []).reduce((s, r) => s + (r.expected_amount - r.paid_amount), 0)
  const message = await generateMessage(`Azərbaycan dilində maliyyə xəbərdarlığı: ${overdueRec.length} gecikmiş alacaq, cəmi ₼${Math.round(total).toLocaleString()}. 2-3 cümlə, ciddi ton.`)
  if (await isEnabled('whatsapp_auto')) await sendWhatsApp(ceo.whatsapp_number, message)
  return { success: true, alertsSent: 1, total }
}

module.exports = async function handler(req, res) {
  const type = req.body?.type || req.query?.type

  if (!type) {
    return res.status(400).json({ error: 'type parametri lazımdır', valid: ['daily_summary', 'deadline_warnings', 'finance_alerts'] })
  }

  try {
    let result
    if (type === 'daily_summary') result = await sendDailySummary()
    else if (type === 'deadline_warnings') result = await sendDeadlineWarnings()
    else if (type === 'finance_alerts') result = await sendFinanceAlerts()
    else return res.status(400).json({ error: 'Bilinməyən type' })

    return res.status(200).json(result)
  } catch (error) {
    console.error('Agent error:', error)
    return res.status(500).json({ error: error.message, stack: error.stack })
  }
}
