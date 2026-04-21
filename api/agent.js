import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID

// ── Gemini API ilə mesaj yaz ──────────────────────────────
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

// ── WhatsApp mesaj göndər ─────────────────────────────────
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

// ── Bildiriş ayarını yoxla ────────────────────────────────
async function isEnabled(key) {
  const { data } = await supabase
    .from('notification_settings')
    .select('value')
    .eq('key', key)
    .single()
  return data?.value === true
}

// ── Günlük xülasə ─────────────────────────────────────────
async function sendDailySummary() {
  if (!(await isEnabled('agent_enabled'))) return { skipped: 'agent_disabled' }
  if (!(await isEnabled('daily_summary'))) return { skipped: 'daily_summary_disabled' }

  const today = new Date().toISOString().split('T')[0]
  const weekLater = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  const [tasksRes, projectsRes, receivablesRes, transfersRes] = await Promise.all([
    supabase.from('tasks').select('*, projects(name)').in('status', ['not_started', 'in_progress']),
    supabase.from('projects').select('name, deadline, status').eq('status', 'active').lte('deadline', weekLater).not('deadline', 'is', null),
    supabase.from('receivables').select('expected_amount, paid_amount, expected_date').eq('paid', false),
    supabase.from('internal_transfers').select('amount, return_deadline').eq('status', 'open'),
  ])

  const overdueTasks = (tasksRes.data || []).filter(t => t.due_date && t.due_date < today)
  const upcomingDeadlines = projectsRes.data || []
  const overdueReceivables = (receivablesRes.data || []).filter(r => r.expected_date && r.expected_date < today)
  const urgentTransfers = (transfersRes.data || []).filter(t => {
    if (!t.return_deadline) return false
    const days = Math.floor((new Date(t.return_deadline) - new Date()) / 86400000)
    return days <= 7
  })

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, whatsapp_number')
    .eq('is_active', true)
    .not('whatsapp_number', 'is', null)

  const results = []
  for (const member of (members || [])) {
    const memberTasks = (tasksRes.data || []).filter(t => t.assignee_id === member.id)
    const memberOverdue = overdueTasks.filter(t => t.assignee_id === member.id)

    const prompt = `Sən Reflect Architects memarlıq şirkətinin AI köməkçisisən. Azərbaycan dilində qısa, professional günlük xülasə yaz.

İşçi: ${member.full_name}
Bu gün: ${new Date().toLocaleDateString('az-AZ', { weekday: 'long', day: 'numeric', month: 'long' })}

Məlumatlar:
- Açıq tapşırıqlar: ${memberTasks.length} (${memberOverdue.length} vaxtı keçmiş)
- Bu həftə layihə deadlinləri: ${upcomingDeadlines.length}
- Gecikmiş alacaqlar: ${overdueReceivables.length}
- Təcili köçürmə qaytarmaları: ${urgentTransfers.length}

Maksimum 4-5 cümlə. Salamla başla, əsas məsələləri qeyd et, günü xoş keç arzu et.`

    const message = await generateMessage(prompt)

    if (await isEnabled('whatsapp_auto') && member.whatsapp_number) {
      const result = await sendWhatsApp(member.whatsapp_number, message)
      results.push({ member: member.full_name, sent: true, result })
    } else {
      results.push({ member: member.full_name, sent: false, message })
    }
  }

  return { success: true, sent: results.length, results }
}

