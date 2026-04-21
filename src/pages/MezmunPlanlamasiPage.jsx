import { useState } from 'react'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconBrandInstagram } from '@tabler/icons-react'

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', color: 'danger' },
  { key: 'linkedin', label: 'LinkedIn', color: 'info' },
  { key: 'website', label: 'Vebsayt', color: 'default' },
  { key: 'other', label: 'Digər', color: 'default' },
]

const STATUSES = [
  { key: 'idea', label: 'İdea', color: 'default' },
  { key: 'in_progress', label: 'Hazırlanır', color: 'warning' },
  { key: 'ready', label: 'Hazır', color: 'info' },
  { key: 'published', label: 'Dərc edildi', color: 'success' },
]

const CONTENT_TYPES = ['Layihə nümayişi', 'Proses', 'Komanda', 'Xəbər', 'Reklam', 'Digər']

function ContentForm({ open, onClose, onSave, content }) {
  const [form, setForm] = useState({ title: '', platform: 'instagram', content_type: 'Layihə nümayişi', status: 'idea', planned_date: '', caption: '', assigned_to: '', notes: '' })

  useState(() => {
    if (content) setForm({ title: content.title || '', platform: content.platform || 'instagram', content_type: content.content_type || 'Layihə nümayişi', status: content.status || 'idea', planned_date: content.planned_date || '', caption: content.caption || '', assigned_to: content.assigned_to || '', notes: content.notes || '' })
    else setForm({ title: '', platform: 'instagram', content_type: 'Layihə nümayişi', status: 'idea', planned_date: '', caption: '', assigned_to: '', notes: '' })
  }, [content, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <Modal open={open} onClose={onClose} title={content ? 'Məzmunu redaktə et' : 'Yeni məzmun'} size="lg">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Başlıq *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="Məzmunun başlığı" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Platform</label>
            <select value={form.platform} onChange={e => set('platform', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Məzmun növü</label>
            <select value={form.content_type} onChange={e => set('content_type', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Planlanan tarix</label>
            <input type="date" value={form.planned_date} onChange={e => set('planned_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Cavabdeh</label>
            <input value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="Ad Soyad" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Kəpitan / Mətn</label>
          <textarea value={form.caption} onChange={e => set('caption', e.target.value)} rows={3}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none"
            placeholder="Post mətni..." />
        </div>
        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto">{content ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function MezmunPlanlamasiPage() {
  const { addToast } = useToast()
  const [contents, setContents] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editContent, setEditContent] = useState(null)
  const [deleteContent, setDeleteContent] = useState(null)
  const [filter, setFilter] = useState('all')

  function handleSave(form) {
    if (!form.title.trim()) { addToast('Başlıq daxil edin', 'error'); return }
    if (editContent) {
      setContents(prev => prev.map(c => c.id === editContent.id ? { ...c, ...form } : c))
      addToast('Yeniləndi', 'success')
    } else {
      setContents(prev => [...prev, { id: Date.now().toString(), ...form }])
      addToast('Məzmun əlavə edildi', 'success')
    }
    setModalOpen(false); setEditContent(null)
  }

  function handleDelete() {
    setContents(prev => prev.filter(c => c.id !== deleteContent.id))
    addToast('Silindi', 'success')
    setDeleteContent(null)
  }

  const filtered = filter === 'all' ? contents : contents.filter(c => c.status === filter)

  return (
    <div className="p-6 fade-in">
      <PageHeader
        title="Məzmun Planlaması"
        subtitle={`${contents.length} məzmun`}
        action={<Button onClick={() => { setEditContent(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni məzmun</Button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        {STATUSES.map(s => (
          <StatCard key={s.key} label={s.label} value={contents.filter(c => c.status === s.key).length} />
        ))}
      </div>

      <div className="flex gap-1 mb-4 border-b border-[#e8e8e4]">
        {[{ key: 'all', label: 'Hamısı' }, ...STATUSES].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${filter === s.key ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#888] hover:text-[#555]'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {contents.length === 0 ? (
        <EmptyState icon={IconBrandInstagram} title="Hələ məzmun planı yoxdur"
          description="Instagram, LinkedIn və digər platformalar üçün məzmun planlaması"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Əlavə et</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => {
            const pl = PLATFORMS.find(p => p.key === c.platform)
            const st = STATUSES.find(s => s.key === c.status)
            return (
              <Card key={c.id} className="p-4 hover:border-[#0f172a] transition-colors group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex gap-1.5 flex-wrap">
                    <Badge variant={pl?.color} size="sm">{pl?.label}</Badge>
                    <Badge variant={st?.color} size="sm">{st?.label}</Badge>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditContent(c); setModalOpen(true) }} className="text-[#aaa] hover:text-[#0f172a] p-0.5"><IconEdit size={12} /></button>
                    <button onClick={() => setDeleteContent(c)} className="text-[#aaa] hover:text-red-500 p-0.5"><IconTrash size={12} /></button>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-[#0f172a] mb-1">{c.title}</h3>
                {c.content_type && <div className="text-[10px] text-[#aaa] mb-2">{c.content_type}</div>}
                {c.caption && <p className="text-xs text-[#555] line-clamp-2 mb-2">{c.caption}</p>}
                <div className="flex items-center justify-between text-[10px] text-[#aaa] pt-2 border-t border-[#f5f5f0]">
                  <span>{c.assigned_to || '—'}</span>
                  {c.planned_date && <span>{new Date(c.planned_date).toLocaleDateString('az-AZ')}</span>}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <ContentForm open={modalOpen} onClose={() => { setModalOpen(false); setEditContent(null) }} onSave={handleSave} content={editContent} />
      <ConfirmDialog open={!!deleteContent} title="Məzmunu sil" message={`"${deleteContent?.title}" silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteContent(null)} danger />
    </div>
  )
}
