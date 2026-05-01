import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton, StatCard, PageLoadingShell, TableSkeleton } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconArrowDown } from '@tabler/icons-react'

const EDV = 0.18
function fmt(n) { return '₼' + Number(n || 0).toLocaleString() }
function edv(n) { return Math.round(Number(n || 0) * EDV) }
function withEdv(n) { return Math.round(Number(n || 0) * (1 + EDV)) }

const CATEGORIES = ['Maaş', 'Podrat', 'Ofis', 'Nəqliyyat', 'Kommunal', 'Avadanlıq', 'Marketing', 'Vergi', 'Digər']

function ExpenseForm({ open, onClose, onSave, expense, projects }) {
  const [form, setForm] = useState({ name: '', category: 'Digər', amount: '', expense_date: '', payment_method: 'transfer', project_id: '', notes: '' })

  useEffect(() => {
    if (expense) {
      setForm({ name: expense.name || '', category: expense.category || 'Digər', amount: expense.amount || '', expense_date: expense.expense_date || '', payment_method: expense.payment_method || 'transfer', project_id: expense.project_id || '', notes: expense.notes || '' })
    } else {
      setForm({ name: '', category: 'Digər', amount: '', expense_date: new Date().toISOString().split('T')[0], payment_method: 'transfer', project_id: '', notes: '' })
    }
  }, [expense, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  const amt = Number(form.amount) || 0
  const isTransfer = form.payment_method === 'transfer'

  return (
    <Modal open={open} onClose={onClose} title={expense ? 'Xərci redaktə et' : 'Yeni xərc'}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Açıqlama *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="Xərcin açıqlaması" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Kateqoriya</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
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
            <label className="block text-xs font-medium text-[#555] mb-1">Tarix</label>
            <input type="date" value={form.expense_date} onChange={e => set('expense_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Layihə</label>
            <select value={form.project_id} onChange={e => set('project_id', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="">Seçin (isteğe bağlı)</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {amt > 0 && (
          <div className={`rounded-lg p-3 text-xs ${isTransfer ? 'bg-amber-50 border border-amber-200' : 'bg-[#f5f5f0]'}`}>
            {isTransfer ? (
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><div className="text-[#888] mb-0.5">ƏDV xaric</div><div className="font-bold text-[#0f172a]">{fmt(amt)}</div></div>
                <div><div className="text-[#888] mb-0.5">ƏDV geri alınır (18%)</div><div className="font-bold text-green-600">{fmt(edv(amt))}</div></div>
                <div><div className="text-[#888] mb-0.5">ƏDV daxil</div><div className="font-bold text-red-600">{fmt(withEdv(amt))}</div></div>
              </div>
            ) : (
              <div className="text-center text-[#555]">Nağd ödəniş — ƏDV geri alınmır · Cəmi: <span className="font-bold text-[#0f172a]">{fmt(amt)}</span></div>
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
          <Button onClick={() => onSave(form)} className="ml-auto">{expense ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function XerclerPage() {
  const { addToast } = useToast()
  const [expenses, setExpenses] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editExpense, setEditExpense] = useState(null)
  const [deleteExpense, setDeleteExpense] = useState(null)
  const [filterCat, setFilterCat] = useState('all')
  const [filterProject, setFilterProject] = useState('')
  const [filterYear, setFilterYear] = useState(0)
  const [filterMonth, setFilterMonth] = useState(0)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [eRes, pRes] = await Promise.all([
      supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
      supabase.from('projects').select('id, name'),
    ])
    setExpenses(eRes.data || [])
    setProjects(pRes.data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.name.trim() || !form.amount) { addToast('Ad və məbləğ daxil edin', 'error'); return }
    const amt = Number(form.amount)
    if (amt <= 0) { addToast('Məbləğ sıfırdan böyük olmalıdır', 'error'); return }
    const isTransfer = form.payment_method === 'transfer'
    const data = {
      name: form.name.trim(), category: form.category, amount: amt,
      payment_method: form.payment_method,
      edv_amount: isTransfer ? edv(amt) : 0,
      amount_with_edv: isTransfer ? withEdv(amt) : amt,
      expense_date: form.expense_date || null,
      project_id: form.project_id || null, notes: form.notes || null
    }
    if (editExpense) {
      const { data: updated, error } = await supabase.from('expenses').update(data).eq('id', editExpense.id).select().single()
      if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin', 'error'); return }
      setExpenses(prev => prev.map(e => e.id === editExpense.id ? updated : e))
      addToast('Yeniləndi', 'success')
    } else {
      const { data: inserted, error } = await supabase.from('expenses').insert(data).select().single()
      if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin', 'error'); return }
      setExpenses(prev => [inserted, ...prev])
      addToast('Xərc əlavə edildi', 'success')
    }
    setModalOpen(false); setEditExpense(null)
  }

  async function handleDelete() {
    const id = deleteExpense.id
    setExpenses(prev => prev.filter(e => e.id !== id))
    setDeleteExpense(null)
    addToast('Silindi', 'success')
    await supabase.from('expenses').delete().eq('id', id)
  }

  const totalCash = expenses.filter(e => e.payment_method === 'cash').reduce((s, e) => s + Number(e.amount || 0), 0)
  const totalTransfer = expenses.filter(e => e.payment_method === 'transfer').reduce((s, e) => s + Number(e.amount || 0), 0)
  const totalEdv = expenses.filter(e => e.payment_method === 'transfer').reduce((s, e) => s + Number(e.edv_amount || edv(e.amount) || 0), 0)
  const totalWithEdv = expenses.reduce((s, e) => s + Number(e.amount_with_edv || e.amount || 0), 0)
  const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)

  const filtered = expenses.filter(e => {
    if (filterCat !== 'all' && e.category !== filterCat) return false
    if (filterProject && e.project_id !== filterProject) return false
    if (e.expense_date) {
      const d = new Date(e.expense_date)
      if (filterYear && d.getFullYear() !== filterYear) return false
      if (filterMonth && d.getMonth() + 1 !== filterMonth) return false
    }
    return true
  })
  const getProject = id => projects.find(p => p.id === id)

  if (loading) return <PageLoadingShell stats={3}><TableSkeleton rows={6} cols={6} /></PageLoadingShell>

  return (
    <div className="p-4 lg:p-6 fade-in">
      <PageHeader
        title="Xərclər"
        subtitle={`${expenses.length} qeyd`}
        action={<Button onClick={() => { setEditExpense(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni xərc</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Nağd xərc" value={fmt(totalCash)} variant="danger" />
        <StatCard label="Köçürmə (ƏDV xaric)" value={fmt(totalTransfer)} variant="danger" />
        <StatCard label="ƏDV geri alınır" value={fmt(totalEdv)} variant="success" />
        <StatCard label="Ümumi (ƏDV daxil)" value={fmt(totalWithEdv)} variant="danger" />
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
          className="px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none focus:border-[#0f172a]">
          <option value={0}>Bütün illər</option>
          {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}
          className="px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none focus:border-[#0f172a]">
          <option value={0}>Bütün aylar</option>
          {['Yan','Fev','Mar','Apr','May','İyn','İyl','Avq','Sen','Okt','Noy','Dek'].map((m,i) => (
            <option key={i+1} value={i+1}>{m}</option>
          ))}
        </select>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
          className="px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none focus:border-[#0f172a]">
          <option value="">Bütün layihələr</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="flex gap-1 mb-4 flex-wrap">
        {[{ key: 'all', label: 'Hamısı' }, ...CATEGORIES.map(c => ({ key: c, label: c }))].map(c => (
          <button key={c.key} onClick={() => setFilterCat(c.key)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${filterCat === c.key ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'border-[#e8e8e4] text-[#555] hover:border-[#0f172a]'}`}>
            {c.label}
          </button>
        ))}
      </div>

      {expenses.length === 0 ? (
        <EmptyState icon={IconArrowDown} title="Hələ xərc yoxdur"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Əlavə et</Button>} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e8e8e4]">
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Açıqlama</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Kateqoriya</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Tarix</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Ödəniş</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">ƏDV xaric</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">ƏDV geri (18%)</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">ƏDV daxil</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(exp => {
                  const isTransfer = exp.payment_method === 'transfer'
                  return (
                    <tr key={exp.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8]">
                      <td className="px-4 py-3 font-medium text-[#0f172a]">{exp.name}</td>
                      <td className="px-4 py-3"><Badge variant="default" size="sm">{exp.category}</Badge></td>
                      <td className="px-4 py-3 text-[#555]">{exp.expense_date ? new Date(exp.expense_date).toLocaleDateString('az-AZ') : '—'}</td>
                      <td className="px-4 py-3"><Badge variant={isTransfer ? 'info' : 'default'} size="sm">{isTransfer ? 'Köçürmə' : 'Nağd'}</Badge></td>
                      <td className="px-4 py-3 text-right font-medium text-[#0f172a]">{fmt(exp.amount)}</td>
                      <td className="px-4 py-3 text-right text-green-600">{isTransfer ? fmt(exp.edv_amount || edv(exp.amount)) : '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">{fmt(exp.amount_with_edv || exp.amount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditExpense(exp); setModalOpen(true) }} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={12} /></button>
                          <button onClick={() => setDeleteExpense(exp)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#f5f5f0]">
                  <td colSpan={4} className="px-4 py-2 text-xs font-medium text-[#555]">Cəmi ({filtered.length})</td>
                  <td className="px-4 py-2 text-right text-xs font-bold text-[#0f172a]">{fmt(filtered.reduce((s, e) => s + Number(e.amount || 0), 0))}</td>
                  <td className="px-4 py-2 text-right text-xs font-bold text-green-600">{fmt(filtered.reduce((s, e) => s + Number(e.edv_amount || 0), 0))}</td>
                  <td className="px-4 py-2 text-right text-xs font-bold text-red-700">{fmt(filtered.reduce((s, e) => s + Number(e.amount_with_edv || e.amount || 0), 0))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      <ExpenseForm open={modalOpen} onClose={() => { setModalOpen(false); setEditExpense(null) }}
        onSave={handleSave} expense={editExpense} projects={projects} />
      <ConfirmDialog open={!!deleteExpense} title="Xərci sil"
        message={`"${deleteExpense?.name}" qeydini silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteExpense(null)} danger />
    </div>
  )
}
