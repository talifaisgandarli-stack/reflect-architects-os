import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconRefresh } from '@tabler/icons-react'

function fmt(n) { return '₼' + Number(n || 0).toLocaleString() }

const FREQUENCIES = [
  { key: 'monthly', label: 'Aylıq' },
  { key: 'yearly', label: 'İllik' },
  { key: 'quarterly', label: 'Rüblük' },
]

function SubForm({ open, onClose, onSave, sub }) {
  const [form, setForm] = useState({
    name: '', amount: '', frequency: 'monthly', sub_type: '',
    cycle_start_date: '', next_payment_date: '', is_active: true, notes: ''
  })

  useEffect(() => {
    if (sub) {
      setForm({
        name: sub.name || '', amount: sub.amount || '',
        frequency: sub.frequency || 'monthly', sub_type: sub.sub_type || '',
        cycle_start_date: sub.cycle_start_date || '',
        next_payment_date: sub.next_payment_date || '',
        is_active: sub.is_active !== false, notes: sub.notes || ''
      })
    } else {
      setForm({ name: '', amount: '', frequency: 'monthly', sub_type: '', cycle_start_date: '', next_payment_date: '', is_active: true, notes: '' })
    }
  }, [sub, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

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
            <label className="block text-xs font-medium text-[#555] mb-1">Məbləğ (₼) *</label>
            <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="0" />
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
              placeholder="Ofis, Proqram, Kommunal..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Növbəti ödəniş</label>
            <input type="date" value={form.next_payment_date} onChange={e => set('next_payment_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)}
              className="w-4 h-4 accent-[#0f172a]" />
            <label className="text-xs text-[#555]">Aktiv</label>
          </div>
        </div>
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

export default function SabitXerclerPage() {
  const { addToast } = useToast()
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editSub, setEditSub] = useState(null)
  const [deleteSub, setDeleteSub] = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('subscriptions').select('*').order('name')
    setSubs(data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.name.trim() || !form.amount) { addToast('Ad və məbləğ daxil edin', 'error'); return }
    const data = {
      name: form.name.trim(), amount: Number(form.amount),
      frequency: form.frequency, sub_type: form.sub_type || null,
      cycle_start_date: form.cycle_start_date || null,
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

  async function handleDelete() {
    await supabase.from('subscriptions').delete().eq('id', deleteSub.id)
    addToast('Silindi', 'success')
    setDeleteSub(null); await loadData()
  }

  const active = subs.filter(s => s.is_active)
  const monthlyTotal = active.reduce((sum, s) => {
    if (s.frequency === 'monthly') return sum + Number(s.amount || 0)
    if (s.frequency === 'yearly') return sum + Number(s.amount || 0) / 12
    if (s.frequency === 'quarterly') return sum + Number(s.amount || 0) / 3
    return sum
  }, 0)
  const yearlyTotal = monthlyTotal * 12

  if (loading) return <div className="p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 fade-in">
      <PageHeader
        title="Sabit Xərclər"
        subtitle="Müntəzəm ödənişlər və abunəliklər"
        action={<Button onClick={() => { setEditSub(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni sabit xərc</Button>}
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <StatCard label="Aylıq sabit xərc" value={fmt(Math.round(monthlyTotal))} variant="danger" />
        <StatCard label="İllik proqnoz" value={fmt(Math.round(yearlyTotal))} />
        <StatCard label="Aktiv maddə" value={active.length} />
      </div>

      {subs.length === 0 ? (
        <EmptyState icon={IconRefresh} title="Hələ sabit xərc yoxdur"
          description="İcarə, maaş, kommunal, proqram abunəliklərini əlavə edin"
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
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Növbəti ödəniş</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">Məbləğ</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">Aylıq</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {subs.map(s => {
                  const monthly = s.frequency === 'monthly' ? Number(s.amount) :
                    s.frequency === 'yearly' ? Number(s.amount) / 12 :
                    s.frequency === 'quarterly' ? Number(s.amount) / 3 : 0
                  const freq = FREQUENCIES.find(f => f.key === s.frequency)
                  const nextDays = s.next_payment_date ? Math.floor((new Date(s.next_payment_date) - new Date()) / 86400000) : null
                  return (
                    <tr key={s.id} className={`border-b border-[#f5f5f0] hover:bg-[#fafaf8] ${!s.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-[#0f172a]">{s.name}</td>
                      <td className="px-4 py-3 text-[#555]">{s.sub_type || '—'}</td>
                      <td className="px-4 py-3"><Badge variant="default" size="sm">{freq?.label}</Badge></td>
                      <td className="px-4 py-3">
                        {s.next_payment_date ? (
                          <span className={`${nextDays !== null && nextDays <= 7 && nextDays >= 0 ? 'text-yellow-600 font-medium' : nextDays !== null && nextDays < 0 ? 'text-red-500' : 'text-[#555]'}`}>
                            {new Date(s.next_payment_date).toLocaleDateString('az-AZ')}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={s.is_active ? 'success' : 'default'} size="sm">
                          {s.is_active ? 'Aktiv' : 'Deaktiv'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#0f172a]">{fmt(s.amount)}</td>
                      <td className="px-4 py-3 text-right text-[#555]">{fmt(Math.round(monthly))}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
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
                  <td colSpan={6} className="px-4 py-2 text-xs font-medium text-[#555]">Aylıq cəmi</td>
                  <td className="px-4 py-2 text-right text-xs font-bold text-red-700">{fmt(Math.round(monthlyTotal))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      <SubForm open={modalOpen} onClose={() => { setModalOpen(false); setEditSub(null) }}
        onSave={handleSave} sub={editSub} />
      <ConfirmDialog open={!!deleteSub} title="Sabit xərci sil"
        message={`"${deleteSub?.name}" qeydini silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteSub(null)} danger />
    </div>
  )
}
