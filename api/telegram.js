import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TG = `https://api.telegram.org/bot${BOT_TOKEN}`

async function send(chat_id, text) {
  if (!chat_id || !text) return null
  try {
    const r = await fetch(`${TG}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: String(chat_id),
        text: String(text).slice(0, 4000),
        parse_mode: 'HTML'
      })
    })
    const d = await r.json()
    // HTML parse xətasında plain text ilə retry
    if (!d.ok && d.description?.includes('parse')) {
      const r2 = await fetch(`${TG}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: String(chat_id),
          text: String(text).replace(/<[^>]+>/g, '').slice(0, 4000)
        })
      })
      return r2.json()
    }
    return d
  } catch (e) {
    console.error('TG send error:', e.message)
    return null
  }
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  // ── Webhook set etmək üçün GET sorğusu ────────────────────────────────────
  if (req.method === 'GET') {
    const action = req.query.action

    // Webhook qeydiyyatı: GET /api/telegram?action=setWebhook
    if (action === 'setWebhook') {
      const host = req.headers.host || process.env.VERCEL_URL
      const url  = `https://${host}/api/telegram`
      const r = await fetch(`${TG}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, drop_pending_updates: true })
      })
      const d = await r.json()
      return res.json({ action: 'setWebhook', url, result: d })
    }

    // Webhook statusunu yoxla: GET /api/telegram?action=getWebhookInfo
    if (action === 'getWebhookInfo') {
      const r = await fetch(`${TG}/getWebhookInfo`)
      const d = await r.json()
      return res.json(d)
    }

    // Bot məlumatı: GET /api/telegram?action=getMe
    if (action === 'getMe') {
      const r = await fetch(`${TG}/getMe`)
      const d = await r.json()
      return res.json(d)
    }

    return res.json({ ok: true, info: 'Telegram webhook endpoint' })
  }

  // ── POST sorğuları ─────────────────────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = req.body || {}

  // ── Webhook — Telegram-dan gələn update ───────────────────────────────────
  // action olmadıqda bu Telegram-ın webhook callback-idir
  if (!body.action) {
    try {
      const msg = body?.message
      if (!msg) return res.json({ ok: true })

      const chat_id    = msg.chat?.id
      const text       = (msg.text || '').trim()
      const first_name = msg.from?.first_name || ''

      if (!chat_id) return res.json({ ok: true })

      // /start komandası
      if (text === '/start' || text.startsWith('/start ')) {
        // Artıq qeydiyyatlı?
        const { data: existing } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('telegram_chat_id', String(chat_id))
          .single()

        if (existing) {
          await send(chat_id, `✅ Siz artıq <b>${existing.full_name}</b> kimi qeydiyyatdasınız!\n\nBildirişlər bu chata göndəriləcək.\n\n✦ Mirai · Reflect Architects`)
          return res.json({ ok: true })
        }

        // Pending saxla
        await supabase.from('telegram_pending').upsert({
          chat_id: String(chat_id),
          first_name,
          step: 'waiting_name',
          created_at: new Date().toISOString()
        }, { onConflict: 'chat_id' })

        await send(chat_id,
          `👋 Salam, <b>${first_name}</b>!\n\nReflect Architects sisteminə xoş gəldiniz.\n\nZəhmət olmasa sistemdəki tam adınızı yazın:\n\n<i>Məs: Nicat Nusalov</i>\n\n✦ Mirai · Reflect Architects`
        )
        return res.json({ ok: true })
      }

      // Ad cavabı — pending yoxla
      const { data: pending } = await supabase
        .from('telegram_pending')
        .select('*')
        .eq('chat_id', String(chat_id))
        .maybeSingle()

      if (pending?.step === 'waiting_name') {
        const name = text

        // Bütün aktiv profilləri al
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('is_active', true)

        if (!allProfiles?.length) {
          await send(chat_id, '❌ Sistem xətası. Zəhmət olmasa adminlə əlaqə saxlayın.')
          return res.json({ ok: true })
        }

        // 1. Tam uyğunluq
        let profile = allProfiles.find(p =>
          p.full_name.toLowerCase() === name.toLowerCase()
        )

        // 2. Hər iki söz yoxla
        if (!profile) {
          const words = name.toLowerCase().split(/\s+/).filter(Boolean)
          if (words.length >= 2) {
            profile = allProfiles.find(p => {
              const pw = p.full_name.toLowerCase().split(/\s+/)
              return words.every(w => pw.some(pw2 => pw2.startsWith(w)))
            })
          }
        }

        // 3. Tək söz — unique-dirsə
        if (!profile) {
          const first = name.toLowerCase().split(/\s+/)[0]
          const matches = allProfiles.filter(p =>
            p.full_name.toLowerCase().split(/\s+/).some(w => w.startsWith(first))
          )
          if (matches.length === 1) profile = matches[0]
        }

        if (profile) {
          // Qeydiyyatı tamamla
          await supabase.from('profiles')
            .update({ telegram_chat_id: String(chat_id) })
            .eq('id', profile.id)

          await supabase.from('telegram_pending')
            .delete()
            .eq('chat_id', String(chat_id))

          await send(chat_id,
            `✅ <b>${profile.full_name}</b> kimi qeydiyyat tamamlandı!\n\n🔔 Bundan sonra bütün bildirişlər bu chata göndəriləcək.\n\n✦ Mirai · Reflect Architects`
          )
        } else {
          // Oxşar adları göstər
          const words = name.toLowerCase().split(/\s+/).filter(Boolean)
          const similar = allProfiles
            .filter(p => words.some(w => p.full_name.toLowerCase().includes(w)))
            .slice(0, 5)

          let hint = ''
          if (similar.length > 0) {
            hint = '\n\nBəlkə bunlardan birisiniz?\n' +
              similar.map(p => `• <i>${p.full_name}</i>`).join('\n')
          }

          await send(chat_id,
            `❌ "<b>${name}</b>" adı sistemdə tapılmadı.${hint}\n\nZəhmət olmasa sistemdəki tam adınızı yazın:\n\n✦ Mirai · Reflect Architects`
          )
        }
        return res.json({ ok: true })
      }

      // Başqa mesaj
      await send(chat_id, 'ℹ️ Qeydiyyat üçün /start yazın.\n\n✦ Mirai · Reflect Architects')
      return res.json({ ok: true })

    } catch (e) {
      console.error('Webhook handler error:', e.message)
      return res.status(200).json({ ok: true }) // Telegram-a həmişə 200 qaytar
    }
  }

  // ── Manuel mesaj ──────────────────────────────────────────────────────────
  if (body.action === 'send') {
    const { chat_id, message } = body
    if (!chat_id || !message) return res.status(400).json({ error: 'chat_id and message required' })
    const r = await send(chat_id, message)
    return res.json({ success: r?.ok === true, result: r })
  }

  // ── Broadcast ─────────────────────────────────────────────────────────────
  if (body.action === 'broadcast') {
    const { message, user_ids } = body
    if (!message) return res.status(400).json({ error: 'message required' })

    let query = supabase.from('profiles').select('id, telegram_chat_id').not('telegram_chat_id', 'is', null)
    if (user_ids?.length) query = query.in('id', user_ids)

    const { data: profiles } = await query
    let count = 0
    for (const p of (profiles || [])) {
      const r = await send(p.telegram_chat_id, message)
      if (r?.ok) count++
    }
    return res.json({ success: true, count })
  }

  return res.status(400).json({ error: 'Unknown action' })
}
