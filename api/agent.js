import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const GEMINI_KEY = process.env.GEMINI_API_KEY
const BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN
const TG_API     = `https://api.telegram.org/bot${BOT_TOKEN}`

const ADMIN_EMAILS = ['talifa.isgandarli@gmail.com', 'nusalov.n@reflect.az', 'turkan.a@reflect.az']
const BD_EMAILS    = ['talifa.isgandarli@gmail.com', 'turkan.a@reflect.az']

// ── Yardımçı funksiyalar ──────────────────────────────────────────────────────
async function sendTelegram(chat_id, text) {
  if (!chat_id || !text) return null
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
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    )
    const data = await res.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null
  } catch (e) {
    console.error('Gemini error:', e)
    return null
  }
}

async function getAllProfiles() {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, telegram_chat_id')
    .eq('is_active', true)
    .not('telegram_chat_id', 'is', null)
  return data || []
}

async function getAdminProfiles() {
  const all = await getAllProfiles()
  return all.filter(p => ADMIN_EMAILS.includes(p.email))
}

async function getBDProfiles() {
  const all = await getAllProfiles()
  return all.filter(p => BD_EMAILS.includes(p.email))
}

function fmt(n)    { return '₼' + Number(n || 0).toLocaleString('az-AZ', { minimumFractionDigits: 0 }) }
function fmtDate(d){ return new Date(d).toLocaleDateString('az-AZ', { day: 'numeric', month: 'long' }) }
function daysLeft(due) {
  const t = new Date(); t.setHours(0,0,0,0)
  const d = new Date(due); d.setHours(0,0,0,0)
  return Math.floor((d - t) / 86400000)
}

