import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconRefresh, IconCheck, IconHistory } from '@tabler/icons-react'

const EDV = 0.18
function fmt(n) { return '₼' + Number(n || 0).toLocaleString() }
function edv(n) { return Math.round(Number(n || 0) * EDV) }
function withEdv(n) { return Math.round(Number(n || 0) * (1 + EDV)) }

const FREQUENCIES = [
  { key: 'monthly', label: 'Aylıq' },
  { key: 'yearly', label: 'İllik' },
  { key: 'quarterly', label: 'Rüblük' },
]

const MONTHS = ['Yan','Fev','Mar','Apr','May','İyn','İyl','Avq','Sen','Okt','Noy','Dek']

function SubForm({ open, onClose, onSave, sub }) {
  const [form, setForm] = useState({ name: '', amount: '', payment_method: 'transfer', frequency: 'monthly', sub_type: '', next_payment_date: '', is_active: true })

  useEffect(() => {
    if (sub) setForm({ name: sub.name || '', amount: sub.amount || '', payment_method: sub.payment_method || 'transfer', frequency: sub.frequency || 'monthly', sub_type: sub.sub_type || '', next_payment_date: sub.next_payment_date || '', is_active: sub.is_active !== false })
    else setForm({ name: '', amount: '', payment_method: 'transfer', frequency: 'monthly', sub_type: '', next_payment_date: '', is_active: true })
  }, [sub, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  const amt = Number(form.amount) || 0
  const isT = form.payment_method === 'transfer'

  return (
    <Modal open={open} onClose={onClose} title={sub ? 'Sabit xərci redaktə et' : 'Yeni sabit xərc'}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Ad *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="İcarə, Maaş, Kommunal..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
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
            <label className="block text-xs font-medium text-[#555] mb-1">Tezlik</label>
            <select value={form.frequency} onChange={e => set('frequency', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {FREQUENCIES.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Kateqoriya</label>
            <input value={form.sub_type} onChange={e => set('sub_type', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="Ofis, Proqram..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Növbəti ödəniş</label>
            <input type="date" value={form.next_payment_date} onChange={e => set('next_payment_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 accent-[#0f172a]" />
            <label className="text-xs text-[#555]">Aktiv</label>
          </div>
        </div>
        {amt > 0 && (
          <div className={`rounded-lg p-2.5 text-xs ${isT ? 'bg-amber-50 border border-amber-200' : 'bg-[#f5f5f0]'}`}>
            {isT
              ? <span>ƏDV xaric: <b>{fmt(amt)}</b> · ƏDV: <b className="text-amber-600">{fmt(edv(amt))}</b> · ƏDV daxil: <b className="text-green-600">{fmt(withEdv(amt))}</b></span>
              : <span>Nağd · Cəmi: <b>{fmt(amt)}</b></span>}
          </div>
        )}
        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto">{sub ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

function PaymentModal({ open, onClose, onSave, sub }) {
  const [form, setForm] = useState({ paid_date: new Date().toISOString().split('T')[0], amount: '', payment_method: 'transfer', notes: '' })
  useEffect(() => {
    if (sub) setForm({ paid_date: new Date().toISOString().split('T')[0], amount: sub.amount || '', payment_method: sub.payment_method || 'transfer', notes: '' })
  }, [sub, open])
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  const amt = Number(form.amount) || 0
  const isT = form.payment_method === 'transfer'

  return (
    <Modal open={open} onClose={onClose} title={`Ödəniş qeydə al — ${sub?.name}`}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Ödəniş tarixi *</label>
            <input type="date" value={form.paid_date} onChange={e => set('paid_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Məbləğ (₼)</label>
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
            <label className="block text-xs font-medium text-[#555] mb-1">Qeyd</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="İsteğe bağlı" />
          </div>
        </div>
        {amt > 0 && (
          <div className={`rounded-lg p-2.5 text-xs ${isT ? 'bg-amber-50 border border-amber-200' : 'bg-[#f5f5f0]'}`}>
            {isT
              ? <span>ƏDV xaric: <b>{fmt(amt)}</b> · ƏDV geri alınır: <b className="text-green-600">{fmt(edv(amt))}</b> · ƏDV daxil: <b>{fmt(withEdv(amt))}</b></span>
              : <span>Nağd · Cəmi: <b>{fmt(amt)}</b></span>}
          </div>
        )}
        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto"><IconCheck size={13} /> Ödənişi qeydə al</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function SabitXerclerPage() {
  const { addToast } = useToast()
  const [subs, setSubs] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [editSub, setEditSub] = useState(null)
  const [paySub, setPaySub] = useState(null)
  const [deleteSub, setDeleteSub] = useState(null)
  const [filterYear, setFilterYear] = useState(new Date().getFullYear())
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1)
  const [filterActive, setFilterActive] = useState('active')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [sRes, pRes] = await Promise.all([
      supabase.from('subscriptions').select('*').order('name'),
      supabase.from('subscription_payments').select('*').order('paid_date', { ascending: false }),
    ])
    setSubs(sRes.data || [])
    setPayments(pRes.data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.name.trim() || !form.amount) { addToast('Ad və məbləğ daxil edin', 'error'); return }
    const amt = Number(form.amount)
    const isT = form.payment_method === 'transfer'
    const data = { name: form.name.trim(), amount: amt, payment_method: form.payment_method, edv_amount: isT ? edv(amt) : 0, amount_with_edv: isT ? withEdv(amt) : amt, frequency: form.frequency, sub_type: form.sub_type || null, next_payment_date: form.next_payment_date || null, is_active: form.is_active }
    if (editSub) {
      const { error } = await supabase.from('subscriptions').update(data).eq('id', editSub.id)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Yeniləndi', 'success')
    } else {
      const { error } = await supabase.from('subscriptions').insert(data)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Sabit xərc əlavə edildi', 'success')
    }
    setModalOpen(false); setEditSub(null); await loadData()
  }

  async function handlePayment(form) {
    if (!form.paid_date) { addToast('Tarix daxil edin', 'error'); return }
    const amt = Number(form.amount) || Number(paySub.amount)
    const isT = form.payment_method === 'transfer'
    const { error } = await supabase.from('subscription_payments').insert({
      subscription_id: paySub.id, amount: amt,
      payment_method: form.payment_method,
      edv_amount: isT ? edv(amt) : 0,
      amount_with_edv: isT ? withEdv(amt) : amt,
      paid_date: form.paid_date, notes: form.notes || null
    })
    if (error) { addToast('Xəta: ' + error.message, 'error'); return }
    addToast('Ödəniş qeydə alındı', 'success')
    setPayModalOpen(false); setPaySub(null); await loadData()
  }

  async function handleDelete() {
    await supabase.from('subscriptions').delete().eq('id', deleteSub.id)
    addToast('Silindi', 'success')
    setDeleteSub(null); await loadData()
  }

  // Filter payments by year/month
  const filteredPayments = payments.filter(p => {
    if (!p.paid_date) return false
    const d = new Date(p.paid_date)
    if (filterYear && d.getFullYear() !== filterYear) return false
    if (filterMonth && d.getMonth() + 1 !== filterMonth) return false
    return true
  })

  // Get period total per subscription
  function getPeriodTotal(subId) {
    return filteredPayments.filter(p => p.subscription_id === subId).reduce((s, p) => s + Number(p.amount || 0), 0)
  }

  // Filter subs
  const filteredSubs = subs.filter(s => {
    if (filterActive === 'active' && !s.is_active) return false
    if (filterActive === 'inactive' && s.is_active) return false
    return true
  })

  const periodTotal = filteredPayments.reduce((s, p) => s + Number(p.amount || 0), 0)
  const periodEdv = filteredPayments.filter(p => p.payment_method === 'transfer').reduce((s, p) => s + Number(p.edv_amount || 0), 0)
  const active = subs.filter(s => s.is_active)
  const monthlyEstimate = active.reduce((s, sub) => {
    const m = sub.frequency === 'monthly' ? Number(sub.amount) : sub.frequency === 'yearly' ? Number(sub.amount)/12 : sub.frequency === 'quarterly' ? Number(sub.amount)/3 : 0
    return s + m
  }, 0)

  if (loading) return <div className="p-4 lg:p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-4 lg:p-6 fade-in">
      <PageHeader
        title="Sabit Xərclər"
        subtitle="Müntəzəm ödənişlər"
        action={<Button onClick={() => { setEditSub(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni sabit xərc</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Aktiv maddə" value={active.length} />
        <StatCard label="Aylıq təxmini" value={fmt(Math.round(monthlyEstimate))} />
        <StatCard label={`${filterYear}${filterMonth ? ` - ${MONTHS[filterMonth-1]}` : ''} ödənildi`} value={fmt(periodTotal)} variant="danger" />
        <StatCard label="ƏDV geri alınır" value={fmt(periodEdv)} variant="success" />
      </div>

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
        <select value={filterActive} onChange={e => setFilterActive(e.target.value)}
          className="px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none focus:border-[#0f172a]">
          <option value="all">Hamısı</option>
          <option value="active">Aktiv</option>
          <option value="inactive">Deaktiv</option>
        </select>
      </div>

      {subs.length === 0 ? (
        <EmptyState icon={IconRefresh} title="Hələ sabit xərc yoxdur"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Əlavə et</Button>} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e8e8e4]">
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Ad</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Kateqoriya</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Tezlik</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Ödəniş</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">Məbləğ</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">{filterYear || filterMonth ? `${filterYear}${filterMonth ? ` ${MONTHS[filterMonth-1]}` : ''} ödənildi` : 'Cəmi ödənildi'}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredSubs.map(s => {
                  const freq = FREQUENCIES.find(f => f.key === s.frequency)
                  const isT = s.payment_method === 'transfer'
                  const periodPaid = getPeriodTotal(s.id)
                  return (
                    <tr key={s.id} className={`border-b border-[#f5f5f0] hover:bg-[#fafaf8] ${!s.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-[#0f172a]">{s.name}</td>
                      <td className="px-4 py-3 text-[#555]">{s.sub_type || '—'}</td>
                      <td className="px-4 py-3"><Badge variant="default" size="sm">{freq?.label}</Badge></td>
                      <td className="px-4 py-3"><Badge variant={isT ? 'info' : 'default'} size="sm">{isT ? 'Köçürmə' : 'Nağd'}</Badge></td>
                      <td className="px-4 py-3"><Badge variant={s.is_active ? 'success' : 'default'} size="sm">{s.is_active ? 'Aktiv' : 'Deaktiv'}</Badge></td>
                      <td className="px-4 py-3 text-right font-medium text-[#0f172a]">{fmt(s.amount)}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">{periodPaid > 0 ? fmt(periodPaid) : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setPaySub(s); setPayModalOpen(true) }}
                            className="text-[#aaa] hover:text-green-600 p-1" title="Ödəniş qeydə al"><IconCheck size={12} /></button>
                          <button onClick={() => { setEditSub(s); setModalOpen(true) }} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={12} /></button>
                          <button onClick={() => setDeleteSub(s)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#f5f5f0]">
                  <td colSpan={6} className="px-4 py-2 text-xs font-medium text-[#555]">Dövr üzrə cəmi</td>
                  <td className="px-4 py-2 text-right text-xs font-bold text-red-700">{fmt(periodTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      <SubForm open={modalOpen} onClose={() => { setModalOpen(false); setEditSub(null) }} onSave={handleSave} sub={editSub} />
      <PaymentModal open={payModalOpen} onClose={() => { setPayModalOpen(false); setPaySub(null) }} onSave={handlePayment} sub={paySub} />
      <ConfirmDialog open={!!deleteSub} title="Sabit xərci sil"
        message={`"${deleteSub?.name}" silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteSub(null)} danger />
    </div>
  )
}
