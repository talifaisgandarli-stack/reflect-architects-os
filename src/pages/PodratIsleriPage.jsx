import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconHeartHandshake } from '@tabler/icons-react'

const EDV = 0.18
function fmt(n) { return '₼' + Number(n || 0).toLocaleString() }
function edv(n) { return Math.round(Number(n || 0) * EDV) }
function withEdv(n) { return Math.round(Number(n || 0) * (1 + EDV)) }

const PAYMENT_STATUSES = [
  { key: 'not_started', label: 'Başlanmayıb', color: 'default' },
  { key: '30_paid', label: '30% Ödənilib', color: 'info' },
  { key: 'interim_paid', label: 'Aralıq ödənilib', color: 'warning' },
  { key: 'hold_10', label: '10% Saxlanılır', color: 'warning' },
  { key: 'fully_closed', label: 'Tam bağlandı', color: 'success' },
]

const WORK_STATUSES = [
  { key: 'not_started', label: 'Başlanmayıb', color: 'default' },
  { key: 'in_progress', label: 'İcrada', color: 'info' },
  { key: 'completed', label: 'Tamamlandı', color: 'success' },
  { key: 'overdue', label: 'Gecikmiş', color: 'danger' },
]

function EdvPreview({ amount, isTransfer }) {
  const amt = Number(amount) || 0
  if (!amt) return null
  return (
    <div className={`rounded-lg p-2.5 text-xs mt-1 ${isTransfer ? 'bg-amber-50 border border-amber-200' : 'bg-[#f5f5f0]'}`}>
      {isTransfer ? (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><div className="text-[#888] mb-0.5">ƏDV xaric</div><div className="font-bold text-[#0f172a]">{fmt(amt)}</div></div>
          <div><div className="text-[#888] mb-0.5">ƏDV (18%)</div><div className="font-bold text-amber-600">{fmt(edv(amt))}</div></div>
          <div><div className="text-[#888] mb-0.5">ƏDV daxil</div><div className="font-bold text-green-600">{fmt(withEdv(amt))}</div></div>
        </div>
      ) : (
        <div className="text-center text-[#555]">Nağd — ƏDV yoxdur · Cəmi: <span className="font-bold">{fmt(amt)}</span></div>
      )}
    </div>
  )
}

