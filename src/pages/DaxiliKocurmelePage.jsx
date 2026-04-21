import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconArrowsExchange, IconCheck } from '@tabler/icons-react'

const EDV = 0.18
function fmt(n) { return '₼' + Number(n || 0).toLocaleString() }
function edv(n) { return Math.round(Number(n || 0) * EDV) }
function withEdv(n) { return Math.round(Number(n || 0) * (1 + EDV)) }

const STATUSES = [
  { key: 'open', label: 'Açıq', color: 'warning' },
  { key: 'returned', label: 'Qaytarıldı', color: 'success' },
  { key: 'problematic', label: 'Problemli', color: 'danger' },
]

function TransferForm({ open, onClose, onSave, transfer, projects }) {
  const [form, setForm] = useState({ from_project_id: '', to_project_id: '', amount: '', payment_method: 'transfer', transfer_date: new Date().toISOString().split('T')[0], reason: '', return_deadline: '', status: 'open', notes: '' })

  useEffect(() => {
    if (transfer) {
      setForm({ from_project_id: transfer.from_project_id || '', to_project_id: transfer.to_project_id || '', amount: transfer.amount || '', payment_method: transfer.payment_method || 'transfer', transfer_date: transfer.transfer_date || '', reason: transfer.reason || '', return_deadline: transfer.return_deadline || '', status: transfer.status || 'open', notes: transfer.notes || '' })
    } else {
      setForm({ from_project_id: '', to_project_id: '', amount: '', payment_method: 'transfer', transfer_date: new Date().toISOString().split('T')[0], reason: '', return_deadline: '', status: 'open', notes: '' })
    }
  }, [transfer, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleDateChange(date) {
    set('transfer_date', date)
    if (date && !transfer) {
      const d = new Date(date)
      d.setDate(d.getDate() + 60)
      set('return_deadline', d.toISOString().split('T')[0])
    }
  }

  const amt = Number(form.amount) || 0
  const isTransfer = form.payment_method === 'transfer'

  return (
    <Modal open={open} onClose={onClose} title={transfer ? 'Köçürməni redaktə et' : 'Yeni daxili köçürmə'}>
      <div className="space-y-3">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-800">
          ⚠️ Daxili köçürməni 60 gün ərzində geri qaytarmaq məcburidir
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Haradan *</label>
            <select value={form.from_project_id} onChange={e => set('from_project_id', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="">Seçin</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Haraya *</label>
            <select value={form.to_project_id} onChange={e => set('to_project_id', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="">Seçin</option>
              {projects.filter(p => p.id !== form.from_project_id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Məbləğ (₼, ƏDV xaric) *</label>
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
            <label className="block text-xs font-medium text-[#555] mb-1">Köçürmə tarixi</label>
            <input type="date" value={form.transfer_date} onChange={e => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Qaytarma son tarixi (60 gün)</label>
            <input type="date" value={form.return_deadline} onChange={e => set('return_deadline', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Səbəb</label>
            <input value={form.reason} onChange={e => set('reason', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="Köçürmənin səbəbi" />
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

        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto">{transfer ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function DaxiliKocurmelePage() {
  const { addToast } = useToast()
  const [transfers, setTransfers] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTransfer, setEditTransfer] = useState(null)
  const [deleteTransfer, setDeleteTransfer] = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [tRes, pRes] = await Promise.all([
      supabase.from('internal_transfers').select('*').order('transfer_date', { ascending: false }),
      supabase.from('projects').select('id, name').order('name'),
    ])
    setTransfers(tRes.data || [])
    setProjects(pRes.data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.from_project_id || !form.to_project_id || !form.amount) { addToast('Layihə və məbləğ daxil edin', 'error'); return }
    const amt = Number(form.amount)
    const isTransfer = form.payment_method === 'transfer'
    const data = {
      from_project_id: form.from_project_id, to_project_id: form.to_project_id,
      amount: amt, payment_method: form.payment_method,
      edv_amount: isTransfer ? edv(amt) : 0,
      amount_with_edv: isTransfer ? withEdv(amt) : amt,
      transfer_date: form.transfer_date || null, reason: form.reason || null,
      return_deadline: form.return_deadline || null, status: form.status,
      notes: form.notes || null, returned: form.status === 'returned'
    }
    if (editTransfer) {
      const { error } = await supabase.from('internal_transfers').update(data).eq('id', editTransfer.id)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Yeniləndi', 'success')
    } else {
      const { error } = await supabase.from('internal_transfers').insert(data)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Köçürmə əlavə edildi', 'success')
    }
    setModalOpen(false); setEditTransfer(null); await loadData()
  }

  async function markReturned(t) {
    await supabase.from('internal_transfers').update({ status: 'returned', returned: true }).eq('id', t.id)
    addToast('Qaytarıldı', 'success')
    await loadData()
  }

  async function handleDelete() {
    await supabase.from('internal_transfers').delete().eq('id', deleteTransfer.id)
    addToast('Silindi', 'success')
    setDeleteTransfer(null); await loadData()
  }

  const getProject = id => projects.find(p => p.id === id)
  const open = transfers.filter(t => t.status === 'open')
  const totalOpen = open.reduce((s, t) => s + Number(t.amount || 0), 0)
  const totalOpenWithEdv = open.reduce((s, t) => s + Number(t.amount_with_edv || t.amount || 0), 0)
  const today = new Date()

  if (loading) return <div className="p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 fade-in">
      <PageHeader title="Daxili Köçürmələr" subtitle="60 gün qaytarma qaydası"
        action={<Button onClick={() => { setEditTransfer(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni köçürmə</Button>} />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard label="Açıq köçürmələr" value={open.length} variant={open.length > 0 ? 'warning' : 'default'} />
        <StatCard label="Açıq (ƏDV xaric)" value={fmt(totalOpen)} variant={totalOpen > 0 ? 'danger' : 'default'} />
        <StatCard label="Açıq (ƏDV daxil)" value={fmt(totalOpenWithEdv)} />
        <StatCard label="Tamamlananlar" value={transfers.filter(t => t.status === 'returned').length} variant="success" />
      </div>

      {transfers.length === 0 ? (
        <EmptyState icon={IconArrowsExchange} title="Hələ daxili köçürmə yoxdur"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Əlavə et</Button>} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e8e8e4]">
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Haradan → Haraya</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Səbəb</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Tarix</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Ödəniş</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">ƏDV xaric</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">ƏDV (18%)</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">ƏDV daxil</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {transfers.map(t => {
                  const daysLeft = t.return_deadline ? Math.floor((new Date(t.return_deadline) - today) / 86400000) : null
                  const st = STATUSES.find(s => s.key === t.status)
                  const isTransfer = t.payment_method === 'transfer'
                  const isUrgent = t.status === 'open' && daysLeft !== null && daysLeft <= 7
                  const isOverdue = t.status === 'open' && daysLeft !== null && daysLeft < 0
                  return (
                    <tr key={t.id} className={`border-b border-[#f5f5f0] hover:bg-[#fafaf8] ${isOverdue ? 'bg-red-50/30' : isUrgent ? 'bg-yellow-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#0f172a]">{getProject(t.from_project_id)?.name || '—'}</div>
                        <div className="text-[10px] text-[#aaa]">→ {getProject(t.to_project_id)?.name || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-[#555]">{t.reason || '—'}</td>
                      <td className="px-4 py-3 text-[#555]">
                        {t.transfer_date ? new Date(t.transfer_date).toLocaleDateString('az-AZ') : '—'}
                        {t.return_deadline && <div className={`text-[10px] ${isOverdue ? 'text-red-500' : isUrgent ? 'text-yellow-600' : 'text-[#aaa]'}`}>
                          Son: {new Date(t.return_deadline).toLocaleDateString('az-AZ')}
                        </div>}
                      </td>
                      <td className="px-4 py-3"><Badge variant={st?.color} size="sm">{st?.label}</Badge></td>
                      <td className="px-4 py-3"><Badge variant={isTransfer ? 'info' : 'default'} size="sm">{isTransfer ? 'Köçürmə' : 'Nağd'}</Badge></td>
                      <td className="px-4 py-3 text-right font-medium text-[#0f172a]">{fmt(t.amount)}</td>
                      <td className="px-4 py-3 text-right text-amber-600">{isTransfer ? fmt(t.edv_amount || edv(t.amount)) : '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#0f172a]">{fmt(t.amount_with_edv || t.amount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {t.status === 'open' && <button onClick={() => markReturned(t)} className="text-[#aaa] hover:text-green-600 p-1" title="Qaytarıldı"><IconCheck size={12} /></button>}
                          <button onClick={() => { setEditTransfer(t); setModalOpen(true) }} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={12} /></button>
                          <button onClick={() => setDeleteTransfer(t)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#f5f5f0]">
                  <td colSpan={5} className="px-4 py-2 font-medium text-[#555]">Açıq cəmi</td>
                  <td className="px-4 py-2 text-right font-bold text-[#0f172a]">{fmt(totalOpen)}</td>
                  <td className="px-4 py-2 text-right font-bold text-amber-600">{fmt(open.reduce((s, t) => s + Number(t.edv_amount || 0), 0))}</td>
                  <td className="px-4 py-2 text-right font-bold text-[#0f172a]">{fmt(totalOpenWithEdv)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      <TransferForm open={modalOpen} onClose={() => { setModalOpen(false); setEditTransfer(null) }}
        onSave={handleSave} transfer={editTransfer} projects={projects} />
      <ConfirmDialog open={!!deleteTransfer} title="Köçürməni sil"
        message="Bu köçürməni silmək istədiyinizə əminsiniz?"
        onConfirm={handleDelete} onCancel={() => setDeleteTransfer(null)} danger />
    </div>
  )
}
