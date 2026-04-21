import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconUserCircle } from '@tabler/icons-react'

const EDV = 0.18
function fmt(n) { return '₼' + Number(n || 0).toLocaleString() }
function edv(n) { return Math.round(Number(n || 0) * EDV) }
function withEdv(n) { return Math.round(Number(n || 0) * (1 + EDV)) }

function LoanForm({ open, onClose, onSave, loan }) {
  const [form, setForm] = useState({ name: '', amount: '', payment_method: 'cash', transaction_type: 'loan', payment_date: new Date().toISOString().split('T')[0], notes: '' })

  useEffect(() => {
    if (loan) {
      setForm({ name: loan.name || '', amount: loan.amount || '', payment_method: loan.payment_method || 'cash', transaction_type: loan.transaction_type || 'loan', payment_date: loan.payment_date || '', notes: loan.notes || '' })
    } else {
      setForm({ name: '', amount: '', payment_method: 'cash', payment_date: new Date().toISOString().split('T')[0], notes: '' })
    }
  }, [loan, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  const amt = Number(form.amount) || 0
  const isTransfer = form.payment_method === 'transfer'

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
            <label className="block text-xs font-medium text-[#555] mb-1">Məbləğ (₼, ƏDV xaric) *</label>
            <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Ödəniş üsulu</label>
            <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="cash">Nağd</option>
              <option value="transfer">Köçürmə</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Əməliyyat növü</label>
            <select value={form.transaction_type} onChange={e => set('transaction_type', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="loan">Borc</option>
              <option value="profit">Mənfəət</option>
              <option value="repayment">Borc qaytarılması</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Tarix</label>
            <input type="date" value={form.payment_date} onChange={e => set('payment_date', e.target.value)}
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
    const amt = Number(form.amount)
    const isTransfer = form.payment_method === 'transfer'
    const data = {
      name: form.name.trim(),
      amount: amt,
      payment_method: form.payment_method,
      edv_amount: isTransfer ? edv(amt) : 0,
      amount_with_edv: isTransfer ? withEdv(amt) : amt,
      payment_date: form.payment_date || null,
      transaction_type: form.transaction_type || 'loan',
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

  const totalCash = loans.filter(l => l.payment_method === 'cash').reduce((s, l) => s + Number(l.amount || 0), 0)
  const totalTransfer = loans.filter(l => l.payment_method === 'transfer').reduce((s, l) => s + Number(l.amount || 0), 0)
  const totalEdv = loans.filter(l => l.payment_method === 'transfer').reduce((s, l) => s + Number(l.edv_amount || 0), 0)
  const totalWithEdv = loans.reduce((s, l) => s + Number(l.amount_with_edv || l.amount || 0), 0)
  const total = loans.reduce((s, l) => s + Number(l.amount || 0), 0)

  if (loading) return <div className="p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 fade-in">
      <PageHeader
        title="Təsisçi Borcları"
        subtitle="Təsisçinin şirkətə verdiyi borcların izlənməsi"
        action={<Button onClick={() => { setEditLoan(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni qeyd</Button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard label="Nağd borc" value={fmt(totalCash)} />
        <StatCard label="Köçürmə borc (ƏDV xaric)" value={fmt(totalTransfer)} />
        <StatCard label="ƏDV məbləği" value={fmt(totalEdv)} />
        <StatCard label="Ümumi (ƏDV daxil)" value={fmt(totalWithEdv)} variant="danger" />
      </div>

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
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Növ</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Ödəniş üsulu</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">ƏDV xaric</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">ƏDV (18%)</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">ƏDV daxil</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loans.map(l => {
                  const isTransfer = l.payment_method === 'transfer'
                  return (
                    <tr key={l.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8]">
                      <td className="px-4 py-3 font-medium text-[#0f172a]">{l.name}</td>
                      <td className="px-4 py-3 text-[#555]">
                        {l.payment_date ? new Date(l.payment_date).toLocaleDateString('az-AZ') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={l.transaction_type === 'profit' ? 'success' : l.transaction_type === 'repayment' ? 'info' : 'warning'} size="sm">
                          {l.transaction_type === 'profit' ? 'Mənfəət' : l.transaction_type === 'repayment' ? 'Qaytarılma' : 'Borc'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={isTransfer ? 'info' : 'default'} size="sm">
                          {isTransfer ? 'Köçürmə' : 'Nağd'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[#0f172a]">{fmt(l.amount)}</td>
                      <td className="px-4 py-3 text-right text-amber-600">
                        {isTransfer ? fmt(l.edv_amount || edv(l.amount)) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#0f172a]">
                        {fmt(l.amount_with_edv || l.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditLoan(l); setModalOpen(true) }} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={12} /></button>
                          <button onClick={() => setDeleteLoan(l)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#f5f5f0]">
                  <td colSpan={4} className="px-4 py-2 text-xs font-medium text-[#555]">Cəmi ({loans.length})</td>
                  <td className="px-4 py-2 text-right text-xs font-bold text-[#0f172a]">{fmt(total)}</td>
                  <td className="px-4 py-2 text-right text-xs font-bold text-amber-600">{fmt(totalEdv)}</td>
                  <td className="px-4 py-2 text-right text-xs font-bold text-[#0f172a]">{fmt(totalWithEdv)}</td>
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
