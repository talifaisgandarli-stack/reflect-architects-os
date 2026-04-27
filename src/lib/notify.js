import { supabase } from './supabase'

const ADMIN_EMAILS = ['talifa.isgandarli@gmail.com', 'nusalov.n@reflect.az', 'turkan.a@reflect.az']

/**
 * Bir istifadəçiyə bildiriş göndər
 */
export async function notify(user_id, title, body = null, type = 'info', link = null) {
  if (!user_id) return
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id,
      title: String(title).slice(0, 200),
      body: body ? String(body).slice(0, 500) : null,
      type,
      link,
      read: false,
    })
    if (error) console.error('notify insert error:', error.message)
  } catch (e) {
    console.error('notify error:', e.message)
  }
}

/**
 * Bütün aktiv istifadəçilərə bildiriş göndər (exclude_id istisna)
 */
export async function notifyAll(title, body = null, type = 'info', link = null, exclude_id = null) {
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_active', true)

    const targets = (profiles || []).filter(p => p.id !== exclude_id)
    if (!targets.length) return

    const { error } = await supabase.from('notifications').insert(
      targets.map(p => ({
        user_id: p.id,
        title: String(title).slice(0, 200),
        body: body ? String(body).slice(0, 500) : null,
        type,
        link,
        read: false,
      }))
    )
    if (error) console.error('notifyAll insert error:', error.message)
  } catch (e) {
    console.error('notifyAll error:', e.message)
  }
}

/**
 * Adminlərə bildiriş göndər
 */
export async function notifyAdmins(title, body = null, type = 'info', link = null) {
  try {
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .in('email', ADMIN_EMAILS)
      .eq('is_active', true)

    if (!admins?.length) return

    const { error } = await supabase.from('notifications').insert(
      admins.map(p => ({
        user_id: p.id,
        title: String(title).slice(0, 200),
        body: body ? String(body).slice(0, 500) : null,
        type,
        link,
        read: false,
      }))
    )
    if (error) console.error('notifyAdmins error:', error.message)
  } catch (e) {
    console.error('notifyAdmins error:', e.message)
  }
}
