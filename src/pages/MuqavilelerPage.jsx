import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconContract } from '@tabler/icons-react'

const EDV = 0.18
function fmt(n) { return '₼' + Number(n || 0).toLocaleString() }
function edv(n) { return Math.round(Number(n || 0) * EDV) }
function withEdv(n) { return Math.round(Number(n || 0) * (1 + EDV)) }

const STATUSES = [
  { key: 'draft', label: 'Qaralama', color: 'default' },
  { key: 'active', label: 'Aktiv', color: 'success' },
  { key: 'completed', label: 'Tamamlandı', color: 'info' },
  { key: 'terminated', label: 'Ləğv edildi', color: 'danger' },
]

function ContractForm({ open, onClose, onSave, contract, clients, projects }) {
  const [form, setForm] = useState({ name: '', contract_number: '', client_id: '', project_id: '', amount: '', payment_method: 'transfer', sign_date: '', end_date: '', status: 'draft', notes: '' })

  useEffect(() => {
    if (contract) {
      setForm({ name: contract.name || '', contract_number: contract.contract_number || '', client_id: contract.client_id || '', project_id: contract.project_id || '', amount: contract.amount || '', payment_method: contract.payment_method || 'transfer', sign_date: contract.sign_date || '', end_date: contract.end_date || '', status: contract.status || 'draft', notes: contract.notes || '' })
    } else {
      setForm({ name: '', contract_number: '', client_id: '', project_id: '', amount: '', payment_method: 'transfer', sign_date: '', end_date: '', status: 'draft', notes: '' })
    }
  }, [contract, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  const amt = Number(form.amount) || 0
  const isTransfer = form.payment_method === 'transfer'

  return (
    <Modal open={open} onClose={onClose} title={contract ? 'Müqaviləni redaktə et' : 'Yeni müqavilə'}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Müqavilə adı *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="Müqavilənin adı" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Müqavilə nömrəsi</label>
            <input value={form.contract_number} onChange={e => set('contract_number', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="MÜQ-2026-001" />
          </div>
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
            <label className="block text-xs font-medium text-[#555] mb-1">İmzalanma tarixi</label>
            <input type="date" value={form.sign_date} onChange={e => set('sign_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Bitmə tarixi</label>
            <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
        </div>

        {/* ƏDV hesablama */}
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
          <Button onClick={() => onSave(form)} className="ml-auto">{contract ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function MuqavilelerPage() {
  const { addToast } = useToast()
  const [contracts, setContracts] = useState([])
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editContract, setEditContract] = useState(null)
  const [deleteContract, setDeleteContract] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [cRes, clRes, prRes] = await Promise.all([
      supabase.from('contracts').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name'),
      supabase.from('projects').select('id, name'),
    ])
    setContracts(cRes.data || [])
    setClients(clRes.data || [])
    setProjects(prRes.data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.name.trim()) { addToast('Ad daxil edin', 'error'); return }
    const amt = Number(form.amount) || 0
    const isTransfer = form.payment_method === 'transfer'
    const data = {
      name: form.name.trim(), contract_number: form.contract_number || null,
      client_id: form.client_id || null, project_id: form.project_id || null,
      amount: amt, payment_method: form.payment_method,
      edv_amount: isTransfer ? edv(amt) : 0,
      amount_with_edv: isTransfer ? withEdv(amt) : amt,
      sign_date: form.sign_date || null, end_date: form.end_date || null,
      status: form.status, notes: form.notes || null
    }
    if (editContract) {
      const { error } = await supabase.from('contracts').update(data).eq('id', editContract.id)
      if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin', 'error'); return }
      addToast('Yeniləndi', 'success')
    } else {
      const { error } = await supabase.from('contracts').insert(data)
      if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin', 'error'); return }
      addToast('Müqavilə əlavə edildi', 'success')
    }
    setModalOpen(false); setEditContract(null); await loadData()
  }

  async function handleDelete() {
    await supabase.from('contracts').delete().eq('id', deleteContract.id)
    addToast('Silindi', 'success')
    setDeleteContract(null); await loadData()
  }

  const getClient = id => clients.find(c => c.id === id)
  const getProject = id => projects.find(p => p.id === id)
  const filtered = filter === 'all' ? contracts : contracts.filter(c => c.status === filter)
  const totalActive = contracts.filter(c => c.status === 'active').reduce((s, c) => s + Number(c.amount || 0), 0)
  const totalActiveWithEdv = contracts.filter(c => c.status === 'active').reduce((s, c) => s + Number(c.amount_with_edv || c.amount || 0), 0)

  if (loading) return <div className="p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 fade-in">
      <PageHeader title="Müqavilələr" subtitle={`${contracts.length} müqavilə`}
        action={<Button onClick={() => { setEditContract(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni müqavilə</Button>} />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard label="Ümumi" value={contracts.length} />
        <StatCard label="Aktiv" value={contracts.filter(c => c.status === 'active').length} variant="success" />
        <StatCard label="Aktiv (ƏDV xaric)" value={fmt(totalActive)} variant="success" />
        <StatCard label="Aktiv (ƏDV daxil)" value={fmt(totalActiveWithEdv)} />
      </div>

      <div className="flex gap-1 mb-4 border-b border-[#e8e8e4]">
        {[{ key: 'all', label: 'Hamısı' }, ...STATUSES].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${filter === s.key ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#888] hover:text-[#555]'}`}>
            {s.label} <span className="ml-1 text-[10px] text-[#aaa]">{s.key === 'all' ? contracts.length : contracts.filter(c => c.status === s.key).length}</span>
          </button>
        ))}
      </div>

      {contracts.length === 0 ? (
        <EmptyState icon={IconContract} title="Hələ müqavilə yoxdur"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Əlavə et</Button>} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e8e8e4]">
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Müqavilə</th>
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
                {filtered.map(c => {
                  const st = STATUSES.find(s => s.key === c.status)
                  const isTransfer = c.payment_method === 'transfer'
                  return (
                    <tr key={c.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#0f172a]">{c.name}</div>
                        {c.contract_number && <div className="text-[10px] text-[#aaa]">{c.contract_number}</div>}
                      </td>
                      <td className="px-4 py-3 text-[#555]">{getClient(c.client_id)?.name || '—'}</td>
                      <td className="px-4 py-3"><Badge variant={st?.color} size="sm">{st?.label}</Badge></td>
                      <td className="px-4 py-3"><Badge variant={isTransfer ? 'info' : 'default'} size="sm">{isTransfer ? 'Köçürmə' : 'Nağd'}</Badge></td>
                      <td className="px-4 py-3 text-right font-medium text-[#0f172a]">{fmt(c.amount)}</td>
                      <td className="px-4 py-3 text-right text-amber-600">{isTransfer ? fmt(c.edv_amount || edv(c.amount)) : '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">{fmt(c.amount_with_edv || c.amount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditContract(c); setModalOpen(true) }} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={12} /></button>
                          <button onClick={() => setDeleteContract(c)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#f5f5f0]">
                  <td colSpan={4} className="px-4 py-2 font-medium text-[#555]">Cəmi ({filtered.length})</td>
                  <td className="px-4 py-2 text-right font-bold text-[#0f172a]">{fmt(filtered.reduce((s, c) => s + Number(c.amount || 0), 0))}</td>
                  <td className="px-4 py-2 text-right font-bold text-amber-600">{fmt(filtered.reduce((s, c) => s + Number(c.edv_amount || 0), 0))}</td>
                  <td className="px-4 py-2 text-right font-bold text-green-600">{fmt(filtered.reduce((s, c) => s + Number(c.amount_with_edv || c.amount || 0), 0))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      <ContractForm open={modalOpen} onClose={() => { setModalOpen(false); setEditContract(null) }}
        onSave={handleSave} contract={editContract} clients={clients} projects={projects} />
      <ConfirmDialog open={!!deleteContract} title="Müqaviləni sil"
        message={`"${deleteContract?.name}" silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteContract(null)} danger />
    </div>
  )
}
