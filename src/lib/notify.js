import { supabase } from './supabase'

/**
 * Bir istifadəçiyə bildiriş göndər
 */
export async function notify(user_id, title, body = null, type = 'info', link = null) {
  if (!user_id) {
    console.warn('[notify] user_id yoxdur, bildiriş göndərilmir')
    return
  }

  const payload = {
    user_id,
    title: String(title).slice(0, 200),
    body: body ? String(body).slice(0, 500) : null,
    type: type || 'info',
    link: link || null,
    read: false,
  }

  console.log('[notify] göndərilir:', payload)

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('[notify] INSERT xətası:', error.message, error.code, error.details)
    } else {
      console.log('[notify] uğurlu:', data?.id)
    }
    return data
  } catch (e) {
    console.error('[notify] exception:', e.message)
  }
}

/**
 * Bütün aktiv istifadəçilərə bildiriş göndər
 */
export async function notifyAll(title, body = null, type = 'info', link = null, exclude_id = null) {
  try {
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_active', true)

    if (pErr) { console.error('[notifyAll] profiles xətası:', pErr.message); return }

    const targets = (profiles || []).filter(p => p.id !== exclude_id)
    if (!targets.length) { console.warn('[notifyAll] hədəf yoxdur'); return }

    const rows = targets.map(p => ({
      user_id: p.id,
      title: String(title).slice(0, 200),
      body: body ? String(body).slice(0, 500) : null,
      type: type || 'info',
      link: link || null,
      read: false,
    }))

    const { error } = await supabase.from('notifications').insert(rows)
    if (error) console.error('[notifyAll] INSERT xətası:', error.message)
    else console.log('[notifyAll] göndərildi:', targets.length, 'nəfərə')
  } catch (e) {
    console.error('[notifyAll] exception:', e.message)
  }
}

/**
 * Adminlərə bildiriş göndər
 */
export async function notifyAdmins(title, body = null, type = 'info', link = null) {
  try {
    const { data: profiles, error: aErr } = await supabase
      .from('profiles')
      .select('id, roles(level)')
      .eq('is_active', true)

    if (aErr) { console.error('[notifyAdmins] profiles xətası:', aErr.message); return }
    const admins = (profiles || []).filter(p => (p.roles?.level ?? 99) <= 2)
    if (!admins.length) { console.warn('[notifyAdmins] admin tapılmadı'); return }

    const rows = admins.map(p => ({
      user_id: p.id,
      title: String(title).slice(0, 200),
      body: body ? String(body).slice(0, 500) : null,
      type: type || 'info',
      link: link || null,
      read: false,
    }))

    const { error } = await supabase.from('notifications').insert(rows)
    if (error) console.error('[notifyAdmins] INSERT xətası:', error.message)
    else console.log('[notifyAdmins] göndərildi:', admins.length, 'adminə')
  } catch (e) {
    console.error('[notifyAdmins] exception:', e.message)
  }
}
