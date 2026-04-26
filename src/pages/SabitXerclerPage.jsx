import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconRefresh, IconCheck, IconChevronDown, IconChevronRight } from '@tabler/icons-react'

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
  const [form, setForm] = useState({ name: '', amount: '', payment_method: 'transfer', frequency: 'monthly', sub_type: '', next_payment_date: '', is_active: true, notes: '' })

  useEffect(() => {
    if (sub) {
      setForm({ name: sub.name || '', amount: sub.amount || '', payment_method: sub.payment_method || 'transfer', frequency: sub.frequency || 'monthly', sub_type: sub.sub_type || '', next_payment_date: sub.next_payment_date || '', is_active: sub.is_active !== false, notes: sub.notes || '' })
    } else {
      setForm({ name: '', amount: '', payment_method: 'transfer', frequency: 'monthly', sub_type: '', next_payment_date: '', is_active: true, notes: '' })
    }
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
            placeholder="İcarə, Kommunal..." />
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
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="Ofis, Proqram, Xidmət..." />
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

        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Qeyd</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none" />
        </div>
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
            <label className="block text-xs font-medium text-[#555] mb-1">Tarix *</label>
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
            {isT ? <span>ƏDV xaric: <b>{fmt(amt)}</b> · ƏDV geri: <b className="text-green-600">{fmt(edv(amt))}</b> · ƏDV daxil: <b>{fmt(withEdv(amt))}</b></span>
              : <span>Nağd · {fmt(amt)}</span>}
          </div>
        )}
        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto"><IconCheck size={13} /> Qeydə al</Button>
        </div>
      </div>
    </Modal>
  )
}