function PodratForm({ open, onClose, onSave, work, projects }) {
  const [form, setForm] = useState({
    name: '', outsource_type: 'company', project_id: '', work_type: '',
    contract_amount: '', payment_method: 'transfer',
    payment_status: 'not_started', work_status: 'not_started',
    paid_30_percent: false, paid_30_date: '', paid_30_method: 'transfer',
    interim_payments: [],
    paid_final_10: false, paid_final_10_date: '', paid_final_10_method: 'transfer',
    client_approval_date: '', planned_deadline: '', followup_date: '',
    contract_number: '', notes: ''
  })

  useEffect(() => {
    if (work) {
      setForm({
        name: work.name || '', outsource_type: work.outsource_type || 'company',
        project_id: work.project_id || '', work_type: work.work_type || '',
        contract_amount: work.contract_amount || '', payment_method: work.payment_method || 'transfer',
        payment_status: work.payment_status || 'not_started', work_status: work.work_status || 'not_started',
        paid_30_percent: work.paid_30_percent || false, paid_30_date: work.paid_30_date || '',
        paid_30_method: work.paid_30_method || 'transfer',
        interim_payments: work.interim_payments || [],
        paid_final_10: work.paid_final_10 || false, paid_final_10_date: work.paid_final_10_date || '',
        paid_final_10_method: work.paid_final_10_method || 'transfer',
        client_approval_date: work.client_approval_date || '',
        planned_deadline: work.planned_deadline || '', followup_date: work.followup_date || '',
        contract_number: work.contract_number || '', notes: work.notes || ''
      })
    } else {
      setForm({ name: '', outsource_type: 'company', project_id: '', work_type: '', contract_amount: '', payment_method: 'transfer', payment_status: 'not_started', work_status: 'not_started', paid_30_percent: false, paid_30_date: '', paid_30_method: 'transfer', interim_payments: [], paid_final_10: false, paid_final_10_date: '', paid_final_10_method: 'transfer', client_approval_date: '', planned_deadline: '', followup_date: '', contract_number: '', notes: '' })
    }
  }, [work, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function addInterim() {
    setForm(f => ({ ...f, interim_payments: [...f.interim_payments, { amount: '', date: '', method: 'transfer' }] }))
  }
  function removeInterim(i) {
    setForm(f => ({ ...f, interim_payments: f.interim_payments.filter((_, idx) => idx !== i) }))
  }
  function setInterim(i, k, v) {
    setForm(f => {
      const arr = [...f.interim_payments]
      arr[i] = { ...arr[i], [k]: v }
      return { ...f, interim_payments: arr }
    })
  }

  const amt30 = form.paid_30_percent ? Math.round(Number(form.contract_amount || 0) * 0.3) : 0
  const amt10 = form.paid_final_10 ? Math.round(Number(form.contract_amount || 0) * 0.1) : 0

  return (
    <Modal open={open} onClose={onClose} title={work ? 'Podrat işini redaktə et' : 'Yeni podrat işi'} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[#555] mb-1">Podratçı adı *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="Şirkət və ya şəxs adı" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Növ</label>
            <select value={form.outsource_type} onChange={e => set('outsource_type', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="company">Şirkət</option>
              <option value="individual">Fərdi</option>
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
            <label className="block text-xs font-medium text-[#555] mb-1">İş növü</label>
            <input value={form.work_type} onChange={e => set('work_type', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="Konstruksiya, MEP..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Müqavilə məbləği (₼, ƏDV xaric)</label>
            <input type="number" value={form.contract_amount} onChange={e => set('contract_amount', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Əsas ödəniş üsulu</label>
            <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="transfer">Köçürmə</option>
              <option value="cash">Nağd</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Müqavilə nömrəsi</label>
            <input value={form.contract_number} onChange={e => set('contract_number', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="№..." />
          </div>
        </div>

        {/* ƏDV preview — müqavilə məbləği */}
        {Number(form.contract_amount) > 0 && (
          <EdvPreview amount={form.contract_amount} isTransfer={form.payment_method === 'transfer'} />
        )}

        {/* Ödəniş mərhələləri */}
        <div className="border-t border-[#f0f0ec] pt-3">
          <div className="text-xs font-bold text-[#0f172a] mb-3">Ödəniş mərhələləri</div>

          {/* 30% */}
          <div className="bg-[#fafaf8] border border-[#e8e8e4] rounded-lg p-3 mb-2">
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={form.paid_30_percent} onChange={e => set('paid_30_percent', e.target.checked)}
                className="w-4 h-4 accent-[#0f172a]" />
              <span className="text-xs font-medium text-[#0f172a]">30% Avans ödənilib</span>
              {amt30 > 0 && <span className="text-xs text-[#888] ml-auto">{fmt(amt30)}</span>}
            </div>
            {form.paid_30_percent && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input type="date" value={form.paid_30_date} onChange={e => set('paid_30_date', e.target.value)}
                  className="w-full px-2 py-1.5 border border-[#e8e8e4] rounded text-xs focus:outline-none focus:border-[#0f172a]" />
                <select value={form.paid_30_method} onChange={e => set('paid_30_method', e.target.value)}
                  className="w-full px-2 py-1.5 border border-[#e8e8e4] rounded text-xs focus:outline-none focus:border-[#0f172a]">
                  <option value="transfer">Köçürmə</option>
                  <option value="cash">Nağd</option>
                </select>
                <div className="col-span-2">
                  <EdvPreview amount={amt30} isTransfer={form.paid_30_method === 'transfer'} />
                </div>
              </div>
            )}
          </div>

          {/* Aralıq ödənişlər */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#0f172a]">Aralıq ödənişlər</span>
              <button onClick={addInterim}
                className="text-xs text-blue-500 hover:text-blue-700 font-medium">+ Əlavə et</button>
            </div>
            {form.interim_payments.map((ip, i) => (
              <div key={i} className="bg-[#fafaf8] border border-[#e8e8e4] rounded-lg p-3 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#555]">Aralıq ödəniş {i + 1}</span>
                  <button onClick={() => removeInterim(i)} className="text-[#aaa] hover:text-red-500 text-xs">Sil</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Məbləğ (₼)" value={ip.amount} onChange={e => setInterim(i, 'amount', e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#e8e8e4] rounded text-xs focus:outline-none focus:border-[#0f172a]" />
                  <select value={ip.method} onChange={e => setInterim(i, 'method', e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#e8e8e4] rounded text-xs focus:outline-none focus:border-[#0f172a]">
                    <option value="transfer">Köçürmə</option>
                    <option value="cash">Nağd</option>
                  </select>
                  <input type="date" value={ip.date} onChange={e => setInterim(i, 'date', e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#e8e8e4] rounded text-xs focus:outline-none focus:border-[#0f172a]" />
                  <div />
                  {Number(ip.amount) > 0 && (
                    <div className="col-span-2">
                      <EdvPreview amount={ip.amount} isTransfer={ip.method === 'transfer'} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Final 10% */}
          <div className="bg-[#fafaf8] border border-[#e8e8e4] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={form.paid_final_10} onChange={e => set('paid_final_10', e.target.checked)}
                className="w-4 h-4 accent-[#0f172a]" />
              <span className="text-xs font-medium text-[#0f172a]">Final 10% ödənilib (sifarişçi təsdiqindən sonra)</span>
              {amt10 > 0 && <span className="text-xs text-[#888] ml-auto">{fmt(amt10)}</span>}
            </div>
            {form.paid_final_10 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input type="date" value={form.paid_final_10_date} onChange={e => set('paid_final_10_date', e.target.value)}
                  className="w-full px-2 py-1.5 border border-[#e8e8e4] rounded text-xs focus:outline-none focus:border-[#0f172a]" />
                <select value={form.paid_final_10_method} onChange={e => set('paid_final_10_method', e.target.value)}
                  className="w-full px-2 py-1.5 border border-[#e8e8e4] rounded text-xs focus:outline-none focus:border-[#0f172a]">
                  <option value="transfer">Köçürmə</option>
                  <option value="cash">Nağd</option>
                </select>
                <div className="col-span-2">
                  <EdvPreview amount={amt10} isTransfer={form.paid_final_10_method === 'transfer'} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-[#f0f0ec] pt-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Ödəniş statusu</label>
            <select value={form.payment_status} onChange={e => set('payment_status', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {PAYMENT_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">İş statusu</label>
            <select value={form.work_status} onChange={e => set('work_status', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {WORK_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Deadline</label>
            <input type="date" value={form.planned_deadline} onChange={e => set('planned_deadline', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Sifarişçi təsdiq tarixi</label>
            <input type="date" value={form.client_approval_date} onChange={e => set('client_approval_date', e.target.value)}
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
          <Button onClick={() => onSave(form)} className="ml-auto">{work ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function PodratIsleriPage() {
  const { addToast } = useToast()
  const [works, setWorks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editWork, setEditWork] = useState(null)
  const [deleteWork, setDeleteWork] = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [wRes, pRes] = await Promise.all([
      supabase.from('outsource_works').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name'),
    ])
    setWorks(wRes.data || [])
    setProjects(pRes.data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.name.trim()) { addToast('Ad daxil edin', 'error'); return }
    const amt = Number(form.contract_amount) || 0
    const isTransfer = form.payment_method === 'transfer'

    // Ödənilmiş cəmi hesabla
    const paid30 = form.paid_30_percent ? Math.round(amt * 0.3) : 0
    const paidInterim = form.interim_payments.reduce((s, ip) => s + (Number(ip.amount) || 0), 0)
    const paid10 = form.paid_final_10 ? Math.round(amt * 0.1) : 0
    const totalPaid = paid30 + paidInterim + paid10

    const data = {
      name: form.name.trim(), outsource_type: form.outsource_type,
      project_id: form.project_id || null, work_type: form.work_type || null,
      contract_amount: amt, payment_method: form.payment_method,
      edv_amount: isTransfer ? edv(amt) : 0,
      amount_with_edv: isTransfer ? withEdv(amt) : amt,
      payment_status: form.payment_status, work_status: form.work_status,
      paid_30_percent: form.paid_30_percent, paid_30_date: form.paid_30_date || null,
      paid_30_method: form.paid_30_method,
      interim_payments: form.interim_payments,
      interim_payment: paidInterim,
      paid_final_10: form.paid_final_10, paid_final_10_date: form.paid_final_10_date || null,
      paid_final_10_method: form.paid_final_10_method,
      client_approval_date: form.client_approval_date || null,
      planned_deadline: form.planned_deadline || null,
      followup_date: form.followup_date || null,
      contract_number: form.contract_number || null,
      notes: form.notes || null,
      total_paid: totalPaid,
      remaining: amt - totalPaid
    }
    if (editWork) {
      const { error } = await supabase.from('outsource_works').update(data).eq('id', editWork.id)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Yeniləndi', 'success')
    } else {
      const { error } = await supabase.from('outsource_works').insert(data)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Podrat işi əlavə edildi', 'success')
    }
    setModalOpen(false); setEditWork(null); await loadData()
  }

  async function handleDelete() {
    await supabase.from('outsource_works').delete().eq('id', deleteWork.id)
    addToast('Silindi', 'success')
    setDeleteWork(null); await loadData()
  }

  const getProject = id => projects.find(p => p.id === id)
  const totalContract = works.reduce((s, w) => s + Number(w.contract_amount || 0), 0)
  const totalWithEdv = works.reduce((s, w) => s + Number(w.amount_with_edv || w.contract_amount || 0), 0)
  const totalEdvAmt = works.filter(w => w.payment_method === 'transfer').reduce((s, w) => s + Number(w.edv_amount || 0), 0)

  if (loading) return <div className="p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 fade-in">
      <PageHeader
        title="Podrat İşləri"
        subtitle={`${works.length} podrat · 30%/Aralıq/10% sistemi`}
        action={<Button onClick={() => { setEditWork(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni podrat</Button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard label="Müqavilə (ƏDV xaric)" value={fmt(totalContract)} />
        <StatCard label="ƏDV məbləği" value={fmt(totalEdvAmt)} />
        <StatCard label="Müqavilə (ƏDV daxil)" value={fmt(totalWithEdv)} />
        <StatCard label="Aktiv podratlar" value={works.filter(w => w.work_status === 'in_progress').length} />
      </div>

      {works.length === 0 ? (
        <EmptyState icon={IconHeartHandshake} title="Hələ podrat işi yoxdur"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Əlavə et</Button>} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e8e8e4]">
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Podratçı</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Layihə</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">İş statusu</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Ödəniş</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Mərhələlər</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">ƏDV xaric</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">ƏDV (18%)</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">ƏDV daxil</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">Qalıq</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {works.map(w => {
                  const days = w.planned_deadline ? Math.floor((new Date(w.planned_deadline) - new Date()) / 86400000) : null
                  const ws = WORK_STATUSES.find(s => s.key === w.work_status)
                  const ps = PAYMENT_STATUSES.find(s => s.key === w.payment_status)
                  const isTransfer = w.payment_method === 'transfer'
                  const interimCount = (w.interim_payments || []).length
                  return (
                    <tr key={w.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#0f172a]">{w.name}</div>
                        {w.work_type && <div className="text-[10px] text-[#aaa]">{w.work_type}</div>}
                        {w.planned_deadline && (
                          <div className={`text-[10px] ${days < 0 ? 'text-red-500' : days <= 7 ? 'text-yellow-600' : 'text-[#aaa]'}`}>
                            {new Date(w.planned_deadline).toLocaleDateString('az-AZ')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#555]">{getProject(w.project_id)?.name || '—'}</td>
                      <td className="px-4 py-3"><Badge variant={ws?.color} size="sm">{ws?.label}</Badge></td>
                      <td className="px-4 py-3">
                        <Badge variant={ps?.color} size="sm">{ps?.label}</Badge>
                        <div className="mt-1"><Badge variant={isTransfer ? 'info' : 'default'} size="sm">{isTransfer ? 'Köçürmə' : 'Nağd'}</Badge></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${w.paid_30_percent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>30%</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${interimCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            {interimCount > 0 ? `Ara×${interimCount}` : 'Ara'}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${w.paid_final_10 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>10%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[#0f172a]">{fmt(w.contract_amount)}</td>
                      <td className="px-4 py-3 text-right text-amber-600">{isTransfer ? fmt(w.edv_amount || edv(w.contract_amount)) : '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#0f172a]">{fmt(w.amount_with_edv || w.contract_amount)}</td>
                      <td className="px-4 py-3 text-right">
                        {Number(w.remaining) > 0
                          ? <span className="font-bold text-red-500">{fmt(w.remaining)}</span>
                          : <span className="text-green-600 font-bold">Bağlandı</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditWork(w); setModalOpen(true) }} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={12} /></button>
                          <button onClick={() => setDeleteWork(w)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#f5f5f0]">
                  <td colSpan={5} className="px-4 py-2 font-medium text-[#555]">Cəmi</td>
                  <td className="px-4 py-2 text-right font-bold text-[#0f172a]">{fmt(totalContract)}</td>
                  <td className="px-4 py-2 text-right font-bold text-amber-600">{fmt(totalEdvAmt)}</td>
                  <td className="px-4 py-2 text-right font-bold text-[#0f172a]">{fmt(totalWithEdv)}</td>
                  <td className="px-4 py-2 text-right font-bold text-red-500">{fmt(works.reduce((s, w) => s + Number(w.remaining || 0), 0))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      <PodratForm open={modalOpen} onClose={() => { setModalOpen(false); setEditWork(null) }}
        onSave={handleSave} work={editWork} projects={projects} />
      <ConfirmDialog open={!!deleteWork} title="Podrat işini sil"
        message={`"${deleteWork?.name}" qeydini silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteWork(null)} danger />
    </div>
  )
}
