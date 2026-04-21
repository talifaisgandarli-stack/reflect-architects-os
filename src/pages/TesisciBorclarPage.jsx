import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconUserCircle } from '@tabler/icons-react'

function fmt(n) { return '₼' + Number(n || 0).toLocaleString() }

function LoanForm({ open, onClose, onSave, loan }) {
  const [form, setForm] = useState({
    name: '', amount: '', payment_date: new Date().toISOString().split('T')[0],
    payment_type: 'cash', notes: ''
  })

  useEffect(() => {
    if (loan) {
      setForm({
        name: loan.name || '', amount: loan.amount || '',
        payment_date: loan.payment_date || '',
        payment_type: loan.payment_type || 'cash',
        notes: loan.notes || ''
      })
    } else {
      setForm({ name: '', amount: '', payment_date: new Date().toISOString().split('T')[0], payment_type: 'cash', notes: '' })
    }
  }, [loan, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <Modal open={open} onClose={onClose} title={loan ? 'Borcu redaktə et' : 'Yeni borc qeydi'}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Açıqlama *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="Şirkətə verilmiş borc, avans..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Məbləğ (₼) *</label>
            <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Tarix</label>
            <input type="date" value={form.payment_date} onChange={e => set('payment_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Ödəniş növü</label>
            <select value={form.payment_type} onChange={e => set('payment_type', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="cash">Nağd</option>
              <option value="transfer">Köçürmə</option>
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
          <Button onClick={() => onSave(form)} className="ml-auto">{loan ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function TesisciBorclarPage() {
  const { addToast } = useToast()
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editLoan, setEditLoan] = useState(null)
  const [deleteLoan, setDeleteLoan] = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('owner_loans').select('*').order('payment_date', { ascending: false })
    setLoans(data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.name.trim() || !form.amount) { addToast('Ad və məbləğ daxil edin', 'error'); return }
    const data = {
      name: form.name.trim(), amount: Number(form.amount),
      payment_date: form.payment_date || null,
      payment_type: form.payment_type,
      notes: form.notes || null
    }
    if (editLoan) {
      const { error } = await supabase.from('owner_loans').update(data).eq('id', editLoan.id)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Yeniləndi', 'success')
    } else {
      const { error } = await supabase.from('owner_loans').insert(data)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Borc qeydi əlavə edildi', 'success')
    }
    setModalOpen(false); setEditLoan(null); await loadData()
  }

  async function handleDelete() {
    await supabase.from('owner_loans').delete().eq('id', deleteLoan.id)
    addToast('Silindi', 'success')
    setDeleteLoan(null); await loadData()
  }

  const total = loans.reduce((s, l) => s + Number(l.amount || 0), 0)
  const cashTotal = loans.filter(l => l.payment_type === 'cash').reduce((s, l) => s + Number(l.amount || 0), 0)
  const transferTotal = loans.filter(l => l.payment_type === 'transfer').reduce((s, l) => s + Number(l.amount || 0), 0)

  if (loading) return <div className="p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 fade-in">
      <PageHeader
        title="Təsisçi Borcları"
        subtitle="Təsisçinin şirkətə verdiyi borcların izlənməsi"
        action={<Button onClick={() => { setEditLoan(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni qeyd</Button>}
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <StatCard label="Ümumi borc" value={fmt(total)} variant="danger" sub="₼500,000 hədəf" />
        <StatCard label="Nağd" value={fmt(cashTotal)} />
        <StatCard label="Köçürmə" value={fmt(transferTotal)} />
      </div>

      {/* Progress bar */}
      <Card className="p-4 mb-5">
        <div className="flex justify-between text-xs mb-2">
          <span className="font-medium text-[#0f172a]">Ümumi borc yüklənməsi</span>
          <span className="text-[#888]">{fmt(total)} / ₼500,000</span>
        </div>
        <div className="h-2 bg-[#f0f0ec] rounded-full">
          <div
            className="h-2 rounded-full bg-[#0f172a] transition-all"
            style={{ width: `${Math.min(100, (total / 500000) * 100)}%` }}
          />
        </div>
        <div className="text-xs text-[#888] mt-1.5">
          {Math.round((total / 500000) * 100)}% — Qalıq: {fmt(500000 - total)}
        </div>
      </Card>

      {loans.length === 0 ? (
        <EmptyState icon={IconUserCircle} title="Hələ borc qeydi yoxdur"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Əlavə et</Button>} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e8e8e4]">
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Açıqlama</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Tarix</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Ödəniş növü</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Qeyd</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">Məbləğ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loans.map(l => (
                  <tr key={l.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8]">
                    <td className="px-4 py-3 font-medium text-[#0f172a]">{l.name}</td>
                    <td className="px-4 py-3 text-[#555]">
                      {l.payment_date ? new Date(l.payment_date).toLocaleDateString('az-AZ') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="default" size="sm">{l.payment_type === 'cash' ? 'Nağd' : 'Köçürmə'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[#555]">{l.notes || '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-[#0f172a]">{fmt(l.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditLoan(l); setModalOpen(true) }} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={12} /></button>
                        <button onClick={() => setDeleteLoan(l)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#f5f5f0]">
                  <td colSpan={4} className="px-4 py-2 text-xs font-medium text-[#555]">Cəmi</td>
                  <td className="px-4 py-2 text-right text-xs font-bold text-[#0f172a]">{fmt(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      <LoanForm open={modalOpen} onClose={() => { setModalOpen(false); setEditLoan(null) }}
        onSave={handleSave} loan={editLoan} />
      <ConfirmDialog open={!!deleteLoan} title="Borcu sil"
        message={`"${deleteLoan?.name}" qeydini silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteLoan(null)} danger />
    </div>
  )
}