// ── Ana handler ───────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const type = req.query.type || req.body?.type

  // ── Manual mesaj ─────────────────────────────────────────────────────────────
  if (type === 'send_manual') {
    const { chat_id, message } = req.body || {}
    if (!chat_id || !message) return res.status(400).json({ error: 'chat_id and message required' })
    const result = await sendTelegram(chat_id, message)
    return res.status(200).json({ success: result?.ok, result })
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 1. 🌅 İŞÇİ ŞƏXSI BRİFİNQİ — saat 09:00
  //    Hər işçiyə fərdi: öz tapşırıqları + layihə konteksti + motivasiya
  // ════════════════════════════════════════════════════════════════════════════
  if (type === 'morning') {
    const profiles = await getAllProfiles()
    const admins   = await getAdminProfiles()
    const adminIds = admins.map(a => a.id)
    // Admin brifinqi ayrıca gedir — burada işçilər
    const workers  = profiles.filter(p => !adminIds.includes(p.id))
    if (!workers.length) return res.status(200).json({ success: true, count: 0 })

    const today    = new Date(); today.setHours(0,0,0,0)
    const todayStr = today.toISOString().split('T')[0]
    const in3days  = new Date(today.getTime() + 3 * 86400000).toISOString().split('T')[0]

    const [tasksRes, projectsRes, eventsRes] = await Promise.all([
      supabase.from('tasks').select('id, title, due_date, assignee_id, status, project_id').neq('status', 'done').not('due_date', 'is', null),
      supabase.from('projects').select('id, name, deadline, status').neq('status', 'completed'),
      supabase.from('events').select('title, start_date').eq('start_date', todayStr),
    ])
    const allTasks  = tasksRes.data   || []
    const allProjs  = projectsRes.data|| []
    const todayEvts = eventsRes.data  || []

    let count = 0
    for (const profile of workers) {
      const firstName = profile.full_name.split(' ')[0]

      // Öz tapşırıqları
      const myToday   = allTasks.filter(t => t.assignee_id === profile.id && t.due_date === todayStr)
      const myOverdue = allTasks.filter(t => {
        if (t.assignee_id !== profile.id) return false
        const d = new Date(t.due_date); d.setHours(0,0,0,0)
        return d < today
      })
      const myCritical = myOverdue.filter(t => Math.abs(daysLeft(t.due_date)) > 3)
      const myWarn    = allTasks.filter(t => {
        if (t.assignee_id !== profile.id) return false
        const d = daysLeft(t.due_date)
        return d >= 1 && d <= 3
      })

      // Layihə konteksti
      const myProjIds = [...new Set(allTasks.filter(t => t.assignee_id === profile.id).map(t => t.project_id).filter(Boolean))]
      const myProjects = allProjs.filter(p => myProjIds.includes(p.id)).map(p => {
        const openTasks = allTasks.filter(t => t.project_id === p.id && t.assignee_id === profile.id).length
        const dl = p.deadline ? daysLeft(p.deadline) : null
        return { ...p, openTasks, dl }
      })

      // Gemini ilə fərdi mesaj yaz
      const context = `
İşçi: ${profile.full_name}
Bu günün tapşırıqları: ${myToday.map(t => t.title).join(', ') || 'yoxdur'}
Gecikmiş tapşırıqlar: ${myOverdue.length > 0 ? myOverdue.map(t => `${t.title} (${Math.abs(daysLeft(t.due_date))}g)`).join(', ') : 'yoxdur'}
Kritik gecikmə (3+ gün): ${myCritical.length > 0 ? 'var' : 'yoxdur'}
Yaxın deadline (1-3 gün): ${myWarn.map(t => `${t.title} (${daysLeft(t.due_date)}g)`).join(', ') || 'yoxdur'}
Layihələr: ${myProjects.map(p => `${p.name} (deadline: ${p.dl !== null ? p.dl + 'g' : 'yoxdur'}, açıq tapşırıq: ${p.openTasks})`).join('; ') || 'yoxdur'}
Bu günün hadisələri: ${todayEvts.map(e => e.title).join(', ') || 'yoxdur'}
`

      const prompt = `Sən Reflect Architects şirkətinin AI köməkçisisən. ${firstName} üçün səhər brifinqi yaz.

Məlumatlar:
${context}

Tələblər:
- "Salam ${firstName}!" ilə başla
- Qısa, birbaşa, yoldaş tonu — rəsmi deyil
- Bəzən zarafat et, bəzən motivasiya ver (hər gün eyni deyil)
- Gecikmiş tapşırıq varsa — ciddi, amma incitməyən tonda xatırlat
- Kritik gecikmə (3+ gün) varsa — ayrıca vurğula
- Layihənin ümumi vəziyyətini qısa ver
- Azərbaycan dilinin qrammatikasına və leksikologiyasına tam riayət et
- Emoji ilə yazılsın
- 5-8 cümlə

Yalnız mesajı yaz, başqa heç nə əlavə etmə.`

      let text = await gemini(prompt)
      if (!text) {
        const lines = [`☀️ Salam, ${firstName}!`, '']
        if (myToday.length)   lines.push(`📋 Bu gün ${myToday.length} tapşırığın var.`)
        if (myOverdue.length) lines.push(`🔴 ${myOverdue.length} gecikmiş tapşırıq var!`)
        if (myCritical.length)lines.push(`🚨 Kritik gecikmə: ${myCritical.length} tapşırıq 3 gündən çoxdur gözləyir.`)
        if (myWarn.length)    lines.push(`⏰ Yaxın deadline: ${myWarn.map(t => t.title).join(', ')}`)
        myProjects.forEach(p => lines.push(`🏗 ${p.name}: ${p.openTasks} açıq tapşırıq${p.dl !== null ? `, ${p.dl} gün qalıb` : ''}`))
        text = lines.join('\n')
      }

      const r = await sendTelegram(profile.telegram_chat_id, text)
      if (r?.ok) count++
    }
    return res.status(200).json({ success: true, count })
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 2. 📊 ADMİN SABAH BRİFİNQİ — saat 09:00
  //    Nicat/Talifa/Türkan: komanda + maliyyə + BD (Talifa+Türkan)
  // ════════════════════════════════════════════════════════════════════════════
  if (type === 'morning_admin') {
    const admins  = await getAdminProfiles()
    const bdAdmins = await getBDProfiles()
    if (!admins.length) return res.status(200).json({ success: true, count: 0 })

    const today     = new Date(); today.setHours(0,0,0,0)
    const todayStr  = today.toISOString().split('T')[0]
    const in7days   = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0]
    const yesterday = new Date(today.getTime() - 86400000).toISOString()
    const monthStart= new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]

    const [
      tasksRes, membersRes, deadlineChanges,
      incomesRes, expensesRes, debtorsRes,
      outsourceRes, proposalsRes, contractsRes, pipelineRes
    ] = await Promise.all([
      supabase.from('tasks').select('id, title, due_date, assignee_id, status, tags, archived').neq('status', 'done'),
      supabase.from('profiles').select('id, full_name').eq('is_active', true),
      supabase.from('task_comments')
        .select('task_id, author_id, metadata, created_at, tasks(title), profiles(full_name)')
        .eq('type', 'activity').like('content', '%deadline%')
        .gte('created_at', yesterday).order('created_at', { ascending: false }),
      supabase.from('incomes').select('amount, payment_date, payment_method').gte('payment_date', monthStart),
      supabase.from('expenses').select('amount, expense_date').gte('expense_date', monthStart),
      supabase.from('debtor_records').select('client_name, amount, expected_date, status').neq('status', 'paid').order('expected_date'),
      supabase.from('outsource_works').select('name, planned_deadline, project_id, remaining, projects(name)').neq('status', 'completed').not('planned_deadline', 'is', null),
      supabase.from('proposals').select('client_name, amount, status').in('status', ['sent', 'negotiating']),
      supabase.from('contracts').select('client_name, status, signed_date').in('status', ['pending', 'negotiating']),
      supabase.from('pipeline').select('company_name, stage, estimated_value').order('created_at', { ascending: false }).limit(10),
    ])

    const allTasks  = (tasksRes.data || []).filter(t => !t.archived)
    const members   = membersRes.data || []
    const getName   = (id) => members.find(m => m.id === id)?.full_name || '—'

    // Maliyyə hesablamaları
    const totalIncome  = (incomesRes.data  || []).reduce((s,i) => s + Number(i.amount || 0), 0)
    const totalExpense = (expensesRes.data || []).reduce((s,e) => s + Number(e.amount || 0), 0)
    const balance      = totalIncome - totalExpense
    const overdueDebts = (debtorsRes.data || []).filter(d => d.expected_date && d.expected_date < todayStr)
    const criticalDebts= overdueDebts.filter(d => {
      const days = Math.abs(daysLeft(d.expected_date))
      return days > 7
    })
    const totalDebt    = (debtorsRes.data || []).reduce((s,d) => s + Number(d.amount || 0), 0)

    // Tapşırıq statistikası
    const overdueAll   = allTasks.filter(t => { const d = new Date(t.due_date); d.setHours(0,0,0,0); return d < today && t.due_date })
    const critical3    = overdueAll.filter(t => Math.abs(daysLeft(t.due_date)) > 3)
    const todayTasks   = allTasks.filter(t => t.due_date === todayStr)
    const weekTasks    = allTasks.filter(t => t.due_date > todayStr && t.due_date <= in7days)
    const dlChanges    = deadlineChanges.data || []

    // BD məlumatları
    const bdTasks      = allTasks.filter(t => (t.tags || []).includes('BD'))
    const outsourceDue = (outsourceRes.data || []).filter(o => {
      const d = daysLeft(o.planned_deadline)
      return d >= 0 && d <= 7
    })

    for (const admin of admins) {
      const firstName = admin.full_name.split(' ')[0]
      const isBD = bdAdmins.some(b => b.id === admin.id)

      const context = `
Admin: ${admin.full_name}

KOMANDA VƏZİYYƏTİ:
- Bu gün deadline: ${todayTasks.length} tapşırıq (${todayTasks.map(t => `${t.title} - ${getName(t.assignee_id)}`).join('; ')})
- Gecikmiş: ${overdueAll.length} tapşırıq
- Kritik gecikmə (3+ gün): ${critical3.length} tapşırıq (${critical3.map(t => `${t.title} - ${getName(t.assignee_id)} - ${Math.abs(daysLeft(t.due_date))}g`).join('; ')})
- Bu həftə deadline: ${weekTasks.length} tapşırıq
- Son 24 saatda deadline dəyişdirildi: ${dlChanges.length > 0 ? dlChanges.map(c => `${c.tasks?.title} - ${c.profiles?.full_name} (${c.metadata?.old_due || '?'} → ${c.metadata?.new_due || '?'})`).join('; ') : 'yoxdur'}

MALİYYƏ (Bu ay):
- Daxilolma: ${fmt(totalIncome)}
- Xərc: ${fmt(totalExpense)}
- Balans: ${fmt(balance)}
- Ümumi debitor borcu: ${fmt(totalDebt)}
- Gecikmiş ödənişlər: ${overdueDebts.length} (${fmt(overdueDebts.reduce((s,d) => s + Number(d.amount||0), 0))})
- Kritik gecikmiş (7+ gün): ${criticalDebts.length > 0 ? criticalDebts.map(d => `${d.client_name} ${fmt(d.amount)}`).join(', ') : 'yoxdur'}

${isBD ? `BD MƏLUMATLARİ:
- Aktiv BD tapşırıqları: ${bdTasks.length} (${bdTasks.map(t => t.title).join(', ') || 'yoxdur'})
- Pipeline: ${(pipelineRes.data || []).map(p => `${p.company_name} (${p.stage})`).join(', ') || 'yoxdur'}
- Göndərilmiş kommersiya təklifləri: ${(proposalsRes.data || []).length} (${(proposalsRes.data || []).map(p => p.client_name).join(', ')})
- İmzalanma gözlənilən müqavilələr: ${(contractsRes.data || []).length > 0 ? (contractsRes.data || []).map(c => c.client_name).join(', ') : 'yoxdur'}
- Bu həftə deadline olan podratçı işləri: ${outsourceDue.map(o => `${o.name} - ${o.projects?.name}`).join(', ') || 'yoxdur'}` : ''}
`

      const prompt = `Sən Reflect Architects şirkətinin AI köməkçisisən. ${firstName} üçün admin səhər brifinqi yaz.

Məlumatlar:
${context}

Tələblər:
- "Salam ${firstName}!" ilə başla
- Qısa, birbaşa, professional amma yoldaş tonu
- Kritik məlumatları (gecikmiş tapşırıqlar, ödənilməmiş borclar, deadline dəyişiklikləri) aydın vurğula
- Maliyyə vəziyyətini qısa xülasə et — həm ümumi mənzərəni, həm kritik olanları göstər
- ${isBD ? 'BD məlumatlarını da daxil et — pipeline, təkliflər, müqavilələr' : ''}
- Bəzən motivasiya ver, bəzən zarafat et
- Azərbaycan dilinin qrammatikasına və leksikologiyasına tam riayət et
- Emoji ilə yazılsın
- 8-12 cümlə

Yalnız mesajı yaz, başqa heç nə əlavə etmə.`

      let text = await gemini(prompt)
      if (!text) {
        const lines = [`📊 Salam, ${firstName}! Sabahın xeyir.`, '']
        lines.push(`👥 Bu gün ${todayTasks.length} tapşırıq deadline, ${overdueAll.length} gecikmiş.`)
        if (critical3.length) lines.push(`🚨 Kritik: ${critical3.length} tapşırıq 3+ gün gecikib.`)
        if (dlChanges.length) lines.push(`⚠️ Son 24 saatda ${dlChanges.length} deadline dəyişdirildi.`)
        lines.push(`💰 Bu ay: Daxilolma ${fmt(totalIncome)} | Xərc ${fmt(totalExpense)} | Balans ${fmt(balance)}`)
        if (criticalDebts.length) lines.push(`🔴 Kritik debitor: ${criticalDebts.map(d => `${d.client_name} ${fmt(d.amount)}`).join(', ')}`)
        if (isBD) {
          lines.push(`📈 BD: ${bdTasks.length} aktiv tapşırıq, ${(proposalsRes.data||[]).length} gözləyən təklif`)
        }
        text = lines.join('\n')
      }

      await sendTelegram(admin.telegram_chat_id, text)
    }
    return res.status(200).json({ success: true, count: admins.length })
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 3. ⏰ PODRATÇI DEADLİNE XƏBƏRDARLIQ — 5, 3, 1 gün əvvəl
  //    Nicat/Talifa/Türkan + layihənin memarına
  // ════════════════════════════════════════════════════════════════════════════
  if (type === 'outsource_deadline') {
    const admins   = await getAdminProfiles()
    const allProfiles = await getAllProfiles()

    const { data: outsource } = await supabase
      .from('outsource_works')
      .select('id, name, planned_deadline, project_id, projects(name, assignee_id)')
      .neq('status', 'completed')
      .not('planned_deadline', 'is', null)

    const targets = [1, 3, 5]
    let count = 0

    for (const work of (outsource || [])) {
      const d = daysLeft(work.planned_deadline)
      if (!targets.includes(d)) continue

      const projName = work.projects?.name || '—'
      const emoji    = d === 1 ? '🔴' : d === 3 ? '🟡' : '🟠'
      const dayText  = d === 1 ? 'sabah deadline!' : `${d} gün qalıb`

      const msg = `${emoji} <b>Podratçı deadline xəbərdarlığı</b>\n\n🔧 <b>${work.name}</b>\n🏗 Layihə: ${projName}\n⏰ Deadline: ${fmtDate(work.planned_deadline)} — <b>${dayText}</b>`

      // Adminlərə göndər
      for (const admin of admins) {
        const r = await sendTelegram(admin.telegram_chat_id, msg)
        if (r?.ok) count++
      }

      // Layihənin memarına da göndər (admin deyilsə)
      if (work.projects?.assignee_id) {
        const architect = allProfiles.find(p => p.id === work.projects.assignee_id && !ADMIN_EMAILS.includes(p.email))
        if (architect) {
          const r = await sendTelegram(architect.telegram_chat_id, msg)
          if (r?.ok) count++
        }
      }
    }
    return res.status(200).json({ success: true, count })
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 4. ⏰ TAPŞIRIQ DEADLINE XƏBƏRDARLIQ — saat 14:00
  //    Sabah deadline olan tapşırıqlar — yalnız cavabdehə
  // ════════════════════════════════════════════════════════════════════════════
  if (type === 'deadline_warning') {
    const profiles = await getAllProfiles()
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

    const { data: tasks } = await supabase.from('tasks')
      .select('title, due_date, assignee_id, project_id, projects(name)')
      .eq('due_date', tomorrow)
      .neq('status', 'done')

    let count = 0
    for (const task of (tasks || [])) {
      const profile = profiles.find(p => p.id === task.assignee_id)
      if (!profile) continue
      const firstName = profile.full_name.split(' ')[0]

      const prompt = `Sən Reflect Architects şirkətinin AI köməkçisisən.
${firstName} üçün qısa bir deadline xəbərdarlığı yaz. 
Tapşırıq: "${task.title}"${task.projects?.name ? ` (Layihə: ${task.projects.name})` : ''}
Deadline: sabah — ${fmtDate(task.due_date)}

Tələblər:
- "${firstName}," ilə başla
- Çox qısa — 2-3 cümlə
- Xatırlatma tonu — incitməyən, lakin ciddi
- Bəzən zarafat et, bəzən motivasiya ver
- Azərbaycan dilinin qrammatikasına riayət et
- Emoji istifadə et
Yalnız mesajı yaz.`

      let text = await gemini(prompt)
      if (!text) text = `⏰ ${firstName}, sabah deadline!\n\n📋 <b>${task.title}</b>${task.projects?.name ? `\n🏗 ${task.projects.name}` : ''}\n\nBu tapşırığı bu gün tamamlamağa çalış. 💪`

      const r = await sendTelegram(profile.telegram_chat_id, text)
      if (r?.ok) count++
    }
    return res.status(200).json({ success: true, count })
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 5. 🌆 AXŞAM MEMARLIQ SİTATI — saat 18:00
  //    Bütün komandaya — 4 tonlu Gemini
  // ════════════════════════════════════════════════════════════════════════════
  if (type === 'evening') {
    const profiles = await getAllProfiles()
    if (!profiles.length) return res.status(200).json({ success: true, count: 0 })

    const tones    = ['philosophical', 'sarcastic', 'emotional', 'thoughtful']
    const dayOfYear= Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
    const tone     = tones[dayOfYear % 4]

    const tonePrompts = {
      philosophical: `Dərin fəlsəfi ton. Rem Koolhaas, Louis Kahn, Peter Zumtor, Tadao Ando kimi ustadların düşüncə tərzindən ilham al. Memarlığın insan həyatı, zaman, məkan və cəmiyyətlə dərin əlaqəsini araşdıran orijinal bir fikir yaz. Nümunə: "Rem Koolhaas yazırdı: Bir binanın iki ömrü var — memarın xəyal etdiyi və insanların yaşatdığı. Bu iki ömür heç vaxt üst-üstə düşmür."`,
      sarcastic: `Ağır, düşündürücü, gülümsədən sarkazm tonu — Koolhaas-ın kəskin, lakin intellektual üslubu. Sifarişçilər, büdcə, reviziyalar, "sadə bir şey istəyirəm" kimi vəziyyətlər haqqında ağıllı, zarafatlı, eyni zamanda dərin bir müşahidə yaz. Nümunə: "'Sadəlik mürəkkəbliyin ən yüksək ifadəsidir' — Leonardo da Vinci. Bunu sifarişçiyə anlatmaq isə ondan da mürəkkəb bir məsələdir."`,
      emotional: `İlhamverici, emosional ton. Zaha Hədid, Tadao Ando, Alvaro Siza kimi memarların həyat hekayələrindən ilham al. Yaradıcılığın çətinliyi, gözəlliyin dəyəri, əsər yaratmağın sevinci haqqında içdən bir söz. Nümunə: "Zaha Hədidin lüğətində 'mümkün deyil' ifadəsi yox idi. O, sadəcə başqalarının hələ görə bilmədiyi şeyləri əvvəlcədən görürdü."`,
      thoughtful: `Düşündürücü, gözlənilməz ton. Memarlıq haqqında qeyri-standart bir müşahidə — paradoksal həqiqətlər, gözlənilməz analogiyalar. Nümunə: "Koolhaas demişdi: 'Bəzən infrastruktur memarlıqdan daha vacibdir.' Bəzən yaxşı düşünülmüş bir dəhliz bütün binadan daha çox şey söyləyir."`,
    }

    const intro = 'Yaxşı memar üçün iş günü heç vaxt tam bitmir — o, sadəcə başqa bir formaya keçir.'

    const prompt = `Sən Reflect Architects şirkətinin AI köməkçisisən. Axşam saatı bütün komandaya ilham vermək üçün bir mesaj yazırsan.

Ton: ${tonePrompts[tone]}

Tələblər:
- Azərbaycan dilinin qrammatikasına və leksikologiyasına tam riayət et
- Memarların gündəlik həyatına aid, real hiss doğuran məzmun
- Heç bir emoji, heç bir başlıq — sadə, gözəl mətn
- 3-5 cümlə, bütöv bir fikir
Yalnız mətni yaz.`

    let quote = await gemini(prompt)
    if (!quote || quote.length < 20) {
      const fallbacks = {
        philosophical: 'Rem Koolhaas yazırdı: bir binanın iki ömrü var — memarın xəyal etdiyi və insanların yaşatdığı. Bu iki ömür heç vaxt üst-üstə düşmür. Bəlkə bu, memarlığın ən dərin həqiqətidir.',
        sarcastic: '"Sadəlik mürəkkəbliyin ən yüksək ifadəsidir" — Leonardo da Vinci. Bunu sifarişçiyə anlatmaq isə ondan da mürəkkəb bir məsələdir. Amma siz hər gün cəhd edirsiniz — bu özü böyük bir bacarıqdır.',
        emotional: 'Zaha Hədidin lüğətində "mümkün deyil" ifadəsi yox idi. O, sadəcə başqalarının hələ görə bilmədiyi şeyləri əvvəlcədən görürdü. Hər əsər, əvvəlcə cəsarətli bir xəyal idi.',
        thoughtful: 'Koolhaas demişdi: "Bəzən infrastruktur memarlıqdan daha vacibdir." Bəzən yaxşı düşünülmüş bir dəhliz bütün binadan daha çox şey söyləyir. Böyük ideyalar həmişə böyük formalarda gizlənmir.',
      }
      quote = fallbacks[tone]
    }

    const message = `🌆 <i>${intro}</i>\n\n${quote}`
    let count = 0
    for (const p of profiles) {
      const r = await sendTelegram(p.telegram_chat_id, message)
      if (r?.ok) count++
    }
    return res.status(200).json({ success: true, count, tone })
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 6. 📈 HƏFTƏLİK HESABAT — Cümə 17:00, yalnız adminlərə
  // ════════════════════════════════════════════════════════════════════════════
  if (type === 'weekly_report') {
    const admins   = await getAdminProfiles()
    const bdAdmins = await getBDProfiles()
    if (!admins.length) return res.status(200).json({ success: true, count: 0 })

    const today     = new Date(); today.setHours(0,0,0,0)
    const todayStr  = today.toISOString().split('T')[0]
    const weekAgo   = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0]
    const in7days   = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0]
    const monthStart= new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]

    const [
      tasksRes, membersRes, dlChanges,
      incomesMonth, expensesMonth, incomesWeek, expensesWeek,
      debtorsRes, outsourceRes, proposalsRes, contractsRes
    ] = await Promise.all([
      supabase.from('tasks').select('id, title, due_date, assignee_id, status, tags, archived, updated_at'),
      supabase.from('profiles').select('id, full_name').eq('is_active', true),
      supabase.from('task_comments')
        .select('task_id, author_id, metadata, created_at, tasks(title), profiles(full_name)')
        .eq('type', 'activity').like('content', '%deadline%')
        .gte('created_at', new Date(today.getTime() - 7 * 86400000).toISOString())
        .order('created_at', { ascending: false }),
      supabase.from('incomes').select('amount, payment_date, payment_method').gte('payment_date', monthStart),
      supabase.from('expenses').select('amount, expense_date, description').gte('expense_date', monthStart),
      supabase.from('incomes').select('amount').gte('payment_date', weekAgo),
      supabase.from('expenses').select('amount').gte('expense_date', weekAgo),
      supabase.from('debtor_records').select('client_name, amount, expected_date, status').neq('status', 'paid'),
      supabase.from('outsource_works').select('name, planned_deadline, status, projects(name)').neq('status', 'completed').not('planned_deadline', 'is', null),
      supabase.from('proposals').select('client_name, amount, status').in('status', ['sent', 'negotiating']),
      supabase.from('contracts').select('client_name, status').in('status', ['pending', 'negotiating']),
    ])

    const allTasks  = tasksRes.data || []
    const members   = membersRes.data || []
    const getName   = (id) => members.find(m => m.id === id)?.full_name || '—'

    // Maliyyə
    const weekIncome  = (incomesWeek.data  || []).reduce((s,i) => s + Number(i.amount || 0), 0)
    const weekExpense = (expensesWeek.data || []).reduce((s,e) => s + Number(e.amount || 0), 0)
    const monthIncome = (incomesMonth.data || []).reduce((s,i) => s + Number(i.amount || 0), 0)
    const monthExpense= (expensesMonth.data|| []).reduce((s,e) => s + Number(e.amount || 0), 0)
    const totalDebt   = (debtorsRes.data   || []).reduce((s,d) => s + Number(d.amount || 0), 0)
    const overdueDebt = (debtorsRes.data   || []).filter(d => d.expected_date && d.expected_date < todayStr)

    // Tapşırıq statistikası
    const doneTasks    = allTasks.filter(t => t.status === 'done' && t.updated_at >= weekAgo && !t.archived)
    const overdueNow   = allTasks.filter(t => { if (t.status === 'done' || t.archived || !t.due_date) return false; const d = new Date(t.due_date); d.setHours(0,0,0,0); return d < today })
    const critical3    = overdueNow.filter(t => Math.abs(daysLeft(t.due_date)) > 3)
    const nextWeekDL   = allTasks.filter(t => t.due_date > todayStr && t.due_date <= in7days && t.status !== 'done' && !t.archived)
    const bdTasks      = allTasks.filter(t => (t.tags || []).includes('BD') && t.status !== 'done')
    const dlChangesArr = dlChanges.data || []

    // Podratçı
    const outsourceSoon= (outsourceRes.data || []).filter(o => { const d = daysLeft(o.planned_deadline); return d >= 0 && d <= 14 })

    for (const admin of admins) {
      const firstName = admin.full_name.split(' ')[0]
      const isBD = bdAdmins.some(b => b.id === admin.id)

      const context = `
Admin: ${admin.full_name}
Tarix: ${new Date().toLocaleDateString('az-AZ', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}

MALİYYƏ:
Bu həftə:
- Daxilolma: ${fmt(weekIncome)}
- Xərc: ${fmt(weekExpense)}  
- Balans: ${fmt(weekIncome - weekExpense)}

Bu ay (${new Date().toLocaleDateString('az-AZ', { month:'long' })}):
- Daxilolma: ${fmt(monthIncome)}
- Xərc: ${fmt(monthExpense)}
- Balans: ${fmt(monthIncome - monthExpense)}

Debitor borclar:
- Ümumi: ${fmt(totalDebt)}
- Gecikmiş ödənişlər: ${overdueDebt.length} müştəri (${fmt(overdueDebt.reduce((s,d)=>s+Number(d.amount||0),0))})
${overdueDebt.slice(0,4).map(d => `  • ${d.client_name}: ${fmt(d.amount)}`).join('\n')}

TAPŞIRIQLAR:
- Bu həftə tamamlanan: ${doneTasks.length} (${doneTasks.map(t => `${t.title} - ${getName(t.assignee_id)}`).slice(0,5).join('; ')})
- Gecikmiş: ${overdueNow.length} tapşırıq
- Kritik gecikmə (3+ gün): ${critical3.length} (${critical3.map(t => `${t.title} - ${getName(t.assignee_id)} - ${Math.abs(daysLeft(t.due_date))}g`).slice(0,4).join('; ')})
- Deadline dəyişiklikləri: ${dlChangesArr.length} (${dlChangesArr.map(c => `${c.tasks?.title} - ${c.profiles?.full_name}`).slice(0,4).join('; ')})
- Gələn həftə deadline: ${nextWeekDL.length} tapşırıq (${nextWeekDL.map(t => `${t.title} - ${getName(t.assignee_id)} - ${daysLeft(t.due_date)}g`).slice(0,5).join('; ')})

PODRATÇI İŞLƏRİ:
- 2 həftə içində deadline: ${outsourceSoon.map(o => `${o.name} (${o.projects?.name}, ${daysLeft(o.planned_deadline)}g)`).join(', ') || 'yoxdur'}

${isBD ? `BD MƏLUMATLARİ:
- Aktiv BD tapşırıqları: ${bdTasks.length} (${bdTasks.map(t => t.title).join(', ')})
- Gözləyən kommersiya təklifləri: ${(proposalsRes.data||[]).length} (${(proposalsRes.data||[]).map(p => p.client_name).join(', ')})
- İmzalanma gözlənilən müqavilələr: ${(contractsRes.data||[]).length > 0 ? (contractsRes.data||[]).map(c => c.client_name).join(', ') : 'yoxdur'}` : ''}
`

      const prompt = `Sən Reflect Architects şirkətinin AI köməkçisisən. ${firstName} üçün həftəlik hesabat yaz.

Məlumatlar:
${context}

Tələblər:
- "Salam ${firstName}! Cümə axşamı hesabatı 📊" ilə başla
- Maliyyə nəticələrini həm bu həftə, həm bu ay üzrə göstər
- Gecikmiş borcları, kritik tapşırıqları aydın vurğula
- Uğurları da qeyd et (tamamlanan tapşırıqlar)
- ${isBD ? 'BD məlumatlarını ayrıca blokda göstər' : ''}
- Gələn həftənin prioritetlərini qısa xülasə et
- Azərbaycan dilinin qrammatikasına və leksikologiyasına tam riayət et
- Professional amma yoldaş tonu, emoji ilə
- 12-18 cümlə, bölümlər üzrə strukturlu

Yalnız mesajı yaz.`

      let text = await gemini(prompt)
      if (!text) {
        const lines = [`📈 Salam, ${firstName}! Cümə axşamı hesabatı.`, '']
        lines.push(`💰 Bu həftə: Daxilolma ${fmt(weekIncome)} | Xərc ${fmt(weekExpense)} | Balans ${fmt(weekIncome-weekExpense)}`)
        lines.push(`📅 Bu ay: Daxilolma ${fmt(monthIncome)} | Xərc ${fmt(monthExpense)}`)
        if (overdueDebt.length) lines.push(`🔴 Gecikmiş borclar: ${overdueDebt.length} müştəri, ${fmt(overdueDebt.reduce((s,d)=>s+Number(d.amount||0),0))}`)
        lines.push(`✅ Bu həftə tamamlanan tapşırıqlar: ${doneTasks.length}`)
        if (critical3.length) lines.push(`🚨 Kritik gecikmiş tapşırıqlar: ${critical3.length}`)
        if (dlChangesArr.length) lines.push(`⚠️ Deadline dəyişiklikləri: ${dlChangesArr.length}`)
        lines.push(`📋 Gələn həftə: ${nextWeekDL.length} tapşırıq deadline`)
        text = lines.join('\n')
      }

      await sendTelegram(admin.telegram_chat_id, text)
    }
    return res.status(200).json({ success: true, count: admins.length })
  }

  return res.status(400).json({ error: 'Bilinməyən type: ' + type })
}
