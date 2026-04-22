import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconUsersGroup, IconMail, IconPhone, IconKey, IconPower } from '@tabler/icons-react'

function IshciForm({ open, onClose, onSave, member, roles, isNew }) {
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', phone: '', role_id: '',
    department: '', monthly_salary: '', whatsapp_number: '',
    joining_date: '', is_active: true
  })

  useEffect(() => {
    if (member && !isNew) {
      setForm({
        full_name: member.full_name || '', email: member.email || '',
        password: '', phone: member.phone || '',
        role_id: member.role_id || '', department: member.department || '',
        monthly_salary: member.monthly_salary || '',
        whatsapp_number: member.whatsapp_number || '',
        joining_date: member.joining_date || '', is_active: member.is_active !== false
      })
    } else {
      setForm({ full_name: '', email: '', password: '', phone: '', role_id: '', department: '', monthly_salary: '', whatsapp_number: '', joining_date: '', is_active: true })
    }
  }, [member, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <Modal open={open} onClose={onClose} title={isNew ? 'Yeni işçi əlavə et' : 'İşçini redaktə et'}>
      <div className="space-y-3">
        {isNew && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
            ℹ️ İşçi sisteminə daxil olmaq üçün email və şifrəni özü dəyişdirə bilər
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[#555] mb-1">Ad Soyad *</label>
            <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="Ad Soyad" />
          </div>
          {isNew && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#555] mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
                  placeholder="ad@reflect.az" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#555] mb-1">İlkin şifrə *</label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                  className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
                  placeholder="Minimum 6 simvol" />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Vəzifə</label>
            <select value={form.role_id} onChange={e => set('role_id', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="">Seçin</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.title_az}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Şöbə</label>
            <input value={form.department} onChange={e => set('department', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="Memarlıq, BD, Dizayn..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Telefon</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="+994 50 000 00 00" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">WhatsApp</label>
            <input value={form.whatsapp_number} onChange={e => set('whatsapp_number', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="+994 50 000 00 00" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Aylıq maaş (₼)</label>
            <input type="number" value={form.monthly_salary} onChange={e => set('monthly_salary', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">İşə başlama tarixi</label>
            <input type="date" value={form.joining_date} onChange={e => set('joining_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
        </div>
        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto">
            {isNew ? 'İşçi yarat' : 'Yadda saxla'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function ResetPasswordModal({ open, onClose, onSave, member }) {
  const [password, setPassword] = useState('')
  return (
    <Modal open={open} onClose={onClose} title={`Şifrəni sıfırla — ${member?.full_name}`}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Yeni şifrə *</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="Minimum 6 simvol" />
        </div>
        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => { onSave(password); setPassword('') }} className="ml-auto">Sıfırla</Button>
        </div>
      </div>
    </Modal>
  )
}

function MemberCard({ member, role, onEdit, onDelete, onResetPassword, onToggleActive, isAdmin = true }) {
  const initials = member.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  return (
    <div className={`bg-white border rounded-lg p-4 transition-colors group ${member.is_active ? 'border-[#e8e8e4] hover:border-[#0f172a]' : 'border-[#f0f0ec] opacity-60'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${member.is_active ? 'bg-[#0f172a] text-white' : 'bg-[#e8e8e4] text-[#888]'}`}>
            {initials}
          </div>
          <div>
            <div className="text-sm font-medium text-[#0f172a]">{member.full_name}</div>
            <div className="text-xs text-[#888]">{role?.title_az || '—'}</div>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(member)} className="text-[#aaa] hover:text-[#0f172a] p-1" title="Redaktə"><IconEdit size={13} /></button>
          <button onClick={() => onResetPassword(member)} className="text-[#aaa] hover:text-blue-500 p-1" title="Şifrə sıfırla"><IconKey size={13} /></button>
          <button onClick={() => onToggleActive(member)} className={`p-1 ${member.is_active ? 'text-[#aaa] hover:text-red-500' : 'text-[#aaa] hover:text-green-500'}`} title={member.is_active ? 'Deaktiv et' : 'Aktiv et'}>
            <IconPower size={13} />
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        {member.email && (
          <div className="flex items-center gap-2 text-xs text-[#555]">
            <IconMail size={11} className="text-[#aaa]" />
            <span className="truncate">{member.email}</span>
          </div>
        )}
        {member.phone && (
          <div className="flex items-center gap-2 text-xs text-[#555]">
            <IconPhone size={11} className="text-[#aaa]" />
            <span>{member.phone}</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f5f5f0]">
        <Badge variant={member.is_active ? 'success' : 'default'} size="sm">
          {member.is_active ? 'Aktiv' : 'Deaktiv'}
        </Badge>
        {member.department && <span className="text-[10px] text-[#aaa]">{member.department}</span>}
      </div>
    </div>
  )
}

export default function IshciHeyetiPage() {
  const { addToast } = useToast()
  const { isAdmin } = useAuth()
  const [members, setMembers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [editMember, setEditMember] = useState(null)
  const [resetMember, setResetMember] = useState(null)
  const [confirmToggle, setConfirmToggle] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [mRes, rRes] = await Promise.all([
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('roles').select('*').order('level'),
    ])
    setMembers(mRes.data || [])
    setRoles(rRes.data || [])
    setLoading(false)
  }

  async function handleCreate(form) {
    if (!form.full_name.trim() || !form.email.trim() || !form.password) {
      addToast('Ad, email və şifrə lazımdır', 'error'); return
    }
    if (form.password.length < 6) {
      addToast('Şifrə minimum 6 simvol olmalıdır', 'error'); return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          email: form.email, password: form.password,
          full_name: form.full_name, role_id: form.role_id || null,
          department: form.department || null, phone: form.phone || null,
          monthly_salary: form.monthly_salary || 0,
          whatsapp_number: form.whatsapp_number || null,
          joining_date: form.joining_date || null
        })
      })
      const data = await res.json()
      if (data.error) { addToast('Xəta: ' + data.error, 'error'); return }
      addToast('İşçi uğurla əlavə edildi!', 'success')
      setModalOpen(false)
      await loadData()
    } catch (err) {
      addToast('Xəta: ' + err.message, 'error')
    }
    setSaving(false)
  }

  async function handleUpdate(form) {
    if (!form.full_name.trim()) { addToast('Ad lazımdır', 'error'); return }
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name, role_id: form.role_id || null,
      department: form.department || null, phone: form.phone || null,
      monthly_salary: Number(form.monthly_salary) || 0,
      whatsapp_number: form.whatsapp_number || null,
      joining_date: form.joining_date || null
    }).eq('id', editMember.id)
    if (error) { addToast('Xəta: ' + error.message, 'error'); setSaving(false); return }
    addToast('Yeniləndi', 'success')
    setModalOpen(false); setEditMember(null)
    await loadData()
    setSaving(false)
  }

  async function handleResetPassword(password) {
    if (!password || password.length < 6) { addToast('Minimum 6 simvol', 'error'); return }
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', user_id: resetMember.id, password })
      })
      const data = await res.json()
      if (data.error) { addToast('Xəta: ' + data.error, 'error'); return }
      addToast('Şifrə sıfırlandı', 'success')
      setResetMember(null)
    } catch (err) {
      addToast('Xəta: ' + err.message, 'error')
    }
  }

  async function handleToggleActive() {
    const newStatus = !confirmToggle.is_active
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_active', user_id: confirmToggle.id, is_active: newStatus })
      })
      const data = await res.json()
      if (data.error) { addToast('Xəta: ' + data.error, 'error'); return }
      addToast(newStatus ? 'Aktiv edildi' : 'Deaktiv edildi', 'success')
      setConfirmToggle(null)
      await loadData()
    } catch (err) {
      addToast('Xəta: ' + err.message, 'error')
    }
  }

  const getRole = id => roles.find(r => r.id === id)
  const filtered = filter === 'all' ? members : filter === 'active' ? members.filter(m => m.is_active) : members.filter(m => !m.is_active)

  if (loading) return <div className="p-4 lg:p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-4 lg:p-6 fade-in">
      <PageHeader
        title="İşçi Heyəti"
        subtitle={`${members.length} üzv · ${members.filter(m => m.is_active).length} aktiv`}
        action={isAdmin ? (
          <Button onClick={() => { setIsNew(true); setEditMember(null); setModalOpen(true) }} size="sm">
            <IconPlus size={14} /> Yeni işçi
          </Button>
        ) : null}
      />

      <div className="flex gap-1 mb-5 border-b border-[#e8e8e4]">
        {[{ key: 'all', label: 'Hamısı' }, { key: 'active', label: 'Aktiv' }, { key: 'inactive', label: 'Deaktiv' }].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${filter === f.key ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#888] hover:text-[#555]'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {members.length === 0 ? (
        <EmptyState icon={IconUsersGroup} title="Hələ işçi yoxdur"
          action={<Button onClick={() => { setIsNew(true); setModalOpen(true) }} size="sm"><IconPlus size={14} /> İşçi əlavə et</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              role={getRole(member.role_id)}
              onEdit={m => { setIsNew(false); setEditMember(m); setModalOpen(true) }}
              onDelete={() => {}}
              onResetPassword={setResetMember}
              onToggleActive={setConfirmToggle}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      <IshciForm
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditMember(null) }}
        onSave={isNew ? handleCreate : handleUpdate}
        member={editMember}
        roles={roles}
        isNew={isNew}
      />

      <ResetPasswordModal
        open={!!resetMember}
        onClose={() => setResetMember(null)}
        onSave={handleResetPassword}
        member={resetMember}
      />

      <ConfirmDialog
        open={!!confirmToggle}
        title={confirmToggle?.is_active ? 'İşçini deaktiv et' : 'İşçini aktiv et'}
        message={`"${confirmToggle?.full_name}" ${confirmToggle?.is_active ? 'deaktiv edilsin? Sisteme girişi bağlanacaq.' : 'aktiv edilsin? Sisteme girişi açılacaq.'}`}
        onConfirm={handleToggleActive}
        onCancel={() => setConfirmToggle(null)}
        danger={confirmToggle?.is_active}
      />
    </div>
  )
}
