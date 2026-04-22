import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const API = `https://api.telegram.org/bot${BOT_TOKEN}`

async function sendMessage(chat_id, text, parse_mode = 'HTML') {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id, text, parse_mode })
  })
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { action } = req.body || {}

    // Webhook — Telegram-dan gələn mesajlar
    if (!action) {
      const update = req.body
      const msg = update?.message
      if (!msg) return res.status(200).json({ ok: true })

      const chat_id = msg.chat.id
      const text = msg.text || ''
      const username = msg.from?.username || ''
      const first_name = msg.from?.first_name || ''

      // /start komandası — qeydiyyat
      if (text.startsWith('/start')) {
        // chat_id-ni profiles-ə saxla
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, telegram_chat_id')

        // Əgər artıq qeydiyyatlıdırsa
        const existing = profiles?.find(p => p.telegram_chat_id === chat_id.toString())
        if (existing) {
          await sendMessage(chat_id, `✅ Siz artıq qeydiyyatdasınız, <b>${existing.full_name}</b>!\n\nBildirişlər bu chata göndəriləcək.`)
          return res.status(200).json({ ok: true })
        }

        await sendMessage(chat_id, `👋 Salam <b>${first_name}</b>!\n\nReflect Architects sisteminə xoş gəldiniz.\n\nZəhmət olmasa tam adınızı yazın (sistemdəki adınızla eyni olmalıdır):\n\nMəs: <i>Nicat Nusalov</i>`)
        
        // Müvəqqəti saxla
        await supabase.from('telegram_pending').upsert({
          chat_id: chat_id.toString(),
          username,
          first_name,
          step: 'waiting_name'
        }, { onConflict: 'chat_id' })
        
        return res.status(200).json({ ok: true })
      }

      // Ad cavabı
      const { data: pending } = await supabase
        .from('telegram_pending')
        .select('*')
        .eq('chat_id', chat_id.toString())
        .single()

      if (pending?.step === 'waiting_name') {
        const name = text.trim()
        // Profildə tap
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name')
          .ilike('full_name', `%${name.split(' ')[0]}%`)
          .single()

        if (profile) {
          await supabase.from('profiles').update({
            telegram_chat_id: chat_id.toString()
          }).eq('id', profile.id)

          await supabase.from('telegram_pending').delete().eq('chat_id', chat_id.toString())

          await sendMessage(chat_id, `✅ <b>${profile.full_name}</b> kimi qeydiyyat tamamlandı!\n\n🔔 Bundan sonra deadline xatırlatmaları, tapşırıqlar və bildirişlər sizə göndəriləcək.`)
        } else {
          await sendMessage(chat_id, `❌ "<b>${name}</b>" adı sistemdə tapılmadı.\n\nZəhmət olmasa sistemdəki adınızı dəqiq yazın:`)
        }
        return res.status(200).json({ ok: true })
      }

      await sendMessage(chat_id, `ℹ️ Qeydiyyat üçün /start yazın.`)
      return res.status(200).json({ ok: true })
    }

    // Manuel mesaj göndər
    if (action === 'send') {
      const { chat_id, message } = req.body
      if (!chat_id || !message) return res.status(400).json({ error: 'chat_id və message lazımdır' })
      await sendMessage(chat_id, message)
      return res.status(200).json({ success: true })
    }

    // Bütün qeydiyyatlı istifadəçilərə göndər
    if (action === 'broadcast') {
      const { message, user_ids } = req.body
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, telegram_chat_id')
        .not('telegram_chat_id', 'is', null)

      const targets = user_ids
        ? profiles?.filter(p => user_ids.includes(p.id))
        : profiles

      for (const p of (targets || [])) {
        await sendMessage(p.telegram_chat_id, message)
      }
      return res.status(200).json({ success: true, count: targets?.length || 0 })
    }

    return res.status(400).json({ error: 'Bilinməyən action' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
