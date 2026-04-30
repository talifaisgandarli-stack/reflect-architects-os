import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconUsersGroup, IconMail, IconPhone, IconKey, IconPower, IconStar, IconChevronUp } from '@tabler/icons-react'

const CAREER_LEVELS = [
  { key: 'RA-1', label: 'Founding Partner — CEO & Chief Architect', az: 'Təsisçi Ortaq — CEO və Baş Memar', color: '#0a0a0a', text: '#f5f5f0', years: null },
  { key: 'RA-2', label: 'Partner', az: 'Ortaq', color: '#1c1c1c', text: '#e8e8e0', years: null },
  { key: 'L2', label: 'Senior Associate', az: 'Baş Əməkdaş', color: '#1a2744', text: '#dce8ff', years: '10+ il' },
  { key: 'L3', label: 'Project Architect', az: 'Layihə Memarı', color: '#1a3d2e', text: '#d0f0e0', years: '6–10 il' },
  { key: 'L4', label: 'Architect', az: 'Memar', color: '#2d3a00', text: '#eaf0b0', years: '3–6 il' },
  { key: 'L5', label: 'Junior Architect', az: 'Kiçik Memar', color: '#3a1f00', text: '#f5ddb0', years: '1–3 il' },
  { key: 'L6', label: 'Architectural Assistant', az: 'Memar Köməkçisi', color: '#2a1540', text: '#e8d0ff', years: '0–1 il' },
  { key: 'BD-1', label: 'Head of Business Development', az: 'Biznes İnkişaf Rəhbəri', color: '#1a3040', text: '#c0e0f8', years: null },
  { key: 'BD-2', label: 'Junior BD Manager', az: 'BD Köməkçi Menecer', color: '#0f2030', text: '#a8d0f0', years: '1–3 il' },
  { key: 'Ops', label: 'Operations', az: 'Əməliyyat', color: '#2a2a2a', text: '#e0e0e0', years: null },
]

