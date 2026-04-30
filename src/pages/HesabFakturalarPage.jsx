import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton, StatCard, PageLoadingShell, TableSkeleton } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconFileText, IconCheck } from '@tabler/icons-react'

const EDV = 0.18
function fmt(n) { return '₼' + Number(n || 0).toLocaleString() }
function edv(n) { return Math.round(Number(n || 0) * EDV) }
function withEdv(n) { return Math.round(Number(n || 0) * (1 + EDV)) }

const STATUSES = [
  { key: 'draft', label: 'Qaralama', color: 'default' },
  { key: 'sent', label: 'Göndərildi', color: 'info' },
  { key: 'paid', label: 'Ödənildi', color: 'success' },
  { key: 'overdue', label: 'Gecikmiş', color: 'danger' },
]

function InvoiceForm({ open, onClose, onSave, invoice, clients, projects }) {
  const [form, setForm] = useState({ name: '', client_id: '', project_id: '', project_estimate: '', payment_method: 'transfer', invoice_date: new Date().toISOString().split('T')[0], payment_date: '', status: 'draft', notes: '' })

  useEffect(() => {
    if (invoice) {
      setForm({ name: invoice.name || '', client_id: invoice.client_id || '', project_id: invoice.project_id || '', project_estimate: invoice.project_estimate || '', payment_method: invoice.payment_method || 'transfer', invoice_date: invoice.invoice_date || '', payment_date: invoice.payment_date || '', status: invoice.status || 'draft', notes: invoice.notes || '' })
    } else {
      setForm({ name: '', client_id: '', project_id: '', project_estimate: '', payment_method: 'transfer', invoice_date: new Date().toISOString().split('T')[0], payment_date: '', status: 'draft', notes: '' })
    }
  }, [invoice, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  const amt = Number(form.project_estimate) || 0
  const isTransfer = form.payment_method === 'transfer'

  return (
    <Modal open={open} onClose={onClose} title={invoice ? 'Fakturanı redaktə et' : 'Yeni hesab-faktura'}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Faktura adı / nömrəsi *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="FAK-2026-001" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Sifarişçi</label>
            <select value={form.client_id} onChange={e => set('client_id', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="">Seçin</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
            <label className="block text-xs font-medium text-[#555] mb-1">Məbləğ (₼, ƏDV xaric)</label>
            <input type="number" value={form.project_estimate} onChange={e => set('project_estimate', e.target.value)}
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
            <label className="block text-xs font-medium text-[#555] mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Faktura tarixi</label>
            <input type="date" value={form.invoice_date} onChange={e => set('invoice_date', e.target.value)}
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
          <Button onClick={() => onSave(form)} className="ml-auto">{invoice ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function HesabFakturalarPage() {
  const { addToast } = useToast()
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editInvoice, setEditInvoice] = useState(null)
  const [deleteInvoice, setDeleteInvoice] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [iRes, cRes, pRes] = await Promise.all([
      supabase.from('invoices').select('*').order('invoice_date', { ascending: false }),
      supabase.from('clients').select('id, name'),
      supabase.from('projects').select('id, name'),
    ])
    setInvoices(iRes.data || [])
    setClients(cRes.data || [])
    setProjects(pRes.data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.name.trim()) { addToast('Ad daxil edin', 'error'); return }
    const amt = Number(form.project_estimate) || 0
    const isTransfer = form.payment_method === 'transfer'
    const data = {
      name: form.name.trim(), client_id: form.client_id || null, project_id: form.project_id || null,
      project_estimate: amt, payment_method: form.payment_method,
      edv_amount: isTransfer ? edv(amt) : 0,
      amount_with_edv: isTransfer ? withEdv(amt) : amt,
      invoice_date: form.invoice_date || null, payment_date: form.payment_date || null,
      status: form.status, notes: form.notes || null
    }
    if (editInvoice) {
      const { data: updated, error } = await supabase.from('invoices').update(data).eq('id', editInvoice.id).select().single()
      if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin', 'error'); return }
      setInvoices(prev => prev.map(i => i.id === editInvoice.id ? updated : i))
      addToast('Yeniləndi', 'success')
    } else {
      const { data: inserted, error } = await supabase.from('invoices').insert(data).select().single()
      if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin', 'error'); return }
      setInvoices(prev => [inserted, ...prev])
      addToast('Faktura əlavə edildi', 'success')
    }
    setModalOpen(false); setEditInvoice(null)
  }

  async function markPaid(inv) {
    const patch = { status: 'paid', payment_date: new Date().toISOString().split('T')[0] }
    setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, ...patch } : i))
    addToast('Ödənildi olaraq işarələndi', 'success')
    await supabase.from('invoices').update(patch).eq('id', inv.id)
  }

  async function handleDelete() {
    const id = deleteInvoice.id
    setInvoices(prev => prev.filter(i => i.id !== id))
    setDeleteInvoice(null)
    addToast('Silindi', 'success')
    await supabase.from('invoices').delete().eq('id', id)
  }

  const getClient = id => clients.find(c => c.id === id)
  const getProject = id => projects.find(p => p.id === id)
  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.project_estimate || 0), 0)
  const totalEdv = filtered.filter(i => i.payment_method === 'transfer').reduce((s, i) => s + Number(i.edv_amount || 0), 0)

  if (loading) return <PageLoadingShell stats={4}><TableSkeleton rows={6} cols={6} /></PageLoadingShell>

  return (
    <div className="p-6 fade-in">
      <PageHeader title="Hesab-fakturalar" subtitle={`${invoices.length} faktura`}
        action={<Button onClick={() => { setEditInvoice(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni faktura</Button>} />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard label="Ümumi" value={invoices.length} />
        <StatCard label="Göndərildi" value={invoices.filter(i => i.status === 'sent').length} variant="info" />
        <StatCard label="Ödənildi" value={fmt(totalPaid)} variant="success" />
        <StatCard label="ƏDV (köçürmə)" value={fmt(totalEdv)} />
      </div>

      <div className="flex gap-1 mb-4 border-b border-[#e8e8e4]">
        {[{ key: 'all', label: 'Hamısı' }, ...STATUSES].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${filter === s.key ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#888] hover:text-[#555]'}`}>
            {s.label} <span className="ml-1 text-[10px] text-[#aaa]">{s.key === 'all' ? invoices.length : invoices.filter(i => i.status === s.key).length}</span>
          </button>
        ))}
      </div>

      {invoices.length === 0 ? (
        <EmptyState icon={IconFileText} title="Hələ faktura yoxdur"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Əlavə et</Button>} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e8e8e4]">
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Faktura</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Sifarişçi</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Ödəniş</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">ƏDV xaric</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">ƏDV (18%)</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">ƏDV daxil</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const st = STATUSES.find(s => s.key === inv.status)
                  const isTransfer = inv.payment_method === 'transfer'
                  return (
                    <tr key={inv.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#0f172a]">{inv.name}</div>
                        {inv.invoice_date && <div className="text-[10px] text-[#aaa]">{new Date(inv.invoice_date).toLocaleDateString('az-AZ')}</div>}
                      </td>
                      <td className="px-4 py-3 text-[#555]">{getClient(inv.client_id)?.name || '—'}</td>
                      <td className="px-4 py-3"><Badge variant={st?.color} size="sm">{st?.label}</Badge></td>
                      <td className="px-4 py-3"><Badge variant={isTransfer ? 'info' : 'default'} size="sm">{isTransfer ? 'Köçürmə' : 'Nağd'}</Badge></td>
                      <td className="px-4 py-3 text-right font-medium text-[#0f172a]">{fmt(inv.project_estimate)}</td>
                      <td className="px-4 py-3 text-right text-amber-600">{isTransfer ? fmt(inv.edv_amount || edv(inv.project_estimate)) : '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">{fmt(inv.amount_with_edv || inv.project_estimate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {inv.status !== 'paid' && <button onClick={() => markPaid(inv)} className="text-[#aaa] hover:text-green-600 p-1" title="Ödənildi"><IconCheck size={12} /></button>}
                          <button onClick={() => { setEditInvoice(inv); setModalOpen(true) }} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={12} /></button>
                          <button onClick={() => setDeleteInvoice(inv)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#f5f5f0]">
                  <td colSpan={4} className="px-4 py-2 font-medium text-[#555]">Cəmi ({filtered.length})</td>
                  <td className="px-4 py-2 text-right font-bold text-[#0f172a]">{fmt(filtered.reduce((s, i) => s + Number(i.project_estimate || 0), 0))}</td>
                  <td className="px-4 py-2 text-right font-bold text-amber-600">{fmt(filtered.reduce((s, i) => s + Number(i.edv_amount || 0), 0))}</td>
                  <td className="px-4 py-2 text-right font-bold text-green-600">{fmt(filtered.reduce((s, i) => s + Number(i.amount_with_edv || i.project_estimate || 0), 0))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      <InvoiceForm open={modalOpen} onClose={() => { setModalOpen(false); setEditInvoice(null) }}
        onSave={handleSave} invoice={editInvoice} clients={clients} projects={projects} />
      <ConfirmDialog open={!!deleteInvoice} title="Fakturanı sil"
        message={`"${deleteInvoice?.name}" silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteInvoice(null)} danger />
    </div>
  )
}