// ── Deadline xəbərdarlıqları ──────────────────────────────
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
İşçi: ${task.profiles.full_name}
Tapşırıq: ${task.title}
Layihə: ${task.projects?.name || 'Ümumi'}
Qalan müddət: ${days} gün
Maksimum 2-3 cümlə. Professional ton.`)

      if (await isEnabled('whatsapp_auto')) {
        await sendWhatsApp(task.profiles.whatsapp_number, message)
      }
      results.push({ task: task.title, days, member: task.profiles.full_name })
    }
  }
  return { success: true, warnings: results.length, results }
}

// ── Maliyyə bildirişləri ──────────────────────────────────
async function sendFinanceAlerts() {
  if (!(await isEnabled('agent_enabled'))) return { skipped: 'agent_disabled' }
  if (!(await isEnabled('finance_alerts'))) return { skipped: 'disabled' }

  const { data: ceo } = await supabase
    .from('profiles')
    .select('full_name, whatsapp_number')
    .eq('is_active', true)
    .order('created_at')
    .limit(1)
    .single()

  if (!ceo?.whatsapp_number) return { skipped: 'no_phone' }

  const { data: overdueRec } = await supabase
    .from('receivables')
    .select('expected_amount, paid_amount')
    .eq('paid', false)
    .lt('expected_date', new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0])

  const { data: urgentTransfers } = await supabase
    .from('internal_transfers')
    .select('amount, return_deadline')
    .eq('status', 'open')
    .lt('return_deadline', new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0])

  if (!overdueRec?.length && !urgentTransfers?.length) return { skipped: 'no_alerts' }

  const totalOverdue = (overdueRec || []).reduce((s, r) => s + (r.expected_amount - r.paid_amount), 0)

  const message = await generateMessage(`Azərbaycan dilində qısa maliyyə xəbərdarlığı yaz:
Ad: ${ceo.full_name}
60+ gün gecikmiş alacaqlar: ${overdueRec?.length || 0} (₼${Math.round(totalOverdue).toLocaleString()})
Vaxtı keçmək üzrə olan köçürmələr: ${urgentTransfers?.length || 0}
Maksimum 3-4 cümlə. Ciddi ton.`)

  if (await isEnabled('whatsapp_auto')) {
    await sendWhatsApp(ceo.whatsapp_number, message)
  }

  return { success: true, alertsSent: 1 }
}

// ── Həftəlik hesabat ──────────────────────────────────────
async function sendWeeklyReport() {
  if (!(await isEnabled('agent_enabled'))) return { skipped: 'agent_disabled' }
  if (!(await isEnabled('weekly_report'))) return { skipped: 'disabled' }

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const [tasksRes, incomesRes] = await Promise.all([
    supabase.from('tasks').select('status').gte('completed_at', weekAgo),
    supabase.from('incomes').select('amount').gte('payment_date', weekAgo),
  ])

  const completedTasks = (tasksRes.data || []).filter(t => t.status === 'done').length
  const weeklyIncome = (incomesRes.data || []).reduce((s, i) => s + Number(i.amount || 0), 0)

  const { data: members } = await supabase
    .from('profiles')
    .select('full_name, whatsapp_number')
    .eq('is_active', true)
    .not('whatsapp_number', 'is', null)

  const results = []
  for (const member of (members || [])) {
    const message = await generateMessage(`Azərbaycan dilində həftəlik xülasə yaz:
İşçi: ${member.full_name}
Tamamlanan tapşırıqlar: ${completedTasks}
Həftəlik daxilolma: ₼${Math.round(weeklyIncome).toLocaleString()}
Maksimum 4-5 cümlə. Motivasiyaverici ton.`)

    if (await isEnabled('whatsapp_auto')) {
      await sendWhatsApp(member.whatsapp_number, message)
    }
    results.push({ member: member.full_name })
  }
  return { success: true, sent: results.length }
}

// ── Ana handler ───────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { type } = req.body || req.query || {}

  try {
    let result
    switch (type) {
      case 'daily_summary': result = await sendDailySummary(); break
      case 'deadline_warnings': result = await sendDeadlineWarnings(); break
      case 'finance_alerts': result = await sendFinanceAlerts(); break
      case 'weekly_report': result = await sendWeeklyReport(); break
      default:
        return res.status(400).json({ error: 'Unknown type', valid: ['daily_summary', 'deadline_warnings', 'finance_alerts', 'weekly_report'] })
    }
    return res.status(200).json(result)
  } catch (error) {
    console.error('Agent error:', error)
    return res.status(500).json({ error: error.message })
  }
}