function IshciForm({ open, onClose, onSave, member, roles, isNew }) {
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', role_id: '',
    department: '', joining_date: '', is_active: true,
    career_level: 'L6', promotion_eligible: false
  })
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (member) {
      setForm({
        full_name: member.full_name || '',
        email: member.email || '',
        phone: member.phone || '',
        role_id: member.role_id || '',
        department: member.department || '',
        joining_date: member.joining_date || '',
        is_active: member.is_active !== false,
        career_level: member.career_level || 'L6',
        promotion_eligible: member.promotion_eligible || false
      })
    } else {
      setForm({ full_name: '', email: '', phone: '', role_id: '', department: '', joining_date: '', is_active: true, career_level: 'L6', promotion_eligible: false })
      setPassword('')
    }
  }, [member, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  const cl = CAREER_LEVELS.find(l => l.key === form.career_level)

  return (
    <Modal open={open} onClose={onClose} title={isNew ? 'Yeni işçi əlavə et' : 'İşçini redaktə et'}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Ad Soyad *</label>
          <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="Ad Soyad" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">E-poçt {isNew && '*'}</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="ad@reflect.az" disabled={!isNew} />
          </div>
          {isNew && (
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1">Şifrə *</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
                placeholder="Minimum 6 simvol" />
            </div>
          )}
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
              placeholder="Memarlıq, BD..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">İşə başlama tarixi</label>
            <input type="date" value={form.joining_date} onChange={e => set('joining_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
        </div>

        {/* Karyera səviyyəsi */}
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Karyera səviyyəsi</label>
          <select value={form.career_level} onChange={e => set('career_level', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
            {CAREER_LEVELS.map(l => <option key={l.key} value={l.key}>{l.key} — {l.label} ({l.az})</option>)}
          </select>
          {cl && (
            <div className="mt-1.5 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: cl.color, color: cl.text }}>
              {cl.key} · {cl.label} · {cl.az}{cl.years ? ` · ${cl.years}` : ''}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.promotion_eligible} onChange={e => set('promotion_eligible', e.target.checked)} className="w-4 h-4 accent-[#0f172a]" />
            <span className="text-xs text-[#555]">🚀 Erkən yüksəliş hüququ</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 accent-[#0f172a]" />
            <span className="text-xs text-[#555]">Aktiv işçi</span>
          </label>
        </div>

        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form, password)} className="ml-auto">
            {isNew ? 'Əlavə et' : 'Yadda saxla'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function MemberCard({ member, role, onEdit, onDelete, onResetPassword, onToggleActive, isAdmin }) {
  const initials = member.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  const cl = CAREER_LEVELS.find(l => l.key === member.career_level)

  return (
    <div className="bg-white border border-[#e8e8e4] rounded-xl overflow-hidden hover:border-[#0f172a] transition-colors group">
      {/* Karyera səviyyəsi rəngli başlıq */}
      {cl && (
        <div className="px-3 py-1.5 flex items-center justify-between" style={{ background: cl.color }}>
          <span className="text-[10px] font-bold tracking-wider" style={{ color: cl.text }}>{cl.key}</span>
          <span className="text-[10px]" style={{ color: cl.text, opacity: 0.75 }}>{cl.az}</span>
          {member.promotion_eligible && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-400 text-yellow-900 font-bold">🚀 Yüksəliş</span>
          )}
        </div>
      )}

      <div className="p-4">
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
          {isAdmin && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEdit(member)} className="text-[#aaa] hover:text-[#0f172a] p-1" title="Redaktə"><IconEdit size={13} /></button>
              <button onClick={() => onResetPassword(member)} className="text-[#aaa] hover:text-blue-500 p-1" title="Şifrə sıfırla"><IconKey size={13} /></button>
              <button onClick={() => onToggleActive(member)} className={`p-1 ${member.is_active ? 'text-[#aaa] hover:text-red-500' : 'text-[#aaa] hover:text-green-500'}`} title={member.is_active ? 'Deaktiv et' : 'Aktiv et'}>
                <IconPower size={13} />
              </button>
            </div>
          )}
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
          {member.joining_date && (
            <div className="text-[10px] text-[#aaa]">
              İşə başlama: {new Date(member.joining_date).toLocaleDateString('az-AZ')}
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
    </div>
  )
}

export default function IshciHeyetiPage() {
  const { addToast } = useToast()
  const { isAdmin } = useAuth()
  const [members, setMembers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [editMember, setEditMember] = useState(null)
  const [deleteMember, setDeleteMember] = useState(null)
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

  async function handleSave(form, password) {
    if (!form.full_name.trim()) { addToast('Ad daxil edin', 'error'); return }

    if (isNew) {
      if (!form.email || !password) { addToast('Email və şifrə daxil edin', 'error'); return }
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ action: 'create', email: form.email, password, full_name: form.full_name, role_id: form.role_id, department: form.department, phone: form.phone, joining_date: form.joining_date, career_level: form.career_level, promotion_eligible: form.promotion_eligible })
      })
      const data = await res.json()
      if (!res.ok) { addToast('Xəta: ' + (data.error || 'Bilinməyən xəta'), 'error'); return }
      addToast('İşçi əlavə edildi', 'success')
    } else {
      const { error } = await supabase.from('profiles').update({
        full_name: form.full_name.trim(),
        phone: form.phone || null,
        role_id: form.role_id || null,
        department: form.department || null,
        joining_date: form.joining_date || null,
        is_active: form.is_active,
        career_level: form.career_level,
        promotion_eligible: form.promotion_eligible
      }).eq('id', editMember.id)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Yeniləndi', 'success')
    }
    setModalOpen(false); setEditMember(null); await loadData()
  }

  async function handleResetPassword() {
    const { error } = await supabase.auth.resetPasswordForEmail(resetMember.email)
    if (error) { addToast('Xəta: ' + error.message, 'error') }
    else addToast('Şifrə sıfırlama emaili göndərildi', 'success')
    setResetMember(null)
  }

  async function handleToggleActive() {
    await supabase.from('profiles').update({ is_active: !confirmToggle.is_active }).eq('id', confirmToggle.id)
    addToast(confirmToggle.is_active ? 'Deaktiv edildi' : 'Aktiv edildi', 'success')
    setConfirmToggle(null); await loadData()
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
        <EmptyState icon={IconUsersGroup} title="Hələ işçi yoxdur" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              role={getRole(member.role_id)}
              onEdit={m => { setIsNew(false); setEditMember(m); setModalOpen(true) }}
              onDelete={setDeleteMember}
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
        onSave={handleSave}
        member={editMember}
        roles={roles}
        isNew={isNew}
      />
      <ConfirmDialog open={!!resetMember} title="Şifrə sıfırla"
        message={`${resetMember?.email} ünvanına şifrə sıfırlama emaili göndəriləcək.`}
        onConfirm={handleResetPassword} onCancel={() => setResetMember(null)} />
      <ConfirmDialog open={!!confirmToggle} title={confirmToggle?.is_active ? 'Deaktiv et' : 'Aktiv et'}
        message={`${confirmToggle?.full_name} üçün statusu dəyişmək istədiyinizə əminsiniz?`}
        onConfirm={handleToggleActive} onCancel={() => setConfirmToggle(null)} danger={confirmToggle?.is_active} />
    </div>
  )
}
