import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN
  const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(200).json({ error: 'Environment variables tapılmadı' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const type = req.query?.type || req.body?.type

  if (!type) {
    return res.status(200).json({
      status: 'Agent işləyir ✅',
      valid_types: ['daily_summary','deadline_warnings','meeting_reminders','outsource_deadlines','finance_alerts','transfer_reminders','weekly_report','monthly_report']
    })
  }

  async function generateMessage(prompt) {
    const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY
    if (!OPENROUTER_KEY) return '[OpenRouter API key yoxdur]'
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'HTTP-Referer': 'https://reflect-architects-os.vercel.app',
          'X-Title': 'Reflect Architects OS'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.2-3b-instruct:free',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 400,
          temperature: 0.7
        })
      })
      const d = await r.json()
      if (!d.choices) return '[API cavabı: ' + JSON.stringify(d).slice(0, 200) + ']'
      return d.choices[0].message.content
    } catch (e) { return '[OpenRouter xətası: ' + e.message + ']' }
  }

  async function sendWA(phone, message) {
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) return { skipped: 'no_wa_config' }
    try {
      const r = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${WHATSAPP_TOKEN}` },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: phone.replace(/\D/g, ''), type: 'text', text: { body: message } })
      })
      return r.json()
    } catch (e) { return { error: e.message } }
  }

  async function isEnabled(key) {
    try {
      const { data } = await supabase.from('notification_settings').select('value').eq('key', key).single()
      return data?.value === true
    } catch { return false }
  }

  // Bütün aktiv üzvlər (whatsapp_number olan)
  async function getActiveMembers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, whatsapp_number')
      .eq('is_active', true)
      .not('whatsapp_number', 'is', null)
    return data || []
  }

  const fmt = (n) => '₼' + Math.round(n || 0).toLocaleString()
  const today = new Date().toISOString().split('T')[0]
  const waEnabled = await isEnabled('whatsapp_auto')

  try {

    // 1. GÜNLÜK XÜLASƏ — hər işçiyə öz tapşırıqları
    if (type === 'daily_summary') {
      if (!(await isEnabled('agent_enabled'))) return res.json({ skipped: 'agent_disabled' })
      if (!(await isEnabled('daily_summary'))) return res.json({ skipped: 'disabled' })

      const members = await getActiveMembers()
      const { data: tasks } = await supabase.from('tasks')
        .select('assignee_id, due_date, status')
        .in('status', ['not_started', 'in_progress'])

      const results = []
      for (const m of members) {
        const mt = (tasks || []).filter(t => t.assignee_id === m.id)
        const overdue = mt.filter(t => t.due_date && t.due_date < today)
        const dueToday = mt.filter(t => t.due_date === today)
        const msg = await generateMessage(
          `Azərbaycan dilində qısa, mehriban günlük xülasə yaz.
          İşçi: ${m.full_name}.
          Açıq tapşırıq: ${mt.length}. Bu gün bitməli: ${dueToday.length}. Vaxtı keçmiş: ${overdue.length}.
          Maksimum 3 cümlə. Motivasiyaedici ol.`
        )
        if (waEnabled && m.whatsapp_number) await sendWA(m.whatsapp_number, msg)
        results.push({ member: m.full_name, message: msg.slice(0, 100) + '...' })
      }
      return res.json({ success: true, type, count: results.length, results })
    }

    // 2. DEADLINE XƏBƏRDARLIQLARİ — hər işçiyə öz deadlineləri
    if (type === 'deadline_warnings') {
      if (!(await isEnabled('agent_enabled'))) return res.json({ skipped: 'agent_disabled' })
      if (!(await isEnabled('deadline_warnings'))) return res.json({ skipped: 'disabled' })

      const results = []
      for (const days of [1, 3]) {
        const targetDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0]
        const { data: tasks } = await supabase.from('tasks')
          .select('title, profiles(full_name, whatsapp_number), projects(name)')
          .eq('due_date', targetDate).not('status', 'eq', 'done')
        for (const t of (tasks || [])) {
          if (!t.profiles?.whatsapp_number) continue
          const msg = await generateMessage(
            `Azərbaycan dilində deadline xəbərdarlığı.
            İşçi: ${t.profiles.full_name}. Tapşırıq: "${t.title}". Layihə: ${t.projects?.name || ''}.
            Qalan: ${days} gün. 2 cümlə.`
          )
          if (waEnabled) await sendWA(t.profiles.whatsapp_number, msg)
          results.push({ task: t.title, member: t.profiles.full_name, days })
        }
      }
      // Layihə deadlineləri (3 gün)
      const in3 = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
      const { data: projects } = await supabase.from('projects')
        .select('name, deadline, profiles(full_name, whatsapp_number)')
        .lte('deadline', in3).gte('deadline', today).not('status', 'eq', 'completed')
      for (const p of (projects || [])) {
        if (!p.profiles?.whatsapp_number) continue
        const daysLeft = Math.round((new Date(p.deadline) - new Date()) / 86400000)
        const msg = await generateMessage(
          `Azərbaycan dilində layihə deadline xəbərdarlığı.
          Rəhbər: ${p.profiles.full_name}. Layihə: "${p.name}". ${daysLeft} gün qaldı. 2 cümlə.`
        )
        if (waEnabled) await sendWA(p.profiles.whatsapp_number, msg)
        results.push({ project: p.name, daysLeft })
      }
      return res.json({ success: true, type, count: results.length, results })
    }

    // 3. GÖRÜŞ XATIRLATMALARİ — hər işçiyə öz görüşləri
    if (type === 'meeting_reminders') {
      if (!(await isEnabled('agent_enabled'))) return res.json({ skipped: 'agent_disabled' })
      if (!(await isEnabled('meeting_reminders'))) return res.json({ skipped: 'disabled' })

      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
      const { data: events } = await supabase.from('events')
        .select('title, event_date, start_time, profiles(full_name, whatsapp_number)')
        .eq('event_date', tomorrow)

      const results = []
      for (const e of (events || [])) {
        if (!e.profiles?.whatsapp_number) continue
        const msg = await generateMessage(
          `Azərbaycan dilində görüş xatırlatması.
          Şəxs: ${e.profiles.full_name}. Hadisə: "${e.title}". Sabah saat ${e.start_time || '?'}. 2 cümlə.`
        )
        if (waEnabled) await sendWA(e.profiles.whatsapp_number, msg)
        results.push({ event: e.title, member: e.profiles.full_name })
      }
      return res.json({ success: true, type, count: results.length, results })
    }

    // 4. PODRAT DEADLINE — podratçının öz nömrəsinə
    if (type === 'outsource_deadlines') {
      if (!(await isEnabled('agent_enabled'))) return res.json({ skipped: 'agent_disabled' })
      if (!(await isEnabled('outsource_deadlines'))) return res.json({ skipped: 'disabled' })

      const results = []
      for (const days of [1, 3, 7]) {
        const targetDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0]
        const { data: works } = await supabase.from('outsource_works')
          .select('title, contractor_name, contractor_phone, projects(name)')
          .eq('planned_deadline', targetDate).not('work_status', 'eq', 'completed')
        for (const w of (works || [])) {
          if (!w.contractor_phone) continue
          const msg = await generateMessage(
            `Azərbaycan dilində podrat deadline xəbərdarlığı.
            Podratçı: ${w.contractor_name}. İş: "${w.title}". Layihə: ${w.projects?.name || ''}.
            ${days} gün qaldı. Peşəkar ton. 2 cümlə.`
          )
          if (waEnabled) await sendWA(w.contractor_phone, msg)
          results.push({ work: w.title, contractor: w.contractor_name, days })
        }
      }
      return res.json({ success: true, type, count: results.length, results })
    }

    // 5. MALİYYƏ BİLDİRİŞLƏRİ — Talifa, Nicat, Turkan
    if (type === 'finance_alerts') {
      if (!(await isEnabled('agent_enabled'))) return res.json({ skipped: 'agent_disabled' })
      if (!(await isEnabled('finance_alerts'))) return res.json({ skipped: 'disabled' })

      const { data: overdue } = await supabase.from('receivables')
        .select('expected_amount, paid_amount').eq('paid', false).lt('expected_date', today)
      const totalOverdue = (overdue || []).reduce((s, r) => s + (r.expected_amount - r.paid_amount), 0)

      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
      const { data: recentIncomes } = await supabase.from('incomes').select('amount').gte('payment_date', weekAgo)
      const weekIncome = (recentIncomes || []).reduce((s, i) => s + i.amount, 0)

      const members = await getActiveMembers()
      const results = []
      for (const m of members) {
        const msg = await generateMessage(
          `Azərbaycan dilində maliyyə bildirişi yaz.
          Alıcı: ${m.full_name}.
          Gecikmiş alacaqlar: ${overdue?.length || 0} ədəd, cəmi ${fmt(totalOverdue)}.
          Bu həftəki daxilolmalar: ${fmt(weekIncome)}.
          Qısa, faktlar əsasında. 3 cümlə.`
        )
        if (waEnabled && m.whatsapp_number) await sendWA(m.whatsapp_number, msg)
        results.push({ member: m.full_name, message: msg.slice(0, 100) + '...' })
      }
      return res.json({ success: true, type, overdueCount: overdue?.length || 0, totalOverdue: Math.round(totalOverdue), weekIncome: Math.round(weekIncome), results })
    }

    // 6. KÖÇÜRMƏ XATIRLATMASİ — Talifa, Nicat, Turkan
    if (type === 'transfer_reminders') {
      if (!(await isEnabled('agent_enabled'))) return res.json({ skipped: 'agent_disabled' })
      if (!(await isEnabled('transfer_reminders'))) return res.json({ skipped: 'disabled' })

      const limit50 = new Date(Date.now() - 50 * 86400000).toISOString().split('T')[0]
      const { data: transfers } = await supabase.from('internal_transfers')
        .select('amount, transfer_date').eq('returned', false).lt('transfer_date', limit50)

      if (!transfers?.length) return res.json({ success: true, type, count: 0, message: 'Xatırlatma lazım deyil' })

      const totalAmount = transfers.reduce((s, t) => s + t.amount, 0)
      const members = await getActiveMembers()
      const results = []
      for (const m of members) {
        const msg = await generateMessage(
          `Azərbaycan dilində daxili köçürmə xatırlatması.
          Alıcı: ${m.full_name}.
          ${transfers.length} köçürmə 50+ gündür qaytarılmayıb. Cəmi: ${fmt(totalAmount)}.
          60 günlük limit yaxınlaşır. Xəbərdar edici ton. 2 cümlə.`
        )
        if (waEnabled && m.whatsapp_number) await sendWA(m.whatsapp_number, msg)
        results.push({ member: m.full_name, message: msg.slice(0, 100) + '...' })
      }
      return res.json({ success: true, type, count: transfers.length, totalAmount: Math.round(totalAmount), results })
    }

    // 7. HƏFTƏLİK HESABAT — Talifa, Nicat, Turkan
    if (type === 'weekly_report') {
      if (!(await isEnabled('agent_enabled'))) return res.json({ skipped: 'agent_disabled' })
      if (!(await isEnabled('weekly_report'))) return res.json({ skipped: 'disabled' })

      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
      const [inc, exp, tsk, prj] = await Promise.all([
        supabase.from('incomes').select('amount').gte('payment_date', weekAgo),
        supabase.from('expenses').select('amount').gte('payment_date', weekAgo),
        supabase.from('tasks').select('status').gte('updated_at', weekAgo + 'T00:00:00'),
        supabase.from('projects').select('status').eq('status', 'active'),
      ])
      const weekIncome = (inc.data || []).reduce((s, i) => s + i.amount, 0)
      const weekExpense = (exp.data || []).reduce((s, e) => s + e.amount, 0)
      const doneTasks = (tsk.data || []).filter(t => t.status === 'done').length
      const activeProjects = prj.data?.length || 0

      const members = await getActiveMembers()
      const results = []
      for (const m of members) {
        const msg = await generateMessage(
          `Azərbaycan dilində həftəlik hesabat yaz.
          Alıcı: ${m.full_name}.
          Bu həftə: Daxilolmalar: ${fmt(weekIncome)}. Xərclər: ${fmt(weekExpense)}.
          Xalis gəlir: ${fmt(weekIncome - weekExpense)}.
          Tamamlanan tapşırıqlar: ${doneTasks}. Aktiv layihələr: ${activeProjects}.
          Peşəkar ton. 4 cümlə.`
        )
        if (waEnabled && m.whatsapp_number) await sendWA(m.whatsapp_number, msg)
        results.push({ member: m.full_name, message: msg.slice(0, 100) + '...' })
      }
      return res.json({ success: true, type, weekIncome: Math.round(weekIncome), weekExpense: Math.round(weekExpense), doneTasks, activeProjects, results })
    }

    // 8. AYLIK İCAL — Talifa, Nicat, Turkan
    if (type === 'monthly_report') {
      if (!(await isEnabled('agent_enabled'))) return res.json({ skipped: 'agent_disabled' })
      if (!(await isEnabled('monthly_report'))) return res.json({ skipped: 'disabled' })

      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
      const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
      const [inc, exp, prj, cli] = await Promise.all([
        supabase.from('incomes').select('amount').gte('payment_date', monthStart).lte('payment_date', monthEnd),
        supabase.from('expenses').select('amount').gte('payment_date', monthStart).lte('payment_date', monthEnd),
        supabase.from('projects').select('status').eq('status', 'active'),
        supabase.from('clients').select('id').gte('created_at', monthStart + 'T00:00:00'),
      ])
      const monthIncome = (inc.data || []).reduce((s, i) => s + i.amount, 0)
      const monthExpense = (exp.data || []).reduce((s, e) => s + e.amount, 0)
      const monthName = new Date(monthStart).toLocaleDateString('az-AZ', { month: 'long', year: 'numeric' })

      const members = await getActiveMembers()
      const results = []
      for (const m of members) {
        const msg = await generateMessage(
          `Azərbaycan dilində aylıq icmal yaz.
          Alıcı: ${m.full_name}. Ay: ${monthName}.
          Daxilolmalar: ${fmt(monthIncome)}. Xərclər: ${fmt(monthExpense)}.
          Xalis gəlir: ${fmt(monthIncome - monthExpense)}.
          Aktiv layihələr: ${prj.data?.length || 0}. Yeni sifarişçilər: ${cli.data?.length || 0}.
          Peşəkar, analitik ton. 5 cümlə.`
        )
        if (waEnabled && m.whatsapp_number) await sendWA(m.whatsapp_number, msg)
        results.push({ member: m.full_name, message: msg.slice(0, 100) + '...' })
      }
      return res.json({ success: true, type, month: monthName, monthIncome: Math.round(monthIncome), monthExpense: Math.round(monthExpense), profit: Math.round(monthIncome - monthExpense), results })
    }

    return res.status(400).json({ error: 'Bilinməyən type', valid: ['daily_summary','deadline_warnings','meeting_reminders','outsource_deadlines','finance_alerts','transfer_reminders','weekly_report','monthly_report'] })

  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack?.split('\n').slice(0, 3) })
  }
}
