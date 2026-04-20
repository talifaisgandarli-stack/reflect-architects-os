import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconArrowUp } from '@tabler/icons-react'

function fmt(n) { return '₼' + Number(n || 0).toLocaleString() }

function IncomeForm({ open, onClose, onSave, income, projects, clients }) {
  const [form, setForm] = useState({ name: '', project_id: '', client_id: '', amount: '', payment_date: '', payment_method: 'transfer', notes: '' })

  useEffect(() => {
    if (income) {
      setForm({ name: income.name || '', project_id: income.project_id || '', client_id: income.client_id || '', amount: income.amount || '', payment_date: income.payment_date || '', payment_method: income.payment_method || 'transfer', notes: income.notes || '' })
    } else {
      setForm({ name: '', project_id: '', client_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'transfer', notes: '' })
    }
  }, [income, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <Modal open={open} onClose={onClose} title={income ? 'Daxilolmanı redaktə et' : 'Yeni daxilolma'}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Açıqlama *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="Avans ödənişi, Hesab ödənişi..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Məbləğ (₼) *</label>
            <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Ödəniş tarixi</label>
            <input type="date" value={form.payment_date} onChange={e => set('payment_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
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
            <label className="block text-xs font-medium text-[#555] mb-1">Sifarişçi</label>
            <select value={form.client_id} onChange={e => set('client_id', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="">Seçin</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Ödəniş metodu</label>
            <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="transfer">Köçürmə</option>
              <option value="cash">Nağd</option>
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
          <Button onClick={() => onSave(form)} className="ml-auto">{income ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function DaxilolmalarPage() {
  const { addToast } = useToast()
  const [incomes, setIncomes] = useState([])
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editIncome, setEditIncome] = useState(null)
  const [deleteIncome, setDeleteIncome] = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [iRes, pRes, cRes] = await Promise.all([
      supabase.from('incomes').select('*').order('payment_date', { ascending: false }),
      supabase.from('projects').select('id, name'),
      supabase.from('clients').select('id, name'),
    ])
    setIncomes(iRes.data || [])
    setProjects(pRes.data || [])
    setClients(cRes.data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.name.trim() || !form.amount) { addToast('Ad və məbləğ daxil edin', 'error'); return }
    const data = { name: form.name.trim(), amount: Number(form.amount), project_id: form.project_id || null, client_id: form.client_id || null, payment_date: form.payment_date || null, payment_method: form.payment_method, notes: form.notes || null }
    if (editIncome) {
      const { error } = await supabase.from('incomes').update(data).eq('id', editIncome.id)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Yeniləndi', 'success')
    } else {
      const { error } = await supabase.from('incomes').insert(data)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Daxilolma əlavə edildi', 'success')
    }
    setModalOpen(false); setEditIncome(null); await loadData()
  }

  async function handleDelete() {
    await supabase.from('incomes').delete().eq('id', deleteIncome.id)
    addToast('Silindi', 'success')
    setDeleteIncome(null); await loadData()
  }

  const total = incomes.reduce((s, i) => s + Number(i.amount || 0), 0)
  const thisMonth = incomes.filter(i => {
    if (!i.payment_date) return false
    const d = new Date(i.payment_date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((s, i) => s + Number(i.amount || 0), 0)

  const getProject = id => projects.find(p => p.id === id)
  const getClient = id => clients.find(c => c.id === id)

  if (loading) return <div className="p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 fade-in">
      <PageHeader
        title="Daxilolmalar"
        subtitle={`${incomes.length} qeyd`}
        action={<Button onClick={() => { setEditIncome(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni daxilolma</Button>}
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <StatCard label="Ümumi daxilolma" value={fmt(total)} variant="success" />
        <StatCard label="Bu ay" value={fmt(thisMonth)} />
        <StatCard label="Qeyd sayı" value={incomes.length} />
      </div>

      {incomes.length === 0 ? (
        <EmptyState icon={IconArrowUp} title="Hələ daxilolma yoxdur"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Əlavə et</Button>} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e8e8e4]">
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Açıqlama</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Layihə / Sifarişçi</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Tarix</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Metod</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">Məbləğ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {incomes.map(inc => (
                  <tr key={inc.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8]">
                    <td className="px-4 py-3 font-medium text-[#0f172a]">{inc.name}</td>
                    <td className="px-4 py-3 text-[#555]">
                      {getProject(inc.project_id)?.name || getClient(inc.client_id)?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-[#555]">
                      {inc.payment_date ? new Date(inc.payment_date).toLocaleDateString('az-AZ') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="default" size="sm">{inc.payment_method === 'cash' ? 'Nağd' : 'Köçürmə'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">{fmt(inc.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditIncome(inc); setModalOpen(true) }} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={12} /></button>
                        <button onClick={() => setDeleteIncome(inc)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#f5f5f0]">
                  <td colSpan={4} className="px-4 py-2 text-xs font-medium text-[#555]">Cəmi</td>
                  <td className="px-4 py-2 text-right text-xs font-bold text-green-700">{fmt(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      <IncomeForm open={modalOpen} onClose={() => { setModalOpen(false); setEditIncome(null) }}
        onSave={handleSave} income={editIncome} projects={projects} clients={clients} />
      <ConfirmDialog open={!!deleteIncome} title="Daxilolmanı sil"
        message={`"${deleteIncome?.name}" qeydini silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteIncome(null)} danger />
    </div>
  )
}
