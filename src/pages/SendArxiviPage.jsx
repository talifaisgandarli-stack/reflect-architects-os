import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconFolder, IconExternalLink, IconSearch } from '@tabler/icons-react'

const DOC_TYPES = [
  { key: 'contract', label: 'Müqavilə', color: 'info' },
  { key: 'project_task', label: 'Layihə tapşırığı', color: 'warning' },
  { key: 'price_offer', label: 'Qiymət təklifi', color: 'success' },
  { key: 'presentation', label: 'Təqdimat', color: 'default' },
  { key: 'other', label: 'Digər', color: 'default' },
]

const EMPLOYEE_TYPES = ['project_task', 'presentation']

function DocForm({ open, onClose, onSave, doc }) {
  const [form, setForm] = useState({ title: '', doc_type: 'contract', project: '', drive_link: '', notes: '' })

  useEffect(() => {
    if (doc) setForm({ title: doc.title || '', doc_type: doc.doc_type || 'contract', project: doc.project || '', drive_link: doc.drive_link || '', notes: doc.notes || '' })
    else setForm({ title: '', doc_type: 'contract', project: '', drive_link: '', notes: '' })
  }, [doc, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <Modal open={open} onClose={onClose} title={doc ? 'Sənədi redaktə et' : 'Yeni sənəd'}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Sənəd adı *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="Sənədin adı" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Növ</label>
            <select value={form.doc_type} onChange={e => set('doc_type', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {DOC_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Layihə</label>
            <input value={form.project} onChange={e => set('project', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="Layihə adı" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Google Drive linki</label>
          <input value={form.drive_link} onChange={e => set('drive_link', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="https://drive.google.com/..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Qeyd</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none" />
        </div>
        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto">{doc ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function SendArxiviPage() {
  const { addToast } = useToast()
  const { isAdmin } = useAuth()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editDoc, setEditDoc] = useState(null)
  const [deleteDoc, setDeleteDoc] = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error('Documents error:', error)
    setDocs(data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.title.trim()) { addToast('Ad daxil edin', 'error'); return }
    const data = { title: form.title.trim(), doc_type: form.doc_type, project: form.project || null, drive_link: form.drive_link || null, notes: form.notes || null }
    if (editDoc) {
      const { error } = await supabase.from('documents').update(data).eq('id', editDoc.id)
      if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin', 'error'); return }
      addToast('Yeniləndi', 'success')
    } else {
      const { error } = await supabase.from('documents').insert(data)
      if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin', 'error'); return }
      addToast('Sənəd əlavə edildi', 'success')
    }
    setModalOpen(false); setEditDoc(null); await loadData()
  }

  async function handleDelete() {
    await supabase.from('documents').delete().eq('id', deleteDoc.id)
    addToast('Silindi', 'success')
    setDeleteDoc(null); await loadData()
  }

  const visibleDocs = isAdmin ? docs : docs.filter(d => EMPLOYEE_TYPES.includes(d.doc_type))
  const filtered = visibleDocs.filter(d => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || (d.project || '').toLowerCase().includes(search.toLowerCase())
    const matchType = filter === 'all' || d.doc_type === filter
    return matchSearch && matchType
  })

  if (loading) return <div className="p-4 lg:p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-4 lg:p-6 fade-in">
      <PageHeader
        title="Sənəd Arxivi"
        subtitle={`${filtered.length} sənəd`}
        action={isAdmin ? (
          <Button onClick={() => { setEditDoc(null); setModalOpen(true) }} size="sm">
            <IconPlus size={14} /> Sənəd əlavə et
          </Button>
        ) : null}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {DOC_TYPES.filter(t => isAdmin || EMPLOYEE_TYPES.includes(t.key)).map(t => (
          <StatCard key={t.key} label={t.label} value={visibleDocs.filter(d => d.doc_type === t.key).length} />
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Sənəd adı və ya layihə axtar..."
            className="w-full pl-8 pr-3 py-2 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none focus:border-[#0f172a]" />
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b border-[#e8e8e4] flex-wrap">
        {[{ key: 'all', label: 'Hamısı' }, ...DOC_TYPES.filter(t => isAdmin || EMPLOYEE_TYPES.includes(t.key))].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${filter === t.key ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#888] hover:text-[#555]'}`}>
            {t.label}
            <span className="ml-1 text-[10px] text-[#aaa]">
              {t.key === 'all' ? visibleDocs.length : visibleDocs.filter(d => d.doc_type === t.key).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={IconFolder} title="Sənəd tapılmadı"
          action={isAdmin ? <Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Əlavə et</Button> : null} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(doc => {
            const dt = DOC_TYPES.find(t => t.key === doc.doc_type)
            return (
              <Card key={doc.id} className="p-4 group hover:border-[#0f172a] transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant={dt?.color} size="sm">{dt?.label}</Badge>
                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditDoc(doc); setModalOpen(true) }} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={12} /></button>
                      <button onClick={() => setDeleteDoc(doc)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={12} /></button>
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium text-[#0f172a] mb-1 truncate">{doc.title}</div>
                {doc.project && <div className="text-[10px] text-[#888] mb-2">{doc.project}</div>}
                {doc.notes && <div className="text-[10px] text-[#aaa] mb-2 line-clamp-2">{doc.notes}</div>}
                {doc.drive_link && (
                  <a href={doc.drive_link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700 mt-2">
                    <IconExternalLink size={11} /> Google Drive-da aç
                  </a>
                )}
                <div className="text-[9px] text-[#ccc] mt-2">
                  {new Date(doc.created_at).toLocaleDateString('az-AZ')}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <DocForm open={modalOpen} onClose={() => { setModalOpen(false); setEditDoc(null) }} onSave={handleSave} doc={editDoc} />
      <ConfirmDialog open={!!deleteDoc} title="Sənədi sil"
        message={`"${deleteDoc?.title}" silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteDoc(null)} danger />
    </div>
  )
}
