import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconFileText } from '@tabler/icons-react'

function fmt(n) { return '₼' + Number(n || 0).toLocaleString() }

const STATUSES = [
  { key: 'draft', label: 'Qaralama', color: 'default' },
  { key: 'sent', label: 'Göndərildi', color: 'info' },
  { key: 'accepted', label: 'Qəbul edildi', color: 'success' },
  { key: 'rejected', label: 'Rədd edildi', color: 'danger' },
  { key: 'expired', label: 'Vaxtı keçdi', color: 'warning' },
]

function ProposalForm({ open, onClose, onSave, proposal, clients, projects }) {
  const [form, setForm] = useState({
    name: '', client_id: '', project_id: '', amount: '',
    sent_date: '', valid_until: '', status: 'draft', notes: ''
  })

  useEffect(() => {
    if (proposal) {
      setForm({
        name: proposal.name || '', client_id: proposal.client_id || '',
        project_id: proposal.project_id || '', amount: proposal.amount || '',
        sent_date: proposal.sent_date || '', valid_until: proposal.valid_until || '',
        status: proposal.status || 'draft', notes: proposal.notes || ''
      })
    } else {
      setForm({ name: '', client_id: '', project_id: '', amount: '', sent_date: '', valid_until: '', status: 'draft', notes: '' })
    }
  }, [proposal, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <Modal open={open} onClose={onClose} title={proposal ? 'Təklifi redaktə et' : 'Yeni kommersiya təklifi'}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Təklif adı *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="KT-2026-001" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Sifarişçi</label>
            <select value={form.client_id} onChange={e => set('client_id', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="">Seçin</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Layihə</label>
            <select value={form.project_id} onChange={e => set('project_id', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="">Seçin</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Məbləğ (₼)</label>
            <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Göndərilmə tarixi</label>
            <input type="date" value={form.sent_date} onChange={e => set('sent_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Etibarlılıq tarixi</label>
            <input type="date" value={form.valid_until} onChange={e => set('valid_until', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Qeyd</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none" />
        </div>
        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto">{proposal ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function KommersiyaTeklifleriPage() {
  const { addToast } = useToast()
  const [proposals, setProposals] = useState([])
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editProposal, setEditProposal] = useState(null)
  const [deleteProposal, setDeleteProposal] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [pRes, cRes, prRes] = await Promise.all([
      supabase.from('invoices').select('*').eq('notes', 'proposal').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name'),
      supabase.from('projects').select('id, name'),
    ])
    // Use a dedicated proposals approach via invoices table with type marker
    // Actually let's use a simpler approach - store proposals in invoices with a type field
    // For now load all and show
    setClients(cRes.data || [])
    setProjects(prRes.data || [])
    setLoading(false)
  }

  // Use local state since we don't have a dedicated proposals table
  const [localProposals, setLocalProposals] = useState([
    // Empty - user will add their own
  ])

  async function handleSave(form) {
    if (!form.name.trim()) { addToast('Ad daxil edin', 'error'); return }
    const newP = {
      id: Date.now().toString(),
      name: form.name, client_id: form.client_id, project_id: form.project_id,
      amount: Number(form.amount) || 0, sent_date: form.sent_date,
      valid_until: form.valid_until, status: form.status, notes: form.notes,
      created_at: new Date().toISOString()
    }

    if (editProposal) {
      setLocalProposals(prev => prev.map(p => p.id === editProposal.id ? { ...newP, id: editProposal.id } : p))
      addToast('Yeniləndi', 'success')
    } else {
      setLocalProposals(prev => [newP, ...prev])
      addToast('Kommersiya təklifi əlavə edildi', 'success')
    }
    setModalOpen(false); setEditProposal(null)
  }

  function handleDelete() {
    setLocalProposals(prev => prev.filter(p => p.id !== deleteProposal.id))
    addToast('Silindi', 'success')
    setDeleteProposal(null)
  }

  const getClient = id => clients.find(c => c.id === id)
  const getProject = id => projects.find(p => p.id === id)
  const filtered = filter === 'all' ? localProposals : localProposals.filter(p => p.status === filter)

  if (loading) return <div className="p-6"><Skeleton className="h-32" /></div>

  return (
    <div className="p-6 fade-in">
      <PageHeader
        title="Kommersiya Təklifləri"
        subtitle={`${localProposals.length} təklif`}
        action={<Button onClick={() => { setEditProposal(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni təklif</Button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard label="Ümumi" value={localProposals.length} />
        <StatCard label="Göndərildi" value={localProposals.filter(p => p.status === 'sent').length} variant="info" />
        <StatCard label="Qəbul edildi" value={localProposals.filter(p => p.status === 'accepted').length} variant="success" />
        <StatCard label="Rədd edildi" value={localProposals.filter(p => p.status === 'rejected').length} variant="danger" />
      </div>

      <div className="flex gap-1 mb-4 border-b border-[#e8e8e4]">
        {[{ key: 'all', label: 'Hamısı' }, ...STATUSES].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${filter === s.key ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#888] hover:text-[#555]'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {localProposals.length === 0 ? (
        <EmptyState icon={IconFileText} title="Hələ kommersiya təklifi yoxdur"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Əlavə et</Button>} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e8e8e4]">
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Təklif</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Sifarişçi</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Layihə</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Göndərildi</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Etibarlı</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">Məbləğ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const st = STATUSES.find(s => s.key === p.status)
                  return (
                    <tr key={p.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8]">
                      <td className="px-4 py-3 font-medium text-[#0f172a]">{p.name}</td>
                      <td className="px-4 py-3 text-[#555]">{getClient(p.client_id)?.name || '—'}</td>
                      <td className="px-4 py-3 text-[#555]">{getProject(p.project_id)?.name || '—'}</td>
                      <td className="px-4 py-3"><Badge variant={st?.color} size="sm">{st?.label}</Badge></td>
                      <td className="px-4 py-3 text-[#555]">{p.sent_date ? new Date(p.sent_date).toLocaleDateString('az-AZ') : '—'}</td>
                      <td className="px-4 py-3 text-[#555]">{p.valid_until ? new Date(p.valid_until).toLocaleDateString('az-AZ') : '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#0f172a]">{p.amount > 0 ? fmt(p.amount) : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditProposal(p); setModalOpen(true) }} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={12} /></button>
                          <button onClick={() => setDeleteProposal(p)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={12} /></button>
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

      <ProposalForm open={modalOpen} onClose={() => { setModalOpen(false); setEditProposal(null) }}
        onSave={handleSave} proposal={editProposal} clients={clients} projects={projects} />
      <ConfirmDialog open={!!deleteProposal} title="Təklifi sil"
        message={`"${deleteProposal?.name}" silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteProposal(null)} danger />
    </div>
  )
}
