import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconArrowDown } from '@tabler/icons-react'

const CATEGORIES = ['Maaş', 'Podrat', 'Ofis', 'Nəqliyyat', 'Kommunal', 'Avadanlıq', 'Marketing', 'Vergi', 'Digər']

function fmt(n) { return '₼' + Number(n || 0).toLocaleString() }

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
            <label className="block text-xs font-medium text-[#555] mb-1">Məbləğ (₼) *</label>
            <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Tarix</label>
            <input type="date" value={form.expense_date} onChange={e => set('expense_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Ödəniş metodu</label>
            <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="transfer">Köçürmə</option>
              <option value="cash">Nağd</option>
            </select>
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
    const data = { name: form.name.trim(), category: form.category, amount: Number(form.amount), expense_date: form.expense_date || null, payment_method: form.payment_method, project_id: form.project_id || null, notes: form.notes || null }
    if (editExpense) {
      const { error } = await supabase.from('expenses').update(data).eq('id', editExpense.id)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Yeniləndi', 'success')
    } else {
      const { error } = await supabase.from('expenses').insert(data)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Xərc əlavə edildi', 'success')
    }
    setModalOpen(false); setEditExpense(null); await loadData()
  }

  async function handleDelete() {
    await supabase.from('expenses').delete().eq('id', deleteExpense.id)
    addToast('Silindi', 'success')
    setDeleteExpense(null); await loadData()
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const thisMonth = expenses.filter(e => {
    if (!e.expense_date) return false
    const d = new Date(e.expense_date); const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((s, e) => s + Number(e.amount || 0), 0)

  const filtered = filterCat === 'all' ? expenses : expenses.filter(e => e.category === filterCat)
  const getProject = id => projects.find(p => p.id === id)

  if (loading) return <div className="p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 fade-in">
      <PageHeader
        title="Xərclər"
        subtitle={`${expenses.length} qeyd`}
        action={<Button onClick={() => { setEditExpense(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni xərc</Button>}
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <StatCard label="Ümumi xərc" value={fmt(total)} variant="danger" />
        <StatCard label="Bu ay" value={fmt(thisMonth)} />
        <StatCard label="Qeyd sayı" value={expenses.length} />
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
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Layihə</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Tarix</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Metod</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">Məbləğ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(exp => (
                  <tr key={exp.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8]">
                    <td className="px-4 py-3 font-medium text-[#0f172a]">{exp.name}</td>
                    <td className="px-4 py-3"><Badge variant="default" size="sm">{exp.category}</Badge></td>
                    <td className="px-4 py-3 text-[#555]">{getProject(exp.project_id)?.name || '—'}</td>
                    <td className="px-4 py-3 text-[#555]">{exp.expense_date ? new Date(exp.expense_date).toLocaleDateString('az-AZ') : '—'}</td>
                    <td className="px-4 py-3"><Badge variant="default" size="sm">{exp.payment_method === 'cash' ? 'Nağd' : 'Köçürmə'}</Badge></td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">{fmt(exp.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditExpense(exp); setModalOpen(true) }} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={12} /></button>
                        <button onClick={() => setDeleteExpense(exp)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#f5f5f0]">
                  <td colSpan={5} className="px-4 py-2 text-xs font-medium text-[#555]">Cəmi ({filtered.length})</td>
                  <td className="px-4 py-2 text-right text-xs font-bold text-red-700">{fmt(filtered.reduce((s, e) => s + Number(e.amount || 0), 0))}</td>
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
