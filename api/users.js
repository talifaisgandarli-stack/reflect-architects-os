import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action, email, password, full_name, role_id, department, phone,
    monthly_salary, whatsapp_number, joining_date, user_id, is_active } = req.body || {}

  // Yeni işçi yarat
  if (action === 'create') {
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, şifrə və ad lazımdır' })
    }
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { full_name }
      })
      if (authError) return res.status(400).json({ error: authError.message })

      const { error: profileError } = await supabaseAdmin.from('profiles').update({
        full_name, role_id: role_id || null, department: department || null,
        phone: phone || null, monthly_salary: Number(monthly_salary) || 0,
        whatsapp_number: whatsapp_number || null,
        joining_date: joining_date || null, is_active: true
      }).eq('id', authData.user.id)

      if (profileError) return res.status(400).json({ error: profileError.message })
      return res.status(200).json({ success: true, user_id: authData.user.id })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // Aktiv/deaktiv
  if (action === 'toggle_active') {
    if (!user_id) return res.status(400).json({ error: 'user_id lazımdır' })
    try {
      await supabaseAdmin.auth.admin.updateUserById(user_id, {
        ban_duration: is_active ? 'none' : '87600h'
      })
      await supabaseAdmin.from('profiles').update({ is_active }).eq('id', user_id)
      return res.status(200).json({ success: true })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // Şifrə sıfırla
  if (action === 'reset_password') {
    if (!user_id || !password) return res.status(400).json({ error: 'user_id və şifrə lazımdır' })
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, { password })
      if (error) return res.status(400).json({ error: error.message })
      return res.status(200).json({ success: true })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  return res.status(400).json({ error: 'Bilinməyən action' })
}
