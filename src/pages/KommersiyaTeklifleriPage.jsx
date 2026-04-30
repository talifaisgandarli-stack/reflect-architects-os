import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconFileText } from '@tabler/icons-react'

const EDV = 0.18
function fmt(n) { return '₼' + Number(n || 0).toLocaleString() }
function edv(n) { return Math.round(Number(n || 0) * EDV) }
function withEdv(n) { return Math.round(Number(n || 0) * (1 + EDV)) }

const STATUSES = [
  { key: 'draft', label: 'Qaralama', color: 'default' },
  { key: 'sent', label: 'Göndərildi', color: 'info' },
  { key: 'accepted', label: 'Qəbul edildi', color: 'success' },
  { key: 'rejected', label: 'Rədd edildi', color: 'danger' },
  { key: 'expired', label: 'Vaxtı keçdi', color: 'warning' },
]

function ProposalForm({ open, onClose, onSave, proposal, clients, projects }) {
  const [form, setForm] = useState({ name: '', client_id: '', project_id: '', amount: '', payment_method: 'transfer', sent_date: '', valid_until: '', status: 'draft', notes: '' })

  useEffect(() => {
    if (proposal) {
      setForm({ name: proposal.name || '', client_id: proposal.client_id || '', project_id: proposal.project_id || '', amount: proposal.amount || '', payment_method: proposal.payment_method || 'transfer', sent_date: proposal.sent_date || '', valid_until: proposal.valid_until || '', status: proposal.status || 'draft', notes: proposal.notes || '' })
    } else {
      setForm({ name: '', client_id: '', project_id: '', amount: '', payment_method: 'transfer', sent_date: '', valid_until: '', status: 'draft', notes: '' })
    }
  }, [proposal, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  const amt = Number(form.amount) || 0
  const isTransfer = form.payment_method === 'transfer'

  return (
    <Modal open={open} onClose={onClose} title={proposal ? 'Təklifi redaktə et' : 'Yeni kommersiya təklifi'}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Təklif adı *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="KT-2026-001" />
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
            <label className="block text-xs font-medium text-[#555] mb-1">Məbləğ (₼, ƏDV xaric)</label>
            <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Ödəniş üsulu</label>
            <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="transfer">Köçürmə</option>
              <option value="cash">Nağd</option>
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

        {amt > 0 && (
          <div className={`rounded-lg p-3 text-xs ${isTransfer ? 'bg-amber-50 border border-amber-200' : 'bg-[#f5f5f0]'}`}>
            {isTransfer ? (
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><div className="text-[#888] mb-0.5">ƏDV xaric</div><div className="font-bold text-[#0f172a]">{fmt(amt)}</div></div>
                <div><div className="text-[#888] mb-0.5">ƏDV (18%)</div><div className="font-bold text-amber-600">{fmt(edv(amt))}</div></div>
                <div><div className="text-[#888] mb-0.5">ƏDV daxil</div><div className="font-bold text-green-600">{fmt(withEdv(amt))}</div></div>
              </div>
            ) : (
              <div className="text-center text-[#555]">Nağd ödəniş — ƏDV tətbiq edilmir · Cəmi: <span className="font-bold text-[#0f172a]">{fmt(amt)}</span></div>
            )}
          </div>
        )}

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
      supabase.from('proposals').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name'),
      supabase.from('projects').select('id, name'),
    ])
    setProposals(pRes.data || [])
    setClients(cRes.data || [])
    setProjects(prRes.data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.name.trim()) { addToast('Ad daxil edin', 'error'); return }
    const amt = Number(form.amount) || 0
    const isTransfer = form.payment_method === 'transfer'
    const data = {
      name: form.name.trim(), client_id: form.client_id || null, project_id: form.project_id || null,
      amount: amt, payment_method: form.payment_method,
      edv_amount: isTransfer ? edv(amt) : 0,
      amount_with_edv: isTransfer ? withEdv(amt) : amt,
      sent_date: form.sent_date || null, valid_until: form.valid_until || null,
      status: form.status, notes: form.notes || null
    }
    if (editProposal) {
      const { error } = await supabase.from('proposals').update(data).eq('id', editProposal.id)
      if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin', 'error'); return }
      addToast('Yeniləndi', 'success')
    } else {
      const { error } = await supabase.from('proposals').insert(data)
      if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin', 'error'); return }
      addToast('Kommersiya təklifi əlavə edildi', 'success')
    }
    setModalOpen(false); setEditProposal(null); await loadData()
  }

  async function handleDelete() {
    await supabase.from('proposals').delete().eq('id', deleteProposal.id)
    addToast('Silindi', 'success')
    setDeleteProposal(null); await loadData()
  }

  const getClient = id => clients.find(c => c.id === id)
  const getProject = id => projects.find(p => p.id === id)
  const filtered = filter === 'all' ? proposals : proposals.filter(p => p.status === filter)
  const totalAccepted = proposals.filter(p => p.status === 'accepted').reduce((s, p) => s + Number(p.amount || 0), 0)
  const totalAcceptedWithEdv = proposals.filter(p => p.status === 'accepted').reduce((s, p) => s + Number(p.amount_with_edv || p.amount || 0), 0)

  if (loading) return <div className="p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 fade-in">
      <PageHeader title="Kommersiya Təklifləri" subtitle={`${proposals.length} təklif`}
        action={<Button onClick={() => { setEditProposal(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni təklif</Button>} />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard label="Ümumi" value={proposals.length} />
        <StatCard label="Qəbul edildi" value={proposals.filter(p => p.status === 'accepted').length} variant="success" />
        <StatCard label="Qəbul (ƏDV xaric)" value={fmt(totalAccepted)} variant="success" />
        <StatCard label="Qəbul (ƏDV daxil)" value={fmt(totalAcceptedWithEdv)} />
      </div>

      <div className="flex gap-1 mb-4 border-b border-[#e8e8e4]">
        {[{ key: 'all', label: 'Hamısı' }, ...STATUSES].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${filter === s.key ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#888] hover:text-[#555]'}`}>
            {s.label} <span className="ml-1 text-[10px] text-[#aaa]">{s.key === 'all' ? proposals.length : proposals.filter(p => p.status === s.key).length}</span>
          </button>
        ))}
      </div>

      {proposals.length === 0 ? (
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
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Ödəniş</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">ƏDV xaric</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">ƏDV (18%)</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">ƏDV daxil</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const st = STATUSES.find(s => s.key === p.status)
                  const isTransfer = p.payment_method === 'transfer'
                  return (
                    <tr key={p.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#0f172a]">{p.name}</div>
                        {p.sent_date && <div className="text-[10px] text-[#aaa]">{new Date(p.sent_date).toLocaleDateString('az-AZ')}</div>}
                      </td>
                      <td className="px-4 py-3 text-[#555]">{getClient(p.client_id)?.name || '—'}</td>
                      <td className="px-4 py-3"><Badge variant={st?.color} size="sm">{st?.label}</Badge></td>
                      <td className="px-4 py-3"><Badge variant={isTransfer ? 'info' : 'default'} size="sm">{isTransfer ? 'Köçürmə' : 'Nağd'}</Badge></td>
                      <td className="px-4 py-3 text-right font-medium text-[#0f172a]">{fmt(p.amount)}</td>
                      <td className="px-4 py-3 text-right text-amber-600">{isTransfer ? fmt(p.edv_amount || edv(p.amount)) : '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">{fmt(p.amount_with_edv || p.amount)}</td>
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
              <tfoot>
                <tr className="bg-[#f5f5f0]">
                  <td colSpan={4} className="px-4 py-2 font-medium text-[#555]">Cəmi ({filtered.length})</td>
                  <td className="px-4 py-2 text-right font-bold text-[#0f172a]">{fmt(filtered.reduce((s, p) => s + Number(p.amount || 0), 0))}</td>
                  <td className="px-4 py-2 text-right font-bold text-amber-600">{fmt(filtered.reduce((s, p) => s + Number(p.edv_amount || 0), 0))}</td>
                  <td className="px-4 py-2 text-right font-bold text-green-600">{fmt(filtered.reduce((s, p) => s + Number(p.amount_with_edv || p.amount || 0), 0))}</td>
                  <td />
                </tr>
              </tfoot>
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
