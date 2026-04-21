import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconUmbrella } from '@tabler/icons-react'

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

function LeaveForm({ open, onClose, onSave, leave, members }) {
  const [form, setForm] = useState({ member_id: '', leave_type: 'annual', start_date: '', end_date: '', reason: '', status: 'pending' })

  useEffect(() => {
    if (leave) setForm({ member_id: leave.member_id || '', leave_type: leave.leave_type || 'annual', start_date: leave.start_date || '', end_date: leave.end_date || '', reason: leave.reason || '', status: leave.status || 'pending' })
    else setForm({ member_id: '', leave_type: 'annual', start_date: '', end_date: '', reason: '', status: 'pending' })
  }, [leave, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  const days = form.start_date && form.end_date
    ? Math.floor((new Date(form.end_date) - new Date(form.start_date)) / 86400000) + 1
    : 0

  return (
    <Modal open={open} onClose={onClose} title={leave ? 'Məzuniyyəti redaktə et' : 'Yeni məzuniyyət sorğusu'}>
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
            <label className="block text-xs font-medium text-[#555] mb-1">Məzuniyyət növü</label>
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
            <label className="block text-xs font-medium text-[#555] mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          {days > 0 && (
            <div className="flex items-center">
              <div className="bg-[#f5f5f0] rounded-lg px-3 py-2 text-xs">
                <span className="text-[#888]">Müddət: </span>
                <span className="font-bold text-[#0f172a]">{days} gün</span>
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Səbəb</label>
          <textarea value={form.reason} onChange={e => set('reason', e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none"
            placeholder="Məzuniyyətin səbəbi..." />
        </div>
        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto">{leave ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function MezuniyyetCedveliPage() {
  const { addToast } = useToast()
  const [leaves, setLeaves] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editLeave, setEditLeave] = useState(null)
  const [deleteLeave, setDeleteLeave] = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('id, full_name').order('full_name')
    setMembers(data || [])
    setLoading(false)
  }

  const [localLeaves, setLocalLeaves] = useState([])

  function handleSave(form) {
    if (!form.member_id || !form.start_date || !form.end_date) { addToast('İşçi və tarixlər lazımdır', 'error'); return }
    if (editLeave) {
      setLocalLeaves(prev => prev.map(l => l.id === editLeave.id ? { ...l, ...form } : l))
      addToast('Yeniləndi', 'success')
    } else {
      setLocalLeaves(prev => [...prev, { id: Date.now().toString(), ...form }])
      addToast('Məzuniyyət əlavə edildi', 'success')
    }
    setModalOpen(false); setEditLeave(null)
  }

  function handleDelete() {
    setLocalLeaves(prev => prev.filter(l => l.id !== deleteLeave.id))
    addToast('Silindi', 'success')
    setDeleteLeave(null)
  }

  const getMember = id => members.find(m => m.id === id)
  const getDays = (s, e) => s && e ? Math.floor((new Date(e) - new Date(s)) / 86400000) + 1 : 0
  const today = new Date().toISOString().split('T')[0]
  const currentLeaves = localLeaves.filter(l => l.start_date <= today && l.end_date >= today && l.status === 'approved')

  if (loading) return <div className="p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 fade-in">
      <PageHeader
        title="Məzuniyyət Cədvəli"
        subtitle={`${localLeaves.length} sorğu`}
        action={<Button onClick={() => { setEditLeave(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Məzuniyyət əlavə et</Button>}
      />

      {currentLeaves.length > 0 && (
        <div className="mb-5 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <div className="text-xs font-bold text-blue-800 mb-1">Bu gün məzuniyyətdə olan işçilər</div>
          <div className="flex flex-wrap gap-2">
            {currentLeaves.map(l => (
              <span key={l.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {getMember(l.member_id)?.full_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {localLeaves.length === 0 ? (
        <EmptyState icon={IconUmbrella} title="Hələ məzuniyyət sorğusu yoxdur"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Əlavə et</Button>} />
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
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {localLeaves.sort((a, b) => new Date(b.start_date) - new Date(a.start_date)).map(l => {
                  const lt = LEAVE_TYPES.find(t => t.key === l.leave_type)
                  const st = STATUSES.find(s => s.key === l.status)
                  const days = getDays(l.start_date, l.end_date)
                  return (
                    <tr key={l.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8]">
                      <td className="px-4 py-3 font-medium text-[#0f172a]">{getMember(l.member_id)?.full_name || '—'}</td>
                      <td className="px-4 py-3"><Badge variant={lt?.color} size="sm">{lt?.label}</Badge></td>
                      <td className="px-4 py-3 text-[#555]">{new Date(l.start_date).toLocaleDateString('az-AZ')}</td>
                      <td className="px-4 py-3 text-[#555]">{new Date(l.end_date).toLocaleDateString('az-AZ')}</td>
                      <td className="px-4 py-3 text-center font-bold text-[#0f172a]">{days}</td>
                      <td className="px-4 py-3"><Badge variant={st?.color} size="sm">{st?.label}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
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

      <LeaveForm open={modalOpen} onClose={() => { setModalOpen(false); setEditLeave(null) }} onSave={handleSave} leave={editLeave} members={members} />
      <ConfirmDialog open={!!deleteLeave} title="Məzuniyyəti sil" message="Bu məzuniyyət sorğusunu silmək istədiyinizə əminsiniz?"
        onConfirm={handleDelete} onCancel={() => setDeleteLeave(null)} danger />
    </div>
  )
}
