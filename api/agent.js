import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const GEMINI_KEY   = process.env.GEMINI_API_KEY
const BOT_TOKEN    = process.env.TELEGRAM_BOT_TOKEN
const TG_API       = `https://api.telegram.org/bot${BOT_TOKEN}`
const ADMIN_EMAILS = ['talifa.isgandarli@gmail.com', 'nusalov.n@reflect.az', 'turkan.a@reflect.az']
const BD_EMAILS    = ['talifa.isgandarli@gmail.com', 'turkan.a@reflect.az']
const NICAT_EMAIL  = 'nusalov.n@reflect.az'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SIGNATURE = '\n\n✦ Mirai · Reflect Architects'

async function tg(chat_id, text) {
  if (!chat_id || !text) return null
  try {
    // Telegram 4096 char limit — imza əlavə et
    const msg = (String(text) + SIGNATURE).slice(0, 4000)
    const r = await fetch(`${TG_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: String(chat_id), text: msg, parse_mode: 'HTML' })
    })
    const d = await r.json()
    // If HTML parse fails, retry without parse_mode
    if (!d.ok && d.description && d.description.includes('parse')) {
      const r2 = await fetch(`${TG_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: String(chat_id), text: msg.replace(/<[^>]+>/g, '') })
      })
      return r2.json()
    }
    return d
  } catch (e) {
    console.error('TG error:', e.message)
    return null
  }
}

async function ai(prompt) {
  if (!GEMINI_KEY) return null
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    )
    const d = await r.json()
    return d?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null
  } catch (e) {
    console.error('Gemini error:', e.message)
    return null
  }
}

async function db(table, query) {
  try {
    return query
  } catch (e) {
    console.error(`DB error ${table}:`, e.message)
    return { data: [], error: e }
  }
}

async function getProfiles(filter) {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, telegram_chat_id')
    .eq('is_active', true)
    .not('telegram_chat_id', 'is', null)
  const all = data || []
  if (filter === 'admins') return all.filter(p => ADMIN_EMAILS.includes(p.email))
  if (filter === 'bd')     return all.filter(p => BD_EMAILS.includes(p.email))
  if (filter === 'nicat')  return all.filter(p => p.email === NICAT_EMAIL)
  return all
}

function money(n) {
  return '₼' + Number(n || 0).toLocaleString('az-AZ', { minimumFractionDigits: 0 })
}

function date(d) {
  return new Date(d).toLocaleDateString('az-AZ', { day: 'numeric', month: 'long' })
}

