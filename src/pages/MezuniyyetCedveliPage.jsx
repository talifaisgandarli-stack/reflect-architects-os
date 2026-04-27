import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { notifyAdmins } from '../lib/notify'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconUmbrella, IconCheck, IconX, IconSend } from '@tabler/icons-react'

const LEAVE_TYPES = [
  { key: 'annual', label: 'İllik məzuniyyət', color: 'success' },
  { key: 'sick', label: 'Xəstəlik', color: 'warning' },
  { key: 'unpaid', label: 'Ödənişsiz', color: 'default' },
  { key: 'other', label: 'Digər', color: 'info' },
]

const STATUSES = [
  { key: 'pending', label: 'Gözləyir', color: 'warning' },
  { key: 'approved', label: 'Təsdiqləndi', color: 'success' },
  { key: 'rejected', label: 'Rədd edildi', color: 'danger' },
]

const APPROVERS = [
  { id: 'nicat', name: 'Nicat Nusalov' },
  { id: 'turkan', name: 'Türkan Agayeva' },
  { id: 'talifa', name: 'Talifa İsgəndərli' },
]

function RequestForm({ open, onClose, onSave, leave, members, isAdmin }) {
  const [form, setForm] = useState({
    member_id: '', leave_type: 'annual', start_date: '', end_date: '',
    reason: '', approver_name: '', status: 'pending'
  })

  useEffect(() => {
    if (leave) {
      setForm({
        member_id: leave.member_id || '',
        leave_type: leave.leave_type || 'annual',
        start_date: leave.start_date || '',
        end_date: leave.end_date || '',
        reason: leave.reason || '',
        approver_name: leave.approver_name || '',
        status: leave.status || 'pending'
      })
    } else {
      setForm({ member_id: '', leave_type: 'annual', start_date: '', end_date: '', reason: '', approver_name: '', status: 'pending' })
    }
  }, [leave, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  const days = form.start_date && form.end_date
    ? Math.floor((new Date(form.end_date) - new Date(form.start_date)) / 86400000) + 1 : 0

  return (
    <Modal open={open} onClose={onClose} title={leave ? 'Sorğunu redaktə et' : 'Məzuniyyət sorğusu göndər'}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">İşçi *</label>
            <select value={form.member_id} onChange={e => set('member_id', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="">Seçin</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Növ</label>
            <select value={form.leave_type} onChange={e => set('leave_type', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {LEAVE_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Başlama tarixi *</label>
            <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Bitmə tarixi *</label>
            <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Təsdiqləyici *</label>
            <select value={form.approver_name} onChange={e => set('approver_name', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="">Seçin</option>
              {APPROVERS.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
          </div>
          {days > 0 && (
            <div className="flex items-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs w-full text-center">
                <span className="text-[#888]">Müddət: </span>
                <span className="font-bold text-blue-700">{days} iş günü</span>
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Səbəb / Qeyd</label>
          <textarea value={form.reason} onChange={e => set('reason', e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none"
            placeholder="Məzuniyyətin səbəbi..." />
        </div>
        {isAdmin && (
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        )}
        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto">
            <IconSend size={13} /> {leave ? 'Yadda saxla' : 'Sorğu göndər'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function MezuniyyetCedveliPage() {
  const { addToast } = useToast()
  const { profile, isAdmin, user } = useAuth()
  const [leaves, setLeaves] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editLeave, setEditLeave] = useState(null)
  const [deleteLeave, setDeleteLeave] = useState(null)
  const [filter, setFilter] = useState('all')


  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [lRes, mRes] = await Promise.all([
      supabase.from('leave_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name').order('full_name'),
    ])
    setLeaves(lRes.data || [])
    setMembers(mRes.data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.member_id || !form.start_date || !form.end_date) {
      addToast('İşçi və tarixlər lazımdır', 'error'); return
    }
    if (!form.approver_name) {
      addToast('Təsdiqləyici seçin', 'error'); return
    }
    const days = Math.floor((new Date(form.end_date) - new Date(form.start_date)) / 86400000) + 1
    const data = {
      member_id: form.member_id,
      leave_type: form.leave_type,
      start_date: form.start_date,
      end_date: form.end_date,
      days,
      reason: form.reason || null,
      approver_name: form.approver_name,
      status: form.status || 'pending',
      requested_by: profile?.full_name || null,
    }
    if (editLeave) {
      const { error } = await supabase.from('leave_requests').update(data).eq('id', editLeave.id)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Yeniləndi', 'success')
    } else {
      const { error } = await supabase.from('leave_requests').insert(data)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast(`Sorğu göndərildi → ${form.approver_name}`, 'success')
    }
    setModalOpen(false); setEditLeave(null)
    await loadData()
  }

  async function handleApprove(leave, status) {
    const { error } = await supabase.from('leave_requests').update({
      status,
      approved_by: profile?.full_name || 'Admin',
      approved_at: new Date().toISOString()
    }).eq('id', leave.id)
    if (error) { addToast('Xəta: ' + error.message, 'error'); return }
    addToast(status === 'approved' ? 'Təsdiqləndi ✓' : 'Rədd edildi', status === 'approved' ? 'success' : 'error')
    await loadData()
  }

  async function handleDelete() {
    await supabase.from('leave_requests').delete().eq('id', deleteLeave.id)
    addToast('Silindi', 'success')
    setDeleteLeave(null); await loadData()
  }

  const getMember = id => members.find(m => m.id === id)
  const today = new Date().toISOString().split('T')[0]
  const onLeaveToday = leaves.filter(l => l.status === 'approved' && l.start_date <= today && l.end_date >= today)
  const pending = leaves.filter(l => l.status === 'pending')
  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter)

  if (loading) return <div className="p-4 lg:p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-4 lg:p-6 fade-in">
      <PageHeader
        title="Məzuniyyət Cədvəli"
        subtitle={`${leaves.length} sorğu · ${pending.length} gözləyir`}
        action={
          <Button onClick={() => { setEditLeave(null); setModalOpen(true) }} size="sm">
            <IconPlus size={14} /> Sorğu göndər
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Ümumi sorğu" value={leaves.length} />
        <StatCard label="Gözləyir" value={pending.length} variant={pending.length > 0 ? 'warning' : 'default'} />
        <StatCard label="Təsdiqləndi" value={leaves.filter(l => l.status === 'approved').length} variant="success" />
        <StatCard label="Bu gün məzuniyyətdə" value={onLeaveToday.length} variant="info" />
      </div>

      {onLeaveToday.length > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <div className="text-xs font-bold text-blue-800 mb-1.5">🏖 Bu gün məzuniyyətdə</div>
          <div className="flex flex-wrap gap-2">
            {onLeaveToday.map(l => (
              <span key={l.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {getMember(l.member_id)?.full_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {pending.length > 0 && isAdmin && (
        <div className="mb-4">
          <div className="text-xs font-bold text-[#0f172a] mb-2">⏳ Təsdiq gözləyən sorğular</div>
          <div className="space-y-2">
            {pending.map(l => {
              const lt = LEAVE_TYPES.find(t => t.key === l.leave_type)
              return (
                <div key={l.id} className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-[#0f172a]">
                      {getMember(l.member_id)?.full_name} — <Badge variant={lt?.color} size="sm">{lt?.label}</Badge>
                    </div>
                    <div className="text-[10px] text-[#888] mt-0.5">
                      {new Date(l.start_date).toLocaleDateString('az-AZ')} → {new Date(l.end_date).toLocaleDateString('az-AZ')} · {l.days} gün
                      {l.approver_name && <span className="ml-2">· Təsdiqləyici: <strong>{l.approver_name}</strong></span>}
                    </div>
                    {l.reason && <div className="text-[10px] text-[#888] mt-0.5 italic">"{l.reason}"</div>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(l, 'approved')}
                      className="flex items-center gap-1 text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors">
                      <IconCheck size={12} /> Təsdiqlə
                    </button>
                    <button onClick={() => handleApprove(l, 'rejected')}
                      className="flex items-center gap-1 text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors">
                      <IconX size={12} /> Rədd et
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-4 border-b border-[#e8e8e4]">
        {[{ key: 'all', label: 'Hamısı' }, ...STATUSES].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${filter === s.key ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#888] hover:text-[#555]'}`}>
            {s.label}
            <span className="ml-1 text-[10px] text-[#aaa]">
              {s.key === 'all' ? leaves.length : leaves.filter(l => l.status === s.key).length}
            </span>
          </button>
        ))}
      </div>

      {leaves.length === 0 ? (
        <EmptyState icon={IconUmbrella} title="Hələ məzuniyyət sorğusu yoxdur"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Sorğu göndər</Button>} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e8e8e4]">
                  <th className="text-left px-4 py-3 font-medium text-[#888]">İşçi</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Növ</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Başlama</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Bitmə</th>
                  <th className="text-center px-4 py-3 font-medium text-[#888]">Gün</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Təsdiqləyici</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => {
                  const lt = LEAVE_TYPES.find(t => t.key === l.leave_type)
                  const st = STATUSES.find(s => s.key === l.status)
                  return (
                    <tr key={l.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8]">
                      <td className="px-4 py-3 font-medium text-[#0f172a]">{getMember(l.member_id)?.full_name || '—'}</td>
                      <td className="px-4 py-3"><Badge variant={lt?.color} size="sm">{lt?.label}</Badge></td>
                      <td className="px-4 py-3 text-[#555]">{new Date(l.start_date).toLocaleDateString('az-AZ')}</td>
                      <td className="px-4 py-3 text-[#555]">{new Date(l.end_date).toLocaleDateString('az-AZ')}</td>
                      <td className="px-4 py-3 text-center font-bold text-[#0f172a]">{l.days}</td>
                      <td className="px-4 py-3 text-[#555]">{l.approver_name || '—'}</td>
                      <td className="px-4 py-3">
                        <div><Badge variant={st?.color} size="sm">{st?.label}</Badge></div>
                        {l.approved_by && <div className="text-[10px] text-[#aaa] mt-0.5">{l.approved_by}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {l.status === 'pending' && isAdmin && (
                            <>
                              <button onClick={() => handleApprove(l, 'approved')} className="text-[#aaa] hover:text-green-600 p-1" title="Təsdiqlə"><IconCheck size={12} /></button>
                              <button onClick={() => handleApprove(l, 'rejected')} className="text-[#aaa] hover:text-red-500 p-1" title="Rədd et"><IconX size={12} /></button>
                            </>
                          )}
                          <button onClick={() => { setEditLeave(l); setModalOpen(true) }} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={12} /></button>
                          <button onClick={() => setDeleteLeave(l)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <RequestForm open={modalOpen} onClose={() => { setModalOpen(false); setEditLeave(null) }}
        onSave={handleSave} leave={editLeave} members={isAdmin ? members : members.filter(m => m.id === user?.id)} isAdmin={isAdmin} />
      <ConfirmDialog open={!!deleteLeave} title="Sorğunu sil"
        message="Bu məzuniyyət sorğusunu silmək istədiyinizə əminsiniz?"
        onConfirm={handleDelete} onCancel={() => setDeleteLeave(null)} danger />
    </div>
  )
}
