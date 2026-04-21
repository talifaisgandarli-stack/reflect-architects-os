import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconUsersGroup, IconMail, IconPhone } from '@tabler/icons-react'

function IshciForm({ open, onClose, onSave, member, roles }) {
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', role_id: '',
    department: '', monthly_salary: '', whatsapp_number: '',
    joining_date: '', is_active: true
  })

  useEffect(() => {
    if (member) {
      setForm({
        full_name: member.full_name || '',
        email: member.email || '',
        phone: member.phone || '',
        role_id: member.role_id || '',
        department: member.department || '',
        monthly_salary: member.monthly_salary || '',
        whatsapp_number: member.whatsapp_number || '',
        joining_date: member.joining_date || '',
        is_active: member.is_active !== false
      })
    } else {
      setForm({ full_name: '', email: '', phone: '', role_id: '', department: '', monthly_salary: '', whatsapp_number: '', joining_date: '', is_active: true })
    }
  }, [member, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <Modal open={open} onClose={onClose} title={member ? 'İşçini redaktə et' : 'Yeni işçi'}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Ad Soyad *</label>
          <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="Ad Soyad" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">E-poçt</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="ad@reflect.az" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Telefon</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="+994 50 000 00 00" />
          </div>
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
            <label className="block text-xs font-medium text-[#555] mb-1">Aylıq maaş (₼)</label>
            <input type="number" value={form.monthly_salary} onChange={e => set('monthly_salary', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">WhatsApp nömrəsi</label>
            <input value={form.whatsapp_number} onChange={e => set('whatsapp_number', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="+994 50 000 00 00" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">İşə başlama tarixi</label>
            <input type="date" value={form.joining_date} onChange={e => set('joining_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)}
              className="w-4 h-4 accent-[#0f172a]" />
            <label className="text-xs text-[#555]">Aktiv işçi</label>
          </div>
        </div>
        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto">{member ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

function MemberCard({ member, role, onEdit, onDelete }) {
  const initials = member.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'

  return (
    <div className="bg-white border border-[#e8e8e4] rounded-lg p-4 hover:border-[#0f172a] transition-colors group">
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
          <button onClick={() => onEdit(member)} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={13} /></button>
          <button onClick={() => onDelete(member)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={13} /></button>
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
        {member.department && (
          <span className="text-[10px] text-[#aaa]">{member.department}</span>
        )}
      </div>
    </div>
  )
}

export default function IshciHeyetiPage() {
  const { addToast } = useToast()
  const [members, setMembers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editMember, setEditMember] = useState(null)
  const [deleteMember, setDeleteMember] = useState(null)
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

  async function handleSave(form) {
    if (!form.full_name.trim()) { addToast('Ad daxil edin', 'error'); return }
    const data = {
      full_name: form.full_name.trim(),
      email: form.email || null,
      phone: form.phone || null,
      role_id: form.role_id || null,
      department: form.department || null,
      monthly_salary: Number(form.monthly_salary) || 0,
      whatsapp_number: form.whatsapp_number || null,
      joining_date: form.joining_date || null,
      is_active: form.is_active
    }

    if (editMember) {
      const { error } = await supabase.from('profiles').update(data).eq('id', editMember.id)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('İşçi yeniləndi', 'success')
    } else {
      addToast('Yeni işçi əlavə etmək üçün əvvəlcə Authentication-da user yaradın', 'warning')
      return
    }

    setModalOpen(false)
    setEditMember(null)
    await loadData()
  }

  const getRole = id => roles.find(r => r.id === id)

  const filtered = filter === 'all' ? members
    : filter === 'active' ? members.filter(m => m.is_active)
    : members.filter(m => !m.is_active)

  if (loading) return <div className="p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 fade-in">
      <PageHeader
        title="İşçi Heyəti"
        subtitle={`${members.length} üzv · ${members.filter(m => m.is_active).length} aktiv`}
        action={
          <Button onClick={() => addToast('Yeni işçi əlavə etmək üçün Supabase → Authentication → Users bölməsindən istifadəçi yaradın', 'info')} size="sm">
            <IconPlus size={14} /> Yeni işçi
          </Button>
        }
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
          description="Supabase → Authentication → Users bölməsindən istifadəçi yaradın" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              role={getRole(member.role_id)}
              onEdit={m => { setEditMember(m); setModalOpen(true) }}
              onDelete={setDeleteMember}
            />
          ))}
        </div>
      )}

      <IshciForm
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditMember(null) }}
        onSave={handleSave}
        member={editMember}
        roles={roles}
      />

      <ConfirmDialog
        open={!!deleteMember}
        title="İşçini sil"
        message={`"${deleteMember?.full_name}" istifadəçisini silmək üçün Supabase → Authentication → Users bölməsinə keçin.`}
        onConfirm={() => setDeleteMember(null)}
        onCancel={() => setDeleteMember(null)}
      />
    </div>
  )
}