function CategoryGroup({ category, items, payments, filterYear, filterMonth, onEdit, onDelete, onPay }) {
  const [open, setOpen] = useState(true)

  function getMonthly(s) {
    if (s.frequency === 'monthly') return Number(s.amount || 0)
    if (s.frequency === 'yearly') return Number(s.amount || 0) / 12
    if (s.frequency === 'quarterly') return Number(s.amount || 0) / 3
    return 0
  }

  function getPeriodPaid(s) {
    return payments.filter(p => {
      if (p.subscription_id !== s.id) return false
      if (!p.paid_date) return false
      const d = new Date(p.paid_date)
      if (filterYear && d.getFullYear() !== filterYear) return false
      if (filterMonth && d.getMonth() + 1 !== filterMonth) return false
      return true
    }).reduce((sum, p) => sum + Number(p.amount || 0), 0)
  }

  const catMonthly = items.filter(s => s.is_active).reduce((s, sub) => s + getMonthly(sub), 0)

  return (
    <Card className="mb-3">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#fafaf8] transition-colors">
        <div className="flex items-center gap-2">
          {open ? <IconChevronDown size={14} className="text-[#888]" /> : <IconChevronRight size={14} className="text-[#888]" />}
          <span className="text-sm font-bold text-[#0f172a]">{category}</span>
          <span className="text-[10px] text-[#aaa] bg-[#f5f5f0] px-1.5 py-0.5 rounded-full">{items.length}</span>
        </div>
        <div className="text-xs text-[#888]">
          Aylıq: <span className="font-bold text-[#0f172a]">{fmt(Math.round(catMonthly))}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-[#f0f0ec]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#f0f0ec] bg-[#fafaf8]">
                <th className="text-left px-4 py-2 font-medium text-[#888]">Ad</th>
                <th className="text-left px-4 py-2 font-medium text-[#888]">Tezlik</th>
                <th className="text-left px-4 py-2 font-medium text-[#888]">Növbəti ödəniş</th>
                <th className="text-left px-4 py-2 font-medium text-[#888]">Ödəniş</th>
                <th className="text-left px-4 py-2 font-medium text-[#888]">Status</th>
                <th className="text-right px-4 py-2 font-medium text-[#888]">ƏDV xaric</th>
                <th className="text-right px-4 py-2 font-medium text-[#888]">ƏDV daxil</th>
                <th className="text-right px-4 py-2 font-medium text-[#888]">Aylıq</th>
                {(filterYear || filterMonth) && <th className="text-right px-4 py-2 font-medium text-[#888]">Dövrdə ödənildi</th>}
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(s => {
                const freq = FREQUENCIES.find(f => f.key === s.frequency)
                const monthly = getMonthly(s)
                const periodPaid = getPeriodPaid(s)
                const isT = s.payment_method === 'transfer'
                const nextDays = s.next_payment_date ? Math.floor((new Date(s.next_payment_date) - new Date()) / 86400000) : null
                return (
                  <tr key={s.id} className={`border-b border-[#f5f5f0] hover:bg-[#fafaf8] ${!s.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-2.5 font-medium text-[#0f172a]">{s.name}</td>
                    <td className="px-4 py-2.5"><Badge variant="default" size="sm">{freq?.label}</Badge></td>
                    <td className="px-4 py-2.5">
                      {s.next_payment_date ? (
                        <span className={nextDays !== null && nextDays <= 7 && nextDays >= 0 ? 'text-yellow-600 font-medium' : nextDays !== null && nextDays < 0 ? 'text-red-500 font-medium' : 'text-[#555]'}>
                          {new Date(s.next_payment_date).toLocaleDateString('az-AZ')}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={isT ? 'info' : 'default'} size="sm">{isT ? 'Köçürmə' : 'Nağd'}</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={s.is_active ? 'success' : 'default'} size="sm">{s.is_active ? 'Aktiv' : 'Deaktiv'}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-[#0f172a]">{fmt(s.amount)}</td>
                    <td className="px-4 py-2.5 text-right text-[#555]">{isT ? fmt(withEdv(s.amount)) : fmt(s.amount)}</td>
                    <td className="px-4 py-2.5 text-right text-[#555]">{fmt(Math.round(monthly))}</td>
                    {(filterYear || filterMonth) && (
                      <td className="px-4 py-2.5 text-right font-bold text-red-600">{periodPaid > 0 ? fmt(periodPaid) : '—'}</td>
                    )}
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        <button onClick={() => onPay(s)} className="text-[#aaa] hover:text-green-600 p-1" title="Ödəniş qeydə al"><IconCheck size={12} /></button>
                        <button onClick={() => onEdit(s)} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={12} /></button>
                        <button onClick={() => onDelete(s)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={12} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
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
  const [filterYear, setFilterYear] = useState(0)
  const [filterMonth, setFilterMonth] = useState(0)

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
    const data = {
      name: form.name.trim(), amount: amt,
      payment_method: form.payment_method,
      edv_amount: isT ? edv(amt) : 0,
      amount_with_edv: isT ? withEdv(amt) : amt,
      frequency: form.frequency, sub_type: form.sub_type || null,
      next_payment_date: form.next_payment_date || null,
      is_active: form.is_active, notes: form.notes || null
    }
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

  // KPI
  const active = subs.filter(s => s.is_active)
  const monthlyTotal = active.reduce((s, sub) => {
    if (sub.frequency === 'monthly') return s + Number(sub.amount || 0)
    if (sub.frequency === 'yearly') return s + Number(sub.amount || 0) / 12
    if (sub.frequency === 'quarterly') return s + Number(sub.amount || 0) / 3
    return s
  }, 0)
  const yearlyTotal = monthlyTotal * 12

  // Filter payments for period
  const filteredPayments = payments.filter(p => {
    if (!p.paid_date) return false
    const d = new Date(p.paid_date)
    if (filterYear && d.getFullYear() !== filterYear) return false
    if (filterMonth && d.getMonth() + 1 !== filterMonth) return false
    return true
  })
  const periodTotal = filteredPayments.reduce((s, p) => s + Number(p.amount || 0), 0)

  // Group by category
  const groups = {}
  subs.forEach(s => {
    const cat = s.sub_type || 'Digər'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(s)
  })

  if (loading) return <div className="p-4 lg:p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-4 lg:p-6 fade-in">
      <PageHeader
        title="Sabit Xərclər"
        subtitle="Müntəzəm ödənişlər və abunəliklər"
        action={<Button onClick={() => { setEditSub(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni sabit xərc</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Aylıq sabit xərc" value={fmt(Math.round(monthlyTotal))} variant="danger" />
        <StatCard label="İllik proqnoz" value={fmt(Math.round(yearlyTotal))} />
        <StatCard label="Aktiv maddə" value={active.length} />
        <StatCard label={filterYear || filterMonth ? `Dövrdə ödənildi` : 'Bu ay ödənildi'} value={fmt(periodTotal)} variant="danger" />
      </div>

      {/* Filter */}
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
        {(filterYear || filterMonth) && (
          <button onClick={() => { setFilterYear(0); setFilterMonth(0) }}
            className="px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50">
            Sıfırla ✕
          </button>
        )}
      </div>

      {subs.length === 0 ? (
        <EmptyState icon={IconRefresh} title="Hələ sabit xərc yoxdur"
          description="İcarə, maaş, kommunal, proqram abunəliklərini əlavə edin"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Əlavə et</Button>} />
      ) : (
        Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => (
          <CategoryGroup
            key={cat}
            category={cat}
            items={items}
            payments={payments}
            filterYear={filterYear}
            filterMonth={filterMonth}
            onEdit={s => { setEditSub(s); setModalOpen(true) }}
            onDelete={setDeleteSub}
            onPay={s => { setPaySub(s); setPayModalOpen(true) }}
          />
        ))
      )}

      <SubForm open={modalOpen} onClose={() => { setModalOpen(false); setEditSub(null) }} onSave={handleSave} sub={editSub} />
      <PaymentModal open={payModalOpen} onClose={() => { setPayModalOpen(false); setPaySub(null) }} onSave={handlePayment} sub={paySub} />
      <ConfirmDialog open={!!deleteSub} title="Sabit xərci sil"
        message={`"${deleteSub?.name}" qeydini silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteSub(null)} danger />
    </div>
  )
}
