import { useState } from 'react'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconFolder, IconFile, IconExternalLink, IconSearch } from '@tabler/icons-react'

const DOC_TYPES = [
  { key: 'contract', label: 'Müqavilə', color: 'info' },
  { key: 'project_task', label: 'Layihə tapşırığı', color: 'warning' },
  { key: 'price_offer', label: 'Qiymət təklifi', color: 'success' },
  { key: 'presentation', label: 'Təqdimat', color: 'default' },
  { key: 'other', label: 'Digər', color: 'default' },
]

function DocForm({ open, onClose, onSave, doc }) {
  const [form, setForm] = useState({ title: '', doc_type: 'other', project: '', drive_link: '', notes: '' })

  useState(() => {
    if (doc) setForm({ title: doc.title || '', doc_type: doc.doc_type || 'other', project: doc.project || '', drive_link: doc.drive_link || '', notes: doc.notes || '' })
    else setForm({ title: '', doc_type: 'other', project: '', drive_link: '', notes: '' })
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
              placeholder="Layihənin adı" />
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
  const [docs, setDocs] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editDoc, setEditDoc] = useState(null)
  const [deleteDoc, setDeleteDoc] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  function handleSave(form) {
    if (!form.title.trim()) { addToast('Ad daxil edin', 'error'); return }
    const data = { ...form, created_at: new Date().toISOString() }
    if (editDoc) {
      setDocs(prev => prev.map(d => d.id === editDoc.id ? { ...d, ...data } : d))
      addToast('Yeniləndi', 'success')
    } else {
      setDocs(prev => [...prev, { id: Date.now().toString(), ...data }])
      addToast('Sənəd əlavə edildi', 'success')
    }
    setModalOpen(false); setEditDoc(null)
  }

  function handleDelete() {
    setDocs(prev => prev.filter(d => d.id !== deleteDoc.id))
    addToast('Silindi', 'success')
    setDeleteDoc(null)
  }

  const filtered = docs.filter(d => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.project?.toLowerCase().includes(search.toLowerCase())
    const matchType = filter === 'all' || d.doc_type === filter
    return matchSearch && matchType
  })

  return (
    <div className="p-6 fade-in">
      <PageHeader
        title="Sənəd Arxivi"
        subtitle={`${docs.length} sənəd · Google Drive inteqrasiyası`}
        action={<Button onClick={() => { setEditDoc(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Sənəd əlavə et</Button>}
      />

      {/* Search */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="Sənəd adı, layihə axtar..." />
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b border-[#e8e8e4]">
        {[{ key: 'all', label: 'Hamısı' }, ...DOC_TYPES].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${filter === t.key ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#888] hover:text-[#555]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {docs.length === 0 ? (
        <EmptyState icon={IconFolder} title="Hələ sənəd yoxdur"
          description="Müqavilələr, çertyojlar, icazələr və digər sənədləri Google Drive linki ilə əlavə edin"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Sənəd əlavə et</Button>} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e8e8e4]">
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Sənəd</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Növ</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Layihə</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Tarix</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Drive</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const dt = DOC_TYPES.find(t => t.key === d.doc_type)
                  return (
                    <tr key={d.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <IconFile size={14} className="text-[#aaa]" />
                          <span className="font-medium text-[#0f172a]">{d.title}</span>
                        </div>
                        {d.notes && <div className="text-[10px] text-[#aaa] mt-0.5 ml-5">{d.notes}</div>}
                      </td>
                      <td className="px-4 py-3"><Badge variant={dt?.color} size="sm">{dt?.label}</Badge></td>
                      <td className="px-4 py-3 text-[#555]">{d.project || '—'}</td>
                      <td className="px-4 py-3 text-[#555]">{d.created_at ? new Date(d.created_at).toLocaleDateString('az-AZ') : '—'}</td>
                      <td className="px-4 py-3">
                        {d.drive_link ? (
                          <a href={d.drive_link} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-500 hover:text-blue-700 transition-colors">
                            <IconExternalLink size={12} />
                            <span>Aç</span>
                          </a>
                        ) : <span className="text-[#ddd]">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditDoc(d); setModalOpen(true) }} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={12} /></button>
                          <button onClick={() => setDeleteDoc(d)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={12} /></button>
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

      <DocForm open={modalOpen} onClose={() => { setModalOpen(false); setEditDoc(null) }} onSave={handleSave} doc={editDoc} />
      <ConfirmDialog open={!!deleteDoc} title="Sənədi sil" message={`"${deleteDoc?.title}" silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteDoc(null)} danger />
    </div>
  )
}