function days(due) {
  const t = new Date(); t.setHours(0,0,0,0)
  const d = new Date(due); d.setHours(0,0,0,0)
  return Math.floor((d - t) / 86400000)
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function ago(n) {
  return new Date(Date.now() - n * 86400000).toISOString().split('T')[0]
}

function future(n) {
  return new Date(Date.now() + n * 86400000).toISOString().split('T')[0]
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  const type = req.query?.type || req.body?.type

  if (!type) return res.status(400).json({ error: 'type required' })

  console.log('[agent] type:', type)

  try {

    // ══════════════════════════════════════════════════════════════════════════
    // MANUAL MESAJ
    // ══════════════════════════════════════════════════════════════════════════
    if (type === 'send_manual') {
      const { chat_id, message } = req.body || {}
      if (!chat_id || !message) return res.status(400).json({ error: 'chat_id and message required' })
      const r = await tg(chat_id, message)
      return res.json({ success: r?.ok === true, result: r })
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 1. İŞÇİ ŞƏXSI BRİFİNQ — 09:00
    // ══════════════════════════════════════════════════════════════════════════
    if (type === 'morning') {
      const all     = await getProfiles()
      const admins  = await getProfiles('admins')
      const adminIds= new Set(admins.map(a => a.id))
      const workers = all.filter(p => !adminIds.has(p.id))

      if (!workers.length) return res.json({ success: true, count: 0, note: 'no workers' })

      const td = today()

      const [tRes, pRes, eRes] = await Promise.all([
        supabase.from('tasks').select('id,title,due_date,assignee_id,status,project_id')
          .neq('status', 'done').not('due_date', 'is', null),
        supabase.from('projects').select('id,name,deadline').neq('status', 'completed'),
        supabase.from('events').select('title,tagged_profiles').eq('start_date', td),
      ])

      const tasks    = tRes.data || []
      const projects = pRes.data || []
      const events   = eRes.data || []

      let count = 0
      for (const p of workers) {
        try {
          const name  = p.full_name.split(' ')[0]
          const myT   = tasks.filter(t => t.assignee_id === p.id)
          const td0   = myT.filter(t => t.due_date === td)
          const over  = myT.filter(t => days(t.due_date) < 0)
          const crit  = over.filter(t => Math.abs(days(t.due_date)) > 3)
          const warn  = myT.filter(t => { const d = days(t.due_date); return d >= 1 && d <= 3 })
          const myEvt = events.filter(e => !e.tagged_profiles?.length || e.tagged_profiles.includes(p.id))

          const myProjIds = [...new Set(myT.map(t => t.project_id).filter(Boolean))]
          const myProj = projects.filter(p2 => myProjIds.includes(p2.id)).map(p2 => {
            const open = myT.filter(t => t.project_id === p2.id).length
            const dl   = p2.deadline ? days(p2.deadline) : null
            return { name: p2.name, open, dl }
          })

          const ctx = [
            `İşçi: ${p.full_name}`,
            `Bu günün tapşırıqları: ${td0.map(t => t.title).join(', ') || 'yoxdur'}`,
            `Gecikmiş: ${over.length > 0 ? over.map(t => t.title + ' (' + Math.abs(days(t.due_date)) + 'g)').join(', ') : 'yoxdur'}`,
            `Kritik gecikmə (3+g): ${crit.length > 0 ? 'var' : 'yoxdur'}`,
            `1-3 gün deadline: ${warn.map(t => t.title + ' (' + days(t.due_date) + 'g)').join(', ') || 'yoxdur'}`,
            `Layihələr: ${myProj.map(p2 => p2.name + ' (' + p2.open + ' tapşırıq' + (p2.dl !== null ? ', ' + p2.dl + 'g' : '') + ')').join('; ') || 'yoxdur'}`,
            `Bu günün hadisələri: ${myEvt.map(e => e.title).join(', ') || 'yoxdur'}`,
          ].join('\n')

          const prompt = 'Sən Reflect Architects AI koməkçisisən. ' + name + ' ucun sehər brifinqi yaz.\n\n' + ctx + '\n\nTələblər:\n- "Salam ' + name + '!" ile başla\n- Qısa, birbaşa, yoldaş tonu\n- Gecikmiş varsa ciddi amma incitməyən tonda xatırlat\n- Kritik gecikmə varsa ayrıca vurğula\n- Layihə vəziyyətini qısa ver\n- Bəzən zarafat, bəzən motivasiya\n- Azərbaycan dilinin qrammatikasına riayət et\n- Emoji ile, 4-7 cümlə\n- Yalnız mesajı yaz'

          let text = await ai(prompt)
          if (!text) {
            const lines = ['☀️ Salam, ' + name + '!']
            if (td0.length)   lines.push('📋 Bu gün ' + td0.length + ' tapşırığın var.')
            if (crit.length)  lines.push('🚨 Kritik gecikmə: ' + crit.length + ' tapşırıq 3+ gün gözləyir!')
            else if (over.length) lines.push('🔴 ' + over.length + ' gecikmiş tapşırıq var.')
            if (warn.length)  lines.push('⏰ Yaxın deadline: ' + warn.map(t => t.title).join(', '))
            myProj.forEach(p2 => lines.push('🏗 ' + p2.name + ': ' + p2.open + ' tapşırıq' + (p2.dl !== null ? ', ' + p2.dl + ' gün qalıb' : '')))
            if (myEvt.length) lines.push('📅 Bugün: ' + myEvt.map(e => e.title).join(', '))
            text = lines.join('\n')
          }

          const r = await tg(p.telegram_chat_id, text)
          if (r?.ok) count++
        } catch (e) {
          console.error('morning worker error:', p.full_name, e.message)
        }
      }
      return res.json({ success: true, count })
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 2. ADMİN SƏHƏR BRİFİNQİ — 09:00
    // ══════════════════════════════════════════════════════════════════════════
    if (type === 'morning_admin') {
      const admins = await getProfiles('admins')
      if (!admins.length) return res.json({ success: true, count: 0 })

      const td   = today()
      const in7  = future(7)
      const yest = new Date(Date.now() - 86400000).toISOString()
      const mon  = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

      const [tRes, mRes, dlRes, incRes, expRes, debRes, outRes, propRes] = await Promise.all([
        supabase.from('tasks').select('id,title,due_date,assignee_id,status,tags').neq('status', 'done'),
        supabase.from('profiles').select('id,full_name').eq('is_active', true),
        supabase.from('task_comments')
          .select('metadata,created_at,tasks(title),profiles(full_name)')
          .eq('type', 'activity').ilike('content', '%deadline%')
          .gte('created_at', yest).order('created_at', { ascending: false }),
        supabase.from('incomes').select('amount').gte('payment_date', mon),
        supabase.from('expenses').select('amount').gte('expense_date', mon),
        supabase.from('receivables').select('client_name,expected_amount,expected_date').eq('paid', false),
        supabase.from('outsource_works').select('name,planned_deadline,projects(name)').neq('status', 'completed').not('planned_deadline', 'is', null),
        supabase.from('proposals').select('client_name,status').neq('status', 'signed').neq('status', 'rejected'),
      ])

      const allT   = tRes.data || []
      const membs  = mRes.data || []
      const name_  = (id) => membs.find(m => m.id === id)?.full_name || '—'

      const inc    = (incRes.data || []).reduce((s,i) => s + Number(i.amount || 0), 0)
      const exp    = (expRes.data || []).reduce((s,e) => s + Number(e.amount || 0), 0)
      const debs   = debRes.data || []
      const overDeb= debs.filter(d => d.expected_date && d.expected_date < td)
      const totalD = debs.reduce((s,d) => s + Number(d.expected_amount || 0), 0)

      const overT  = allT.filter(t => t.due_date && days(t.due_date) < 0)
      const crit3  = overT.filter(t => Math.abs(days(t.due_date)) > 3)
      const todayT = allT.filter(t => t.due_date === td)
      const weekT  = allT.filter(t => t.due_date > td && t.due_date <= in7)
      const dlCh   = dlRes.data || []
      const outsoon= (outRes.data || []).filter(o => { const d = days(o.planned_deadline); return d >= 0 && d <= 7 })

      const bdAdmins = await getProfiles('bd')
      const bdIds    = new Set(bdAdmins.map(b => b.id))

      let count = 0
      for (const admin of admins) {
        try {
          const nm   = admin.full_name.split(' ')[0]
          const isBD = bdIds.has(admin.id)

          const ctx = [
            'KOMANDA:',
            'Bu gun deadline: ' + todayT.length + ' tapshiriq',
            todayT.slice(0,4).map(t => '  - ' + t.title + ' (' + name_(t.assignee_id) + ')').join('\n'),
            'Gecikmiş: ' + overT.length,
            'Kritik (3+g): ' + crit3.length + (crit3.length ? ' - ' + crit3.slice(0,3).map(t => t.title + ' ' + name_(t.assignee_id)).join(', ') : ''),
            'Bu həftə deadline: ' + weekT.length,
            dlCh.length ? 'Deadline dəyişikliyi (24s): ' + dlCh.slice(0,3).map(c => (c.tasks?.title || '?') + ' - ' + (c.profiles?.full_name || '?') + ' (' + (c.metadata?.old_due || '?') + ' -> ' + (c.metadata?.new_due || '?') + ')').join('; ') : '',
            '',
            'MALİYYƏ (bu ay):',
            'Daxilolma: ' + money(inc),
            'Xərc: ' + money(exp),
            'Balans: ' + money(inc - exp),
            'Debitor borc: ' + money(totalD),
            'Gecikmiş odənişlər: ' + overDeb.length + (overDeb.length ? ' - ' + overDeb.slice(0,3).map(d => d.client_name + ' ' + money(d.expected_amount)).join(', ') : ''),
            outsoon.length ? 'Podratchi deadline (7g): ' + outsoon.map(o => o.name + (o.projects?.name ? ' (' + o.projects.name + ')' : '')).join(', ') : '',
            isBD ? ('\nBD: ' + allT.filter(t => (t.tags||[]).includes('BD') && t.status !== 'done').length + ' aktiv tapshiriq, ' + (propRes.data||[]).length + ' goyleyen tekllif') : '',
          ].filter(Boolean).join('\n')

          const prompt = 'Sen Reflect Architects AI koməkçisisən. ' + nm + ' ucun admin sehər brifinqi yaz.\n\n' + ctx + '\n\nTələblər:\n- "Salam ' + nm + '!" ile başla\n- Qısa, professional amma yoldaş tonu\n- Kritik məlumatları vurğula\n- ' + (isBD ? 'BD məlumatlarını da qeyd et' : '') + '\n- Azərbaycan dilinin qrammatikasına riayət et\n- Emoji ile, 6-10 cümlə\n- Yalnız mesajı yaz'

          let text = await ai(prompt)
          if (!text) {
            text = '📊 Salam, ' + nm + '!\n\n' +
              '👥 Bu gün ' + todayT.length + ' deadline, ' + overT.length + ' gecikmiş tapşırıq.\n' +
              (crit3.length ? '🚨 Kritik: ' + crit3.length + ' tapşırıq 3+ gün gecikib.\n' : '') +
              '💰 Bu ay: ' + money(inc) + ' gəlir | ' + money(exp) + ' xərc | ' + money(inc - exp) + ' balans\n' +
              (overDeb.length ? '🔴 Gecikmiş borclar: ' + overDeb.length + ' müştəri\n' : '')
          }

          const r = await tg(admin.telegram_chat_id, text)
          if (r?.ok) count++
        } catch (e) {
          console.error('morning_admin error:', admin.full_name, e.message)
        }
      }
      return res.json({ success: true, count })
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 3. PODRATÇI DEADLINE — 09:00, 5/3/1 gün əvvəl
    // ══════════════════════════════════════════════════════════════════════════
    if (type === 'outsource_deadline') {
      const admins = await getProfiles('admins')
      const all    = await getProfiles()

      const { data: works } = await supabase
        .from('outsource_works')
        .select('id,name,planned_deadline,project_id,projects(name,assignee_id)')
        .neq('status', 'completed')
        .not('planned_deadline', 'is', null)

      let count = 0
      for (const w of (works || [])) {
        try {
          const d = days(w.planned_deadline)
          if (![1, 3, 5].includes(d)) continue

          const emoji   = d === 1 ? '🔴' : d === 3 ? '🟡' : '🟠'
          const dayText = d === 1 ? 'sabah deadline!' : d + ' gun qalıb'
          const msg = emoji + ' <b>Podratçı deadline</b>\n\n🔧 <b>' + w.name + '</b>\n🏗 ' + (w.projects?.name || '—') + '\n⏰ ' + date(w.planned_deadline) + ' — ' + dayText

          for (const a of admins) {
            const r = await tg(a.telegram_chat_id, msg)
            if (r?.ok) count++
          }

          if (w.projects?.assignee_id) {
            const arch = all.find(p => p.id === w.projects.assignee_id && !ADMIN_EMAILS.includes(p.email))
            if (arch) {
              const r = await tg(arch.telegram_chat_id, msg)
              if (r?.ok) count++
            }
          }
        } catch (e) {
          console.error('outsource error:', w.name, e.message)
        }
      }
      return res.json({ success: true, count })
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 4. NİCAT GÜNÜN GÖRÜŞÜ — 09:30
    // ══════════════════════════════════════════════════════════════════════════
    if (type === 'nicat_events') {
      const nicats = await getProfiles('nicat')
      const nicat  = nicats[0]
      if (!nicat) return res.json({ success: false, note: 'Nicat not found or no Telegram' })

      const td = today()
      const { data: events } = await supabase
        .from('events')
        .select('title,notes,event_type,tagged_profiles')
        .eq('start_date', td)
        .order('created_at')

      if (!events?.length) {
        await tg(nicat.telegram_chat_id, '📅 <b>Bu gunun proqramı, Nicat!</b>\n\nBu gün planlaşdırılmış görüş yoxdur. Yaxşı iş günü! 🏗')
        return res.json({ success: true, count: 0 })
      }

      const TYPE_MAP = { meeting: '🤝', deadline: '🔴', holiday: '🎉', birthday: '🎂', event: '📅', other: '📌' }
      const all = await getProfiles()
      const nm_ = (id) => all.find(p => p.id === id)?.full_name?.split(' ')[0] || '?'

      const list = events.map((e, i) => {
        const em = TYPE_MAP[e.event_type] || '📌'
        const tagged = (e.tagged_profiles || []).map(id => nm_(id)).filter(Boolean)
        return (i + 1) + '. ' + em + ' ' + e.title +
          (e.notes ? ' — ' + e.notes : '') +
          (tagged.length ? ' (İştirakçı: ' + tagged.join(', ') + ')' : '')
      }).join('\n')

      const prompt = 'Sen Reflect Architects AI koməkçisisən. Nicat ucun bu gunun goruşlərini xulasele.\n\nHadisələr:\n' + list + '\n\nTələblər:\n- "Salam Nicat! Bu gunun proqramı:" ile başla\n- Hər hadisəni qısa, aydın qeyd et\n- İştirakçılar varsa xatırlat\n- Standup hazırlıq tonu — qısa, birbaşa\n- Azərbaycan dilinin qrammatikasına riayət et\n- Emoji ile, 3-5 cümlə\n- Yalnız mesajı yaz'

      let text = await ai(prompt)
      if (!text) {
        text = '📅 <b>Bu gunun proqramı, Nicat!</b>\n\n' + events.map(e => (TYPE_MAP[e.event_type] || '📌') + ' <b>' + e.title + '</b>' + (e.notes ? '\n   <i>' + e.notes + '</i>' : '')).join('\n')
      }

      const r = await tg(nicat.telegram_chat_id, text)
      return res.json({ success: r?.ok === true, count: r?.ok ? 1 : 0 })
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 5. DEADLINE XƏBƏRDARLIQ — 14:00, 1/3/5 gün
    // ══════════════════════════════════════════════════════════════════════════
    if (type === 'deadline_warning') {
      const all = await getProfiles()

      const { data: tasks } = await supabase
        .from('tasks')
        .select('title,due_date,assignee_id,projects(name)')
        .neq('status', 'done')
        .not('due_date', 'is', null)

      // Group by assignee
      const byUser = {}
      for (const t of (tasks || [])) {
        const d = days(t.due_date)
        if (![1, 3, 5].includes(d) || !t.assignee_id) continue
        if (!byUser[t.assignee_id]) byUser[t.assignee_id] = []
        byUser[t.assignee_id].push({ ...t, d })
      }

      let count = 0
      for (const [uid, myTasks] of Object.entries(byUser)) {
        try {
          const p = all.find(p => p.id === uid)
          if (!p) continue
          const nm = p.full_name.split(' ')[0]
          const sorted = myTasks.sort((a, b) => a.d - b.d)

          const list = sorted.map(t => {
            const em = t.d === 1 ? '🔴' : t.d === 3 ? '🟡' : '🟠'
            return em + ' ' + t.title + (t.projects?.name ? ' (' + t.projects.name + ')' : '') + ' — ' + (t.d === 1 ? 'sabah!' : t.d + ' gun')
          }).join('\n')

          const prompt = 'Sen Reflect Architects AI koməkçisisən. ' + nm + ' ucun deadline xəbərdarlığı yaz.\n\nYaxınlaşan deadlinelər:\n' + list + '\n\nTələblər:\n- "' + nm + '," ile başla\n- Qısa, 2-3 cümlə\n- 1 gün qalanı ayrıca vurğula\n- İncitməyən amma ciddi ton\n- Bəzən zarafat, bəzən motivasiya\n- Azərbaycan dilinin qrammatikasına riayət et\n- Emoji ile\n- Yalnız mesajı yaz'

          let text = await ai(prompt)
          if (!text) {
            text = '⏰ ' + nm + ', yaxınlaşan deadlinelər!\n\n' + list
          }

          const r = await tg(p.telegram_chat_id, text)
          if (r?.ok) count++
        } catch (e) {
          console.error('deadline_warning user error:', uid, e.message)
        }
      }
      return res.json({ success: true, count })
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 6. AXŞAM SİTATI — 18:00
    // ══════════════════════════════════════════════════════════════════════════
    if (type === 'evening') {
      const all = await getProfiles()
      if (!all.length) return res.json({ success: true, count: 0 })

      const tones = ['philosophical', 'sarcastic', 'emotional', 'thoughtful']
      const doy   = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
      const tone  = tones[doy % 4]

      const toneDesc = {
        philosophical: 'Dərin fəlsəfi ton. Rem Koolhaas, Louis Kahn, Peter Zumtor kimi ustadlardan ilham al. Memarlığın insan həyatı, zaman, məkanla dərin əlaqəsini araşdıran orijinal bir fikir.',
        sarcastic: 'Düşündürücü, ağıllı sarkazm — Koolhaas tərzi. Sifarişçilər, büdcə, reviziyalar haqqında zarafatlı amma dərin müşahidə.',
        emotional: 'İlhamverici, emosional ton. Zaha Hədid, Tadao Ando, Alvaro Siza həyat hekayələrindən ilham. Yaradıcılığın çətinliyi, gözəlliyin dəyəri.',
        thoughtful: 'Düşündürücü, gözlənilməz ton. Memarlıq haqqında paradoksal həqiqətlər, qeyri-standart müşahidələr.',
      }

      const intro  = 'Yaxşı memar ucun iş gunu heç vaxt tam bitmir — o, sadəcə başqa bir formaya keçir.'
      const prompt = 'Sen Reflect Architects AI koməkçisisən. Axşam komandaya ilham mesajı yaz.\n\nTon: ' + toneDesc[tone] + '\n\nTələblər:\n- Azərbaycan dilinin qrammatikasına və leksikologiyasına tam riayət et\n- Memarların gündəlik həyatına aid, real hiss doğuran məzmun\n- Emoji yoxdur, başlıq yoxdur — sadə, gözəl mətn\n- 3-5 cümlə\n- Yalnız mətni yaz'

      const fallbacks = {
        philosophical: 'Rem Koolhaas yazırdı: bir binanın iki ömrü var — memarın xəyal etdiyi və insanların yaşatdığı. Bu iki ömür heç vaxt üst-üstə düşmür.',
        sarcastic: '"Sadəlik mürəkkəbliyin ən yüksək ifadəsidir" — Leonardo da Vinci. Bunu sifarişçiyə anlatmaq isə ondan da mürəkkəb bir məsələdir.',
        emotional: 'Zaha Hədidin lüğətində "mümkün deyil" ifadəsi yox idi. O, sadəcə başqalarının hələ görə bilmədiyi şeyləri əvvəlcədən görürdü.',
        thoughtful: 'Koolhaas demişdi: "Bəzən infrastruktur memarlıqdan daha vacibdir." Bəzən yaxşı düşünülmüş bir dəhliz bütün binadan daha çox şey söyləyir.',
      }

      const quote = await ai(prompt) || fallbacks[tone]
      const msg   = '🌆 <i>' + intro + '</i>\n\n' + quote

      let count = 0
      for (const p of all) {
        try {
          const r = await tg(p.telegram_chat_id, msg)
          if (r?.ok) count++
        } catch (e) {
          console.error('evening user error:', p.full_name, e.message)
        }
      }
      return res.json({ success: true, count, tone })
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 7. HƏFTƏLİK HESABAT — Cümə 17:00
    // ══════════════════════════════════════════════════════════════════════════
    if (type === 'weekly_report') {
      const admins = await getProfiles('admins')
      if (!admins.length) return res.json({ success: true, count: 0 })

      const td   = today()
      const w7   = ago(7)
      const in7  = future(7)
      const mon  = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

      const [tRes, mRes, dlRes, incM, expM, incW, expW, debRes, outRes, propRes] = await Promise.all([
        supabase.from('tasks').select('id,title,due_date,assignee_id,status,tags,archived,updated_at'),
        supabase.from('profiles').select('id,full_name').eq('is_active', true),
        supabase.from('task_comments')
          .select('metadata,tasks(title),profiles(full_name)')
          .eq('type', 'activity').ilike('content', '%deadline%')
          .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
          .order('created_at', { ascending: false }),
        supabase.from('incomes').select('amount').gte('payment_date', mon),
        supabase.from('expenses').select('amount').gte('expense_date', mon),
        supabase.from('incomes').select('amount').gte('payment_date', w7),
        supabase.from('expenses').select('amount').gte('expense_date', w7),
        supabase.from('receivables').select('client_name,expected_amount,expected_date').eq('paid', false),
        supabase.from('outsource_works').select('name,planned_deadline,projects(name)').neq('status', 'completed').not('planned_deadline', 'is', null),
        supabase.from('proposals').select('client_name').neq('status', 'signed').neq('status', 'rejected'),
      ])

      const allT   = tRes.data || []
      const membs  = mRes.data || []
      const nm_    = (id) => membs.find(m => m.id === id)?.full_name || '—'

      const wInc   = (incW.data || []).reduce((s,i) => s + Number(i.amount || 0), 0)
      const wExp   = (expW.data || []).reduce((s,e) => s + Number(e.amount || 0), 0)
      const mInc   = (incM.data || []).reduce((s,i) => s + Number(i.amount || 0), 0)
      const mExp   = (expM.data || []).reduce((s,e) => s + Number(e.amount || 0), 0)
      const debs   = debRes.data || []
      const totD   = debs.reduce((s,d) => s + Number(d.expected_amount || 0), 0)
      const overD  = debs.filter(d => d.expected_date && d.expected_date < td)

      const done   = allT.filter(t => t.status === 'done' && t.updated_at >= w7 && !t.archived)
      const over   = allT.filter(t => { if (t.status === 'done' || t.archived || !t.due_date) return false; return days(t.due_date) < 0 })
      const crit   = over.filter(t => Math.abs(days(t.due_date)) > 3)
      const next   = allT.filter(t => t.due_date > td && t.due_date <= in7 && t.status !== 'done' && !t.archived)
      const dlCh   = dlRes.data || []
      const bdT    = allT.filter(t => (t.tags || []).includes('BD') && t.status !== 'done')
      const outs   = (outRes.data || []).filter(o => { const d = days(o.planned_deadline); return d >= 0 && d <= 14 })

      const bdAdmins = await getProfiles('bd')
      const bdIds    = new Set(bdAdmins.map(b => b.id))

      let count = 0
      for (const admin of admins) {
        try {
          const nm   = admin.full_name.split(' ')[0]
          const isBD = bdIds.has(admin.id)

          const ctx = [
            new Date().toLocaleDateString('az-AZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
            '',
            'MALİYYƏ:',
            'Bu həftə: gəlir ' + money(wInc) + ' | xərc ' + money(wExp) + ' | balans ' + money(wInc - wExp),
            'Bu ay: gəlir ' + money(mInc) + ' | xərc ' + money(mExp) + ' | balans ' + money(mInc - mExp),
            'Debitor borc: ' + money(totD) + (overD.length ? ' (gecikmiş: ' + overD.length + ' - ' + overD.slice(0,3).map(d => d.client_name + ' ' + money(d.expected_amount)).join(', ') + ')' : ''),
            '',
            'TAPŞIRIQLAR:',
            'Tamamlanan (bu həftə): ' + done.length + (done.length ? ' - ' + done.slice(0,4).map(t => t.title + ' (' + nm_(t.assignee_id) + ')').join(', ') : ''),
            'Gecikmiş: ' + over.length + (crit.length ? ' (kritik 3+g: ' + crit.length + ')' : ''),
            'Deadline dəyişikliyi: ' + dlCh.length + (dlCh.length ? ' - ' + dlCh.slice(0,3).map(c => (c.tasks?.title || '?') + ' (' + (c.profiles?.full_name || '?') + ')').join(', ') : ''),
            'Gələn həftə deadline: ' + next.length + (next.length ? ' - ' + next.slice(0,4).map(t => t.title + ' (' + nm_(t.assignee_id) + ', ' + days(t.due_date) + 'g)').join(', ') : ''),
            outs.length ? 'Podratçı (2həftə): ' + outs.map(o => o.name + (o.projects?.name ? ' (' + o.projects.name + ')' : '') + ' ' + days(o.planned_deadline) + 'g').join(', ') : '',
            isBD ? ('BD: ' + bdT.length + ' aktiv tapşırıq, ' + (propRes.data || []).length + ' gözləyən təklif') : '',
          ].filter(Boolean).join('\n')

          const prompt = 'Sen Reflect Architects AI koməkçisisən. ' + nm + ' ucun həftəlik hesabat yaz.\n\n' + ctx + '\n\nTələblər:\n- "Salam ' + nm + '! Cümə hesabatı" ile başla\n- Maliyyəni həm bu həftə həm bu ay göstər\n- Gecikmiş borcları, kritik tapşırıqları vurğula\n- Uğurları da qeyd et\n- ' + (isBD ? 'BD məlumatlarını ayrıca göstər' : '') + '\n- Gələn həftə prioritetlərini xulasele\n- Azərbaycan dilinin qrammatikasına riayət et\n- Professional amma yoldaş tonu, emoji ile\n- 10-15 cümlə\n- Yalnız mesajı yaz'

          let text = await ai(prompt)
          if (!text) {
            text = '📈 Salam, ' + nm + '! Cümə hesabatı.\n\n' +
              '💰 Bu həftə: ' + money(wInc) + ' gəlir | ' + money(wExp) + ' xərc\n' +
              '📅 Bu ay: ' + money(mInc) + ' | ' + money(mExp) + '\n' +
              (overD.length ? '🔴 Gecikmiş borclar: ' + overD.length + ' müştəri\n' : '') +
              '✅ Tamamlanan: ' + done.length + '\n' +
              (crit.length ? '🚨 Kritik gecikmiş: ' + crit.length + '\n' : '') +
              '📋 Gələn həftə: ' + next.length + ' tapşırıq'
          }

          const r = await tg(admin.telegram_chat_id, text)
          if (r?.ok) count++
        } catch (e) {
          console.error('weekly_report error:', admin.full_name, e.message)
        }
      }
      return res.json({ success: true, count })
    }

    return res.status(400).json({ error: 'Unknown type: ' + type })

  } catch (e) {
    console.error('[agent] fatal error:', e.message, e.stack)
    return res.status(500).json({ error: 'Internal error', detail: e.message })
  }
}
