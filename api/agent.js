import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const GEMINI_KEY = process.env.GEMINI_API_KEY
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const API = `https://api.telegram.org/bot${BOT_TOKEN}`

async function sendTelegram(chat_id, text) {
  if (!chat_id) return
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id, text, parse_mode: 'HTML' })
  })
}

async function gemini(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 800, temperature: 0.3 }
      })
    }
  )
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export default async function handler(req, res) {
  const type = req.query?.type || req.body?.type

  // ── Günlük xülasə (hər işçiyə şəxsi) ─────────────────────
  if (type === 'daily_summary') {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const in3days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]

    const [tasksRes, projectsRes, eventsRes, profilesRes] = await Promise.all([
      supabase.from('tasks').select('*, profiles(full_name, telegram_chat_id)').neq('status', 'done').neq('status', 'cancelled'),
      supabase.from('projects').select('name, deadline, status').neq('status', 'completed').not('deadline', 'is', null).lte('deadline', in3days),
      supabase.from('events').select('*').eq('start_date', today),
      supabase.from('profiles').select('id, full_name, telegram_chat_id').not('telegram_chat_id', 'is', null)
    ])

    const profiles = profilesRes.data || []
    let count = 0

    for (const profile of profiles) {
      const myTasks = (tasksRes.data || []).filter(t =>
        t.assignee_id === profile.id && t.due_date && t.due_date <= tomorrow
      )
      const todayEvents = eventsRes.data || []
      const urgentProjects = projectsRes.data || []

      const prompt = `Sən Reflect Architects şirkətinin AI köməkçisisən. 
${profile.full_name} üçün qısa səhər xülasəsi hazırla (Azərbaycan dilində, dostcasına, emoji ilə).

Bugünkü tapşırıqlar: ${myTasks.map(t => `${t.title} (${t.due_date})`).join(', ') || 'yoxdur'}
Bugünkü görüşlər: ${todayEvents.map(e => `${e.title} - ${e.start_date}`).join(', ') || 'yoxdur'}
Yaxınlaşan deadlinelər: ${urgentProjects.map(p => `${p.name} - ${p.deadline}`).join(', ') || 'yoxdur'}

Maksimum 5-6 cümlə, konkret və motivasiyaverici ol.`

      const text = await gemini(prompt)
      if (text) {
        await sendTelegram(profile.telegram_chat_id, `☀️ <b>Sabahın xeyir, ${profile.full_name.split(' ')[0]}!</b>\n\n${text}`)
        count++
      }
    }
    return res.status(200).json({ success: true, count })
  }

  // ── Deadline xəbərdarlıqları ───────────────────────────────
  if (type === 'deadline_warning') {
    const today = new Date(); today.setHours(0,0,0,0)
    const checkDays = [1, 3, 7]
    let count = 0

    const [tasksRes, projectsRes, profilesRes] = await Promise.all([
      supabase.from('tasks').select('*, profiles!assignee_id(full_name, telegram_chat_id)').neq('status', 'done').neq('status', 'cancelled').not('due_date', 'is', null),
      supabase.from('projects').select('name, deadline, status').neq('status', 'completed').not('deadline', 'is', null),
      supabase.from('profiles').select('id, full_name, telegram_chat_id, role_id').not('telegram_chat_id', 'is', null)
    ])

    // Tapşırıq deadlineləri
    for (const task of (tasksRes.data || [])) {
      const due = new Date(task.due_date); due.setHours(0,0,0,0)
      const days = Math.floor((due - today) / 86400000)
      if (!checkDays.includes(days)) continue
      const profile = task.profiles
      if (!profile?.telegram_chat_id) continue

      const emoji = days === 1 ? '🔴' : days === 3 ? '🟡' : '🟠'
      await sendTelegram(profile.telegram_chat_id,
        `${emoji} <b>Deadline xatırlatması</b>\n\n📋 <b>${task.title}</b>\n⏰ ${days === 1 ? 'Sabah deadline!' : `${days} gün qaldı`}\n📅 ${task.due_date}`)
      count++
    }

    // Layihə deadlineləri — admin-lərə
    const admins = (profilesRes.data || []).filter(p => p.telegram_chat_id)
    for (const project of (projectsRes.data || [])) {
      const due = new Date(project.deadline); due.setHours(0,0,0,0)
      const days = Math.floor((due - today) / 86400000)
      if (![1, 3, 7].includes(days)) continue

      for (const admin of admins) {
        await sendTelegram(admin.telegram_chat_id,
          `🏗 <b>Layihə deadline</b>\n\n📁 <b>${project.name}</b>\n⏰ ${days === 1 ? 'Sabah deadline!' : `${days} gün qaldı`}\n📅 ${project.deadline}`)
        count++
      }
    }

    return res.status(200).json({ success: true, count })
  }

  // ── Görüş xatırlatmaları ───────────────────────────────────
  if (type === 'meeting_reminder') {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 3600000).toISOString().split('T')[0]
    const { data: events } = await supabase.from('events').select('*').eq('start_date', tomorrow)
    const { data: profiles } = await supabase.from('profiles').select('full_name, telegram_chat_id').not('telegram_chat_id', 'is', null)
    let count = 0

    for (const event of (events || [])) {
      for (const profile of (profiles || [])) {
        await sendTelegram(profile.telegram_chat_id,
          `📅 <b>Sabahkı görüş xatırlatması</b>\n\n🎯 <b>${event.title}</b>\n📆 ${event.start_date}${event.notes ? `\n📝 ${event.notes}` : ''}`)
        count++
      }
    }
    return res.status(200).json({ success: true, count })
  }

  // ── Həftəlik hesabat ───────────────────────────────────────
  if (type === 'weekly_report') {
    const [incomesRes, expensesRes, tasksRes, projectsRes, profilesRes] = await Promise.all([
      supabase.from('incomes').select('amount').gte('payment_date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]),
      supabase.from('expenses').select('amount').gte('expense_date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]),
      supabase.from('tasks').select('status'),
      supabase.from('projects').select('status'),
      supabase.from('profiles').select('full_name, telegram_chat_id').not('telegram_chat_id', 'is', null)
    ])

    const totalIncome = (incomesRes.data || []).reduce((s, i) => s + Number(i.amount || 0), 0)
    const totalExpense = (expensesRes.data || []).reduce((s, e) => s + Number(e.amount || 0), 0)
    const doneTasks = (tasksRes.data || []).filter(t => t.status === 'done').length
    const activeProjects = (projectsRes.data || []).filter(p => p.status === 'active').length

    const prompt = `Reflect Architects şirkəti üçün həftəlik hesabat hazırla (Azərbaycan dilində, emoji ilə, maksimum 6 cümlə):
Həftəlik gəlir: ${totalIncome} AZN
Həftəlik xərc: ${totalExpense} AZN  
Tamamlanan tapşırıqlar: ${doneTasks}
Aktiv layihələr: ${activeProjects}
Qısa, analitik və konstruktiv ol.`

    const text = await gemini(prompt)
    let count = 0
    for (const profile of (profilesRes.data || [])) {
      await sendTelegram(profile.telegram_chat_id, `📊 <b>Həftəlik Hesabat</b>\n\n${text}`)
      count++
    }
    return res.status(200).json({ success: true, count })
  }

  return res.status(400).json({ error: 'Bilinməyən type' })
}
