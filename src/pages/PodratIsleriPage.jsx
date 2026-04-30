import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconHeartHandshake } from '@tabler/icons-react'

const EDV = 0.18
function fmt(n) { return '₼' + Number(n || 0).toLocaleString() }
function edv(n) { return Math.round(Number(n || 0) * EDV) }
function withEdv(n) { return Math.round(Number(n || 0) * (1 + EDV)) }

const PAYMENT_STATUSES = [
  { key: 'not_started', label: 'Başlanmayıb', color: 'default' },
  { key: 'advance_paid', label: 'Avans ödənilib', color: 'info' },
  { key: 'interim_paid', label: 'Aralıq ödənilib', color: 'warning' },
  { key: 'fully_closed', label: 'Tam bağlandı', color: 'success' },
]

const WORK_STATUSES = [
  { key: 'not_started', label: 'Başlanmayıb', color: 'default' },
  { key: 'in_progress', label: 'İcrada', color: 'info' },
  { key: 'completed', label: 'Tamamlandı', color: 'success' },
  { key: 'overdue', label: 'Gecikmiş', color: 'danger' },
]

const MONTHS = ['Yan','Fev','Mar','Apr','May','İyn','İyl','Avq','Sen','Okt','Noy','Dek']

function EdvBox({ amount, method }) {
  const amt = Number(amount) || 0
  if (!amt) return null
  const isT = method === 'transfer'
  return (
    <div className={`rounded p-1.5 text-[10px] mt-1 ${isT ? 'bg-amber-50 border border-amber-100' : 'bg-[#f5f5f0]'}`}>
      {isT ? `ƏDV xaric: ${fmt(amt)} · ƏDV: ${fmt(edv(amt))} · Cəmi: ${fmt(withEdv(amt))}` : `Nağd · ${fmt(amt)}`}
    </div>
  )
}

