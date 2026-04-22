import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const GEMINI_KEY = process.env.GEMINI_API_KEY
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`

async function sendTelegram(chat_id, text) {
  if (!chat_id || !text) return
  const r = await fetch(`${TG_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: String(chat_id), text, parse_mode: 'HTML' })
  })
  const d = await r.json()
  if (!d.ok) console.log('TG ERROR:', JSON.stringify(d))
  return d
}

async function gemini(prompt) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 600, temperature: 0.4 }
        })
      }
    )
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  } catch (e) {
    console.log('GEMINI ERROR:', e.message)
    return ''
  }
}

async function getProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, telegram_chat_id')
    .not('telegram_chat_id', 'is', null)
  console.log('profiles:', JSON.stringify(data), 'err:', error?.message)
  return data || []
}

export default async function handler(req, res) {
  const type = req.query?.type || req.body?.type

  // ── Manual mesaj göndər ────────────────────────────────────
  if (type === 'send_manual') {
    const { message, target } = req.body || {}
    if (!message) return res.status(400).json({ error: 'message lazımdır' })

    const profiles = await getProfiles()
    const targets = target === 'all' ? profiles : profiles.filter(p => p.id === target)
    let count = 0
    for (const p of targets) {
      const r = await sendTelegram(p.telegram_chat_id, message)
      if (r?.ok) count++
    }
    return res.status(200).json({ success: true, count })
  }

  // ── Günlük xülasə ─────────────────────────────────────────
  if (type === 'daily_summary') {
    const profiles = await getProfiles()
    if (!profiles.length) return res.status(200).json({ success: true, count: 0, note: 'no profiles' })

    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const in3days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]

    const [tasksRes, projectsRes, eventsRes] = await Promise.all([
      supabase.from('tasks').select('id, title, due_date, assignee_id, status').neq('status', 'done').neq('status', 'cancelled'),
      supabase.from('projects').select('name, deadline').neq('status', 'completed').not('deadline', 'is', null).lte('deadline', in3days),
      supabase.from('events').select('title, start_date').eq('start_date', today),
    ])

    let count = 0
    for (const profile of profiles) {
      const myTasks = (tasksRes.data || []).filter(t => t.assignee_id === profile.id && t.due_date <= tomorrow)
      const todayEvents = eventsRes.data || []
      const urgentProjects = projectsRes.data || []

      const prompt = `Sən Reflect Architects şirkətinin AI köməkçisisən.
${profile.full_name} üçün qısa səhər xülasəsi yaz (Azərbaycan dilində, emoji ilə, 4-5 cümlə).
Tapşırıqlar: ${myTasks.map(t => t.title).join(', ') || 'yoxdur'}
Görüşlər: ${todayEvents.map(e => e.title).join(', ') || 'yoxdur'}  
Yaxın deadlinelər: ${urgentProjects.map(p => `${p.name}(${p.deadline})`).join(', ') || 'yoxdur'}`

      let text = await gemini(prompt)
      if (!text) text = `Bugün yaxşı iş günü olsun! 💪\nTapşırıqlarınızı vaxtında tamamlayın.`

      const r = await sendTelegram(profile.telegram_chat_id, `☀️ <b>Sabahın xeyir, ${profile.full_name.split(' ')[0]}!</b>\n\n${text}`)
      console.log('sent to', profile.full_name, ':', r?.ok)
      if (r?.ok) count++
    }
    return res.status(200).json({ success: true, count })
  }

  // ── Deadline xəbərdarlıqları ───────────────────────────────
  if (type === 'deadline_warning') {
    const today = new Date(); today.setHours(0,0,0,0)
    const profiles = await getProfiles()
    let count = 0

    const { data: tasks } = await supabase.from('tasks').select('title, due_date, assignee_id').neq('status', 'done').not('due_date', 'is', null)
    const { data: projects } = await supabase.from('projects').select('name, deadline').neq('status', 'completed').not('deadline', 'is', null)

    for (const task of (tasks || [])) {
      const due = new Date(task.due_date); due.setHours(0,0,0,0)
      const days = Math.floor((due - today) / 86400000)
      if (![1, 3, 7].includes(days)) continue
      const profile = profiles.find(p => p.id === task.assignee_id)
      if (!profile) continue
      const emoji = days === 1 ? '🔴' : days === 3 ? '🟡' : '🟠'
      await sendTelegram(profile.telegram_chat_id, `${emoji} <b>Deadline xatırlatması</b>\n\n📋 ${task.title}\n⏰ ${days === 1 ? 'Sabah deadline!' : `${days} gün qaldı`}`)
      count++
    }

    for (const project of (projects || [])) {
      const due = new Date(project.deadline); due.setHours(0,0,0,0)
      const days = Math.floor((due - today) / 86400000)
      if (![1, 3, 7].includes(days)) continue
      for (const p of profiles) {
        await sendTelegram(p.telegram_chat_id, `🏗 <b>Layihə deadline</b>\n\n📁 ${project.name}\n⏰ ${days === 1 ? 'Sabah!' : `${days} gün qaldı`}`)
        count++
      }
    }
    return res.status(200).json({ success: true, count })
  }

  // ── Görüş xatırlatmaları ───────────────────────────────────
  if (type === 'meeting_reminder') {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const { data: events } = await supabase.from('events').select('*').eq('start_date', tomorrow)
    const profiles = await getProfiles()
    let count = 0
    for (const event of (events || [])) {
      for (const p of profiles) {
        const r = await sendTelegram(p.telegram_chat_id, `📅 <b>Sabahkı görüş</b>\n\n🎯 ${event.title}\n📆 ${event.start_date}`)
        if (r?.ok) count++
      }
    }
    return res.status(200).json({ success: true, count })
  }

  // ── Həftəlik hesabat ───────────────────────────────────────
  if (type === 'weekly_report') {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
    const [iRes, eRes, tRes, pRes] = await Promise.all([
      supabase.from('incomes').select('amount').gte('payment_date', weekAgo),
      supabase.from('expenses').select('amount').gte('expense_date', weekAgo),
      supabase.from('tasks').select('status'),
      supabase.from('projects').select('status'),
    ])
    const totalIncome = (iRes.data || []).reduce((s, i) => s + Number(i.amount || 0), 0)
    const totalExpense = (eRes.data || []).reduce((s, e) => s + Number(e.amount || 0), 0)
    const doneTasks = (tRes.data || []).filter(t => t.status === 'done').length
    const activeProjects = (pRes.data || []).filter(p => p.status === 'active').length

    const prompt = `Reflect Architects üçün həftəlik hesabat (Azərbaycan dilində, emoji ilə, 5 cümlə):
Gəlir: ${totalIncome} AZN, Xərc: ${totalExpense} AZN, Tamamlanan tapşırıqlar: ${doneTasks}, Aktiv layihələr: ${activeProjects}`

    let text = await gemini(prompt)
    if (!text) text = `📊 Həftəlik hesabat:\nGəlir: ₼${totalIncome} · Xərc: ₼${totalExpense}\nMənfəət: ₼${totalIncome - totalExpense}\nTamamlanan tapşırıqlar: ${doneTasks}`

    const profiles = await getProfiles()
    let count = 0
    for (const p of profiles) {
      const r = await sendTelegram(p.telegram_chat_id, `📊 <b>Həftəlik Hesabat</b>\n\n${text}`)
      if (r?.ok) count++
    }
    return res.status(200).json({ success: true, count })
  }

  return res.status(400).json({ error: 'Bilinməyən type: ' + type })
}
