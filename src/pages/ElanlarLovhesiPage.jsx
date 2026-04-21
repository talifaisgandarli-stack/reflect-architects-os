import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Button, EmptyState, Modal, ConfirmDialog, Skeleton } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconSpeakerphone } from '@tabler/icons-react'

const PRIORITIES = [
  { key: 'urgent', label: 'Təcili', color: 'danger' },
  { key: 'normal', label: 'Normal', color: 'default' },
  { key: 'info', label: 'Məlumat', color: 'info' },
]

function ElanForm({ open, onClose, onSave, elan }) {
  const [form, setForm] = useState({ title: '', content: '', priority: 'normal' })

  useEffect(() => {
    if (elan) setForm({ title: elan.title || '', content: elan.content || '', priority: elan.priority || 'normal' })
    else setForm({ title: '', content: '', priority: 'normal' })
  }, [elan, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <Modal open={open} onClose={onClose} title={elan ? 'Elanı redaktə et' : 'Yeni elan'}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Başlıq *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="Elanın başlığı" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Prioritet</label>
          <select value={form.priority} onChange={e => set('priority', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
            {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Məzmun</label>
          <textarea value={form.content} onChange={e => set('content', e.target.value)} rows={4}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none"
            placeholder="Elanın tam mətni..." />
        </div>
        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto">{elan ? 'Yadda saxla' : 'Dərc et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function ElanlarLovhesiPage() {
  const { addToast } = useToast()
  const { profile } = useAuth()
  const [elanlar, setElanlar] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editElan, setEditElan] = useState(null)
  const [deleteElan, setDeleteElan] = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('notices').select('*, profiles(full_name)').order('created_at', { ascending: false })
    setElanlar(data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.title.trim()) { addToast('Başlıq daxil edin', 'error'); return }
    const data = { title: form.title.trim(), content: form.content || null, priority: form.priority, author_id: profile?.id || null }
    if (editElan) {
      const { error } = await supabase.from('notices').update(data).eq('id', editElan.id)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Yeniləndi', 'success')
    } else {
      const { error } = await supabase.from('notices').insert(data)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Elan dərc edildi', 'success')
    }
    setModalOpen(false); setEditElan(null); await loadData()
  }

  async function handleDelete() {
    await supabase.from('notices').delete().eq('id', deleteElan.id)
    addToast('Silindi', 'success')
    setDeleteElan(null); await loadData()
  }

  const urgent = elanlar.filter(e => e.priority === 'urgent')
  const others = elanlar.filter(e => e.priority !== 'urgent')

  if (loading) return <div className="p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 fade-in">
      <PageHeader
        title="Elanlar Lövhəsi"
        subtitle={`${elanlar.length} elan`}
        action={<Button onClick={() => { setEditElan(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni elan</Button>}
      />

      {elanlar.length === 0 ? (
        <EmptyState icon={IconSpeakerphone} title="Hələ elan yoxdur"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Elan dərc et</Button>} />
      ) : (
        <div className="space-y-3">
          {urgent.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">🔴 Təcili elanlar</div>
              {urgent.map(e => <ElanCard key={e.id} elan={e} onEdit={e => { setEditElan(e); setModalOpen(true) }} onDelete={setDeleteElan} />)}
            </div>
          )}
          {others.map(e => <ElanCard key={e.id} elan={e} onEdit={e => { setEditElan(e); setModalOpen(true) }} onDelete={setDeleteElan} />)}
        </div>
      )}

      <ElanForm open={modalOpen} onClose={() => { setModalOpen(false); setEditElan(null) }} onSave={handleSave} elan={editElan} />
      <ConfirmDialog open={!!deleteElan} title="Elanı sil" message={`"${deleteElan?.title}" elanını silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteElan(null)} danger />
    </div>
  )
}

function ElanCard({ elan, onEdit, onDelete }) {
  const pr = PRIORITIES.find(p => p.key === elan.priority)
  const timeAgo = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 60000)
    if (diff < 60) return `${diff} dəq əvvəl`
    if (diff < 1440) return `${Math.floor(diff / 60)} saat əvvəl`
    return `${Math.floor(diff / 1440)} gün əvvəl`
  }

  return (
    <div className={`bg-white border rounded-lg p-4 group hover:border-[#0f172a] transition-colors ${elan.priority === 'urgent' ? 'border-red-200' : 'border-[#e8e8e4]'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant={pr?.color} size="sm">{pr?.label}</Badge>
          <h3 className="text-sm font-bold text-[#0f172a]">{elan.title}</h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(elan)} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={13} /></button>
          <button onClick={() => onDelete(elan)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={13} /></button>
        </div>
      </div>
      {elan.content && <p className="text-xs text-[#555] leading-relaxed mb-3">{elan.content}</p>}
      <div className="flex items-center gap-3 text-[10px] text-[#aaa]">
        <span>{elan.profiles?.full_name || 'Sistem'}</span>
        <span>·</span>
        <span>{timeAgo(elan.created_at)}</span>
      </div>
    </div>
  )
}