function PodratForm({ open, onClose, onSave, work, projects }) {
  const empty = {
    name: '', outsource_type: 'company', project_id: '', work_type: '',
    contract_amount: '', payment_method: 'transfer',
    advance_percent: 30, advance_date: '', advance_paid: false, advance_method: 'transfer',
    interim_payments: [],
    final_paid: false, final_date: '', final_method: 'transfer',
    payment_status: 'not_started', work_status: 'not_started',
    client_approval_date: '', planned_deadline: '', contract_number: '', notes: ''
  }
  const [form, setForm] = useState(empty)

  useEffect(() => {
    if (work) {
      setForm({
        name: work.name || '', outsource_type: work.outsource_type || 'company',
        project_id: work.project_id || '', work_type: work.work_type || '',
        contract_amount: work.contract_amount || '', payment_method: work.payment_method || 'transfer',
        advance_percent: work.advance_percent || 30,
        advance_date: work.advance_date || '', advance_paid: work.advance_paid || false,
        advance_method: work.advance_method || 'transfer',
        interim_payments: Array.isArray(work.interim_payments) ? work.interim_payments : [],
        final_paid: work.final_paid || false, final_date: work.final_date || '',
        final_method: work.final_method || 'transfer',
        payment_status: work.payment_status || 'not_started',
        work_status: work.work_status || 'not_started',
        client_approval_date: work.client_approval_date || '',
        planned_deadline: work.planned_deadline || '',
        contract_number: work.contract_number || '', notes: work.notes || ''
      })
    } else setForm(empty)
  }, [work, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  const amt = Number(form.contract_amount) || 0
  const advanceAmt = Math.round(amt * (Number(form.advance_percent) || 30) / 100)
  const interimTotal = (form.interim_payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const remaining = amt - (form.advance_paid ? advanceAmt : 0) - interimTotal - (form.final_paid ? amt - advanceAmt - interimTotal : 0)

  function addInterim() {
    set('interim_payments', [...(form.interim_payments || []), { amount: '', method: 'transfer', date: '', note: '' }])
  }
  function setInterim(i, k, v) {
    const arr = [...form.interim_payments]
    arr[i] = { ...arr[i], [k]: v }
    set('interim_payments', arr)
  }
  function removeInterim(i) {
    set('interim_payments', form.interim_payments.filter((_, idx) => idx !== i))
  }

  return (
    <Modal open={open} onClose={onClose} title={work ? 'Podrat işini redaktə et' : 'Yeni podrat işi'} size="xl">
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[#555] mb-1">Podratçı adı *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="Şirkət və ya şəxs adı" />
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
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="Konstruksiya, MEP..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Müqavilə nömrəsi</label>
            <input value={form.contract_number} onChange={e => set('contract_number', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="№..." />
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
        </div>

        {/* ƏDV preview */}
        {amt > 0 && (
          <div className={`rounded-lg p-2.5 text-xs ${form.payment_method === 'transfer' ? 'bg-amber-50 border border-amber-200' : 'bg-[#f5f5f0]'}`}>
            {form.payment_method === 'transfer'
              ? <span>ƏDV xaric: <b>{fmt(amt)}</b> · ƏDV 18%: <b className="text-amber-600">{fmt(edv(amt))}</b> · ƏDV daxil: <b className="text-green-600">{fmt(withEdv(amt))}</b></span>
              : <span>Nağd ödəniş · Cəmi: <b>{fmt(amt)}</b></span>}
          </div>
        )}

        {/* Ödəniş mərhələləri */}
        <div className="border border-[#e8e8e4] rounded-lg p-3 space-y-3">
          <div className="text-xs font-bold text-[#0f172a]">Ödəniş mərhələləri</div>

          {/* Avans */}
          <div className="bg-[#fafaf8] rounded-lg p-2.5">
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={form.advance_paid} onChange={e => set('advance_paid', e.target.checked)} className="w-4 h-4 accent-[#0f172a]" />
              <span className="text-xs font-medium text-[#0f172a]">Avans ödənilib</span>
              <div className="flex items-center gap-1 ml-1">
                <input type="number" value={form.advance_percent} onChange={e => set('advance_percent', e.target.value)}
                  className="w-14 px-2 py-0.5 border border-[#e8e8e4] rounded text-xs" min="1" max="100" />
                <span className="text-xs text-[#888]">%</span>
              </div>
              {amt > 0 && <span className="text-xs text-[#888] ml-auto font-medium">{fmt(advanceAmt)}</span>}
            </div>
            {form.advance_paid && (
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={form.advance_date} onChange={e => set('advance_date', e.target.value)}
                  className="px-2 py-1.5 border border-[#e8e8e4] rounded text-xs" placeholder="Ödəniş tarixi" />
                <select value={form.advance_method} onChange={e => set('advance_method', e.target.value)}
                  className="px-2 py-1.5 border border-[#e8e8e4] rounded text-xs">
                  <option value="transfer">Köçürmə</option>
                  <option value="cash">Nağd</option>
                </select>
                <div className="col-span-2"><EdvBox amount={advanceAmt} method={form.advance_method} /></div>
              </div>
            )}
          </div>

          {/* Aralıq ödənişlər */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#555]">Aralıq ödənişlər</span>
              <button onClick={addInterim} className="text-xs text-blue-500 hover:text-blue-700 font-medium">+ Əlavə et</button>
            </div>
            {(form.interim_payments || []).map((ip, i) => (
              <div key={i} className="bg-[#fafaf8] rounded-lg p-2.5 mb-2">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-[#555]">Aralıq {i + 1}</span>
                  <button onClick={() => removeInterim(i)} className="text-[10px] text-red-400 hover:text-red-600">Sil</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Məbləğ (₼)" value={ip.amount}
                    onChange={e => setInterim(i, 'amount', e.target.value)}
                    className="px-2 py-1.5 border border-[#e8e8e4] rounded text-xs" />
                  <select value={ip.method || 'transfer'} onChange={e => setInterim(i, 'method', e.target.value)}
                    className="px-2 py-1.5 border border-[#e8e8e4] rounded text-xs">
                    <option value="transfer">Köçürmə</option>
                    <option value="cash">Nağd</option>
                  </select>
                  <input type="date" value={ip.date || ''} onChange={e => setInterim(i, 'date', e.target.value)}
                    className="px-2 py-1.5 border border-[#e8e8e4] rounded text-xs" placeholder="Ödəniş tarixi" />
                  <input placeholder="Qeyd" value={ip.note || ''} onChange={e => setInterim(i, 'note', e.target.value)}
                    className="px-2 py-1.5 border border-[#e8e8e4] rounded text-xs" />
                  {Number(ip.amount) > 0 && (
                    <div className="col-span-2"><EdvBox amount={ip.amount} method={ip.method || 'transfer'} /></div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Final ödəniş */}
          <div className="bg-[#fafaf8] rounded-lg p-2.5">
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={form.final_paid} onChange={e => set('final_paid', e.target.checked)} className="w-4 h-4 accent-[#0f172a]" />
              <span className="text-xs font-medium text-[#0f172a]">Final ödəniş ödənilib</span>
              {amt > 0 && form.final_paid && <span className="text-xs text-[#888] ml-auto font-medium">{fmt(Math.max(0, remaining + (form.final_paid ? Math.max(0, amt - advanceAmt - interimTotal) : 0)))}</span>}
            </div>
            {form.final_paid && (
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={form.final_date} onChange={e => set('final_date', e.target.value)}
                  className="px-2 py-1.5 border border-[#e8e8e4] rounded text-xs" placeholder="Ödəniş tarixi" />
                <select value={form.final_method} onChange={e => set('final_method', e.target.value)}
                  className="px-2 py-1.5 border border-[#e8e8e4] rounded text-xs">
                  <option value="transfer">Köçürmə</option>
                  <option value="cash">Nağd</option>
                </select>
              </div>
            )}
          </div>

          {/* Ödəniş statusu */}
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Ödəniş statusu</label>
            <select value={form.payment_status} onChange={e => set('payment_status', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {PAYMENT_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
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
  const { isAdmin } = useAuth()
  const [works, setWorks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editWork, setEditWork] = useState(null)
  const [deleteWork, setDeleteWork] = useState(null)

  // Filters
  const [filterYear, setFilterYear] = useState(0)
  const [filterMonth, setFilterMonth] = useState(0)
  const [filterProject, setFilterProject] = useState('')
  const [filterContractor, setFilterContractor] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [wRes, pRes] = await Promise.all([
      supabase.from('outsource_works').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name').order('name'),
    ])
    setWorks(wRes.data || [])
    setProjects(pRes.data || [])
    setLoading(false)
  }

  // Get all payment dates for a work (avans + aralıq + final)
  function getPaymentDatesForWork(w) {
    const dates = []
    if (w.advance_paid && w.advance_date) dates.push(w.advance_date)
    if (Array.isArray(w.interim_payments)) {
      w.interim_payments.forEach(p => { if (p.date) dates.push(p.date) })
    }
    if (w.final_paid && w.final_date) dates.push(w.final_date)
    return dates
  }

  // Calculate paid amount in selected period
  function getPaidInPeriod(w) {
    let total = 0
    const advAmt = Math.round(Number(w.contract_amount || 0) * (Number(w.advance_percent) || 30) / 100)
    const interimTotal = (w.interim_payments || []).reduce((s, p) => s + Number(p.amount || 0), 0)
    const finalAmt = Math.max(0, Number(w.contract_amount || 0) - advAmt - interimTotal)

    if (w.advance_paid && w.advance_date && matchesFilter(w.advance_date)) total += advAmt
    if (Array.isArray(w.interim_payments)) {
      w.interim_payments.forEach(p => { if (p.date && matchesFilter(p.date)) total += Number(p.amount || 0) })
    }
    if (w.final_paid && w.final_date && matchesFilter(w.final_date)) total += finalAmt
    return total
  }

  function matchesFilter(dateStr) {
    if (!filterYear && !filterMonth) return true
    if (!dateStr) return false
    const d = new Date(dateStr)
    if (filterYear && d.getFullYear() !== filterYear) return false
    if (filterMonth && d.getMonth() + 1 !== filterMonth) return false
    return true
  }

  // Filter works - show works that have at least one payment in the selected period
  // OR show all if no date filter
  const filteredWorks = works.filter(w => {
    if (filterProject && w.project_id !== filterProject) return false
    if (filterContractor && !w.name.toLowerCase().includes(filterContractor.toLowerCase())) return false
    if (filterYear || filterMonth) {
      const dates = getPaymentDatesForWork(w)
      if (dates.length === 0) return false
      return dates.some(d => matchesFilter(d))
    }
    return true
  })

  async function handleSave(form) {
    if (!form.name.trim()) { addToast('Ad daxil edin', 'error'); return }
    const amt = Number(form.contract_amount) || 0
    const isT = form.payment_method === 'transfer'
    const advAmt = Math.round(amt * (Number(form.advance_percent) || 30) / 100)
    const interimTotal = (form.interim_payments || []).reduce((s, p) => s + Number(p.amount || 0), 0)
    const finalAmt = Math.max(0, amt - advAmt - interimTotal)
    const totalPaid = (form.advance_paid ? advAmt : 0) + interimTotal + (form.final_paid ? finalAmt : 0)

    const data = {
      name: form.name.trim(), outsource_type: form.outsource_type,
      project_id: form.project_id || null, work_type: form.work_type || null,
      contract_amount: amt, payment_method: form.payment_method,
      edv_amount: isT ? edv(amt) : 0, amount_with_edv: isT ? withEdv(amt) : amt,
      advance_percent: Number(form.advance_percent) || 30,
      advance_paid: form.advance_paid, advance_date: form.advance_date || null,
      advance_method: form.advance_method,
      interim_payments: form.interim_payments,
      interim_payment: interimTotal,
      final_paid: form.final_paid, final_date: form.final_date || null,
      final_method: form.final_method,
      payment_status: form.payment_status, work_status: form.work_status,
      client_approval_date: form.client_approval_date || null,
      planned_deadline: form.planned_deadline || null,
      contract_number: form.contract_number || null, notes: form.notes || null,
      total_paid: totalPaid, remaining: amt - totalPaid
    }
    if (editWork) {
      const { error } = await supabase.from('outsource_works').update(data).eq('id', editWork.id)
      if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin', 'error'); return }
      addToast('Yeniləndi', 'success')
    } else {
      const { error } = await supabase.from('outsource_works').insert(data)
      if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin', 'error'); return }
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
  const totalContract = filteredWorks.reduce((s, w) => s + Number(w.contract_amount || 0), 0)
  const totalPaidPeriod = filteredWorks.reduce((s, w) => s + getPaidInPeriod(w), 0)
  const totalEdvAmt = filteredWorks.filter(w => w.payment_method === 'transfer').reduce((s, w) => s + Number(w.edv_amount || 0), 0)

  if (loading) return <div className="p-4 lg:p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-4 lg:p-6 fade-in">
      <PageHeader
        title="Podrat İşləri"
        subtitle={`${filteredWorks.length} podrat`}
        action={isAdmin ? <Button onClick={() => { setEditWork(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni podrat</Button> : null}
      />

      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard label="Müqavilə (ƏDV xaric)" value={fmt(totalContract)} />
          <StatCard label="ƏDV məbləği" value={fmt(totalEdvAmt)} />
          <StatCard label={filterYear ? `${filterYear}${filterMonth ? ` - ${MONTHS[filterMonth-1]}` : ''} ödənildi` : 'Cəmi ödənildi'} value={fmt(totalPaidPeriod)} variant="success" />
          <StatCard label="Aktiv podratlar" value={works.filter(w => w.work_status === 'in_progress').length} />
        </div>
      )}

      {/* Filterlər */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
          className="px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none focus:border-[#0f172a]">
          <option value={0}>Bütün illər</option>
          {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}
          className="px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none focus:border-[#0f172a]">
          <option value={0}>Bütün aylar</option>
          {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
          className="px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none focus:border-[#0f172a]">
          <option value="">Bütün layihələr</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input value={filterContractor} onChange={e => setFilterContractor(e.target.value)}
          placeholder="Podratçı axtar..."
          className="px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none focus:border-[#0f172a]" />
        {(filterYear || filterMonth || filterProject || filterContractor) && (
          <button onClick={() => { setFilterYear(0); setFilterMonth(0); setFilterProject(''); setFilterContractor('') }}
            className="px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50">
            Sıfırla ✕
          </button>
        )}
      </div>

      {works.length === 0 ? (
        <EmptyState icon={IconHeartHandshake} title="Hələ podrat işi yoxdur"
          action={isAdmin ? <Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Əlavə et</Button> : null} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e8e8e4]">
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Podratçı</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Layihə</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">İş statusu</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Deadline</th>
                  {isAdmin && <>
                    <th className="text-left px-4 py-3 font-medium text-[#888]">Ödəniş</th>
                    <th className="text-left px-4 py-3 font-medium text-[#888]">Mərhələlər</th>
                    <th className="text-right px-4 py-3 font-medium text-[#888]">Müqavilə</th>
                    <th className="text-right px-4 py-3 font-medium text-[#888]">{filterYear || filterMonth ? 'Dövrdə ödənildi' : 'Ödənildi'}</th>
                    <th className="text-right px-4 py-3 font-medium text-[#888]">Qalıq</th>
                    <th className="px-4 py-3"></th>
                  </>}
                </tr>
              </thead>
              <tbody>
                {filteredWorks.map(w => {
                  const ws = WORK_STATUSES.find(s => s.key === w.work_status)
                  const ps = PAYMENT_STATUSES.find(s => s.key === w.payment_status)
                  const days = w.planned_deadline ? Math.floor((new Date(w.planned_deadline) - new Date()) / 86400000) : null
                  const paidInPeriod = getPaidInPeriod(w)
                  const interimCount = (w.interim_payments || []).filter(p => p.date).length
                  return (
                    <tr key={w.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#0f172a]">{w.name}</div>
                        {w.work_type && <div className="text-[10px] text-[#aaa]">{w.work_type}</div>}
                      </td>
                      <td className="px-4 py-3 text-[#555]">{getProject(w.project_id)?.name || '—'}</td>
                      <td className="px-4 py-3"><Badge variant={ws?.color} size="sm">{ws?.label}</Badge></td>
                      <td className="px-4 py-3">
                        {days !== null ? (
                          <div>
                            <div className="text-xs text-[#555]">{new Date(w.planned_deadline).toLocaleDateString('az-AZ')}</div>
                            <div className={`text-[10px] font-medium ${days < 0 ? 'text-red-500' : days <= 7 ? 'text-yellow-600' : 'text-[#aaa]'}`}>
                              {days < 0 ? `${Math.abs(days)}g keçib` : days === 0 ? 'Bu gün' : `${days}g qalıb`}
                            </div>
                          </div>
                        ) : <span className="text-[#aaa]">—</span>}
                      </td>
                      {isAdmin && <>
                        <td className="px-4 py-3"><Badge variant={ps?.color} size="sm">{ps?.label}</Badge></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${w.advance_paid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                              Avans {w.advance_percent || 30}%
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${interimCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                              Ara×{interimCount}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${w.final_paid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                              Final
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-[#0f172a]">{fmt(w.contract_amount)}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">{fmt(paidInPeriod)}</td>
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
                      </>}
                    </tr>
                  )
                })}
              </tbody>
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
