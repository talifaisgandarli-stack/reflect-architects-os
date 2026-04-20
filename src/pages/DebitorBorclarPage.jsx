import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconMailDollar, IconCheck } from '@tabler/icons-react'

function fmt(n) { return '₼' + Number(n || 0).toLocaleString() }

function getAging(dateStr) {
  if (!dateStr) return null
  return Math.floor((new Date() - new Date(dateStr)) / 86400000)
}

function AgingBadge({ days }) {
  if (days === null) return null
  if (days < 0) return <Badge variant="default" size="sm">Vaxtı gəlməyib</Badge>
  if (days <= 30) return <Badge variant="success" size="sm">0–30 gün</Badge>
  if (days <= 60) return <Badge variant="warning" size="sm">31–60 gün</Badge>
  return <Badge variant="danger" size="sm">60+ gün</Badge>
}

function ReceivableForm({ open, onClose, onSave, receivable, projects, clients }) {
  const [form, setForm] = useState({ name: '', project_id: '', client_id: '', expected_amount: '', paid_amount: '0', expected_date: '', reminder_date: '', contact_person: '', notes: '' })

  useEffect(() => {
    if (receivable) {
      setForm({ name: receivable.name || '', project_id: receivable.project_id || '', client_id: receivable.client_id || '', expected_amount: receivable.expected_amount || '', paid_amount: receivable.paid_amount || '0', expected_date: receivable.expected_date || '', reminder_date: receivable.reminder_date || '', contact_person: receivable.contact_person || '', notes: receivable.notes || '' })
    } else {
      setForm({ name: '', project_id: '', client_id: '', expected_amount: '', paid_amount: '0', expected_date: '', reminder_date: '', contact_person: '', notes: '' })
    }
  }, [receivable, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <Modal open={open} onClose={onClose} title={receivable ? 'Alacağı redaktə et' : 'Yeni alacaq'}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Açıqlama *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="Hesab ödənişi, Avans..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Gözlənilən məbləğ (₼) *</label>
            <input type="number" value={form.expected_amount} onChange={e => set('expected_amount', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Ödənilmiş (₼)</label>
            <input type="number" value={form.paid_amount} onChange={e => set('paid_amount', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="0" />
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
            <label className="block text-xs font-medium text-[#555] mb-1">Gözlənilən ödəniş tarixi</label>
            <input type="date" value={form.expected_date} onChange={e => set('expected_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Xatırlatma tarixi</label>
            <input type="date" value={form.reminder_date} onChange={e => set('reminder_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[#555] mb-1">Əlaqə şəxsi</label>
            <input value={form.contact_person} onChange={e => set('contact_person', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="Ad Soyad" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Qeyd</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none" />
        </div>
        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto">{receivable ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function DebitorBorclarPage() {
  const { addToast } = useToast()
  const [receivables, setReceivables] = useState([])
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editRec, setEditRec] = useState(null)
  const [deleteRec, setDeleteRec] = useState(null)
  const [showPaid, setShowPaid] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [rRes, pRes, cRes] = await Promise.all([
      supabase.from('receivables').select('*').order('expected_date', { ascending: true }),
      supabase.from('projects').select('id, name'),
      supabase.from('clients').select('id, name'),
    ])
    setReceivables(rRes.data || [])
    setProjects(pRes.data || [])
    setClients(cRes.data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.name.trim() || !form.expected_amount) { addToast('Ad və məbləğ daxil edin', 'error'); return }
    const expected = Number(form.expected_amount)
    const paid = Number(form.paid_amount) || 0
    const data = { name: form.name.trim(), project_id: form.project_id || null, client_id: form.client_id || null, expected_amount: expected, paid_amount: paid, expected_date: form.expected_date || null, reminder_date: form.reminder_date || null, contact_person: form.contact_person || null, notes: form.notes || null, paid: paid >= expected }
    if (editRec) {
      const { error } = await supabase.from('receivables').update(data).eq('id', editRec.id)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Yeniləndi', 'success')
    } else {
      const { error } = await supabase.from('receivables').insert(data)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Alacaq əlavə edildi', 'success')
    }
    setModalOpen(false); setEditRec(null); await loadData()
  }

  async function markPaid(rec) {
    await supabase.from('receivables').update({ paid: true, paid_amount: rec.expected_amount, paid_date: new Date().toISOString().split('T')[0] }).eq('id', rec.id)
    addToast('Ödənildi olaraq işarələndi', 'success')
    await loadData()
  }

  async function handleDelete() {
    await supabase.from('receivables').delete().eq('id', deleteRec.id)
    addToast('Silindi', 'success')
    setDeleteRec(null); await loadData()
  }

  const unpaid = receivables.filter(r => !r.paid)
  const paid = receivables.filter(r => r.paid)
  const totalExpected = unpaid.reduce((s, r) => s + Number(r.expected_amount || 0), 0)
  const totalPaid = paid.reduce((s, r) => s + Number(r.paid_amount || 0), 0)
  const overdue60 = unpaid.filter(r => getAging(r.expected_date) > 60).length

  const getProject = id => projects.find(p => p.id === id)
  const getClient = id => clients.find(c => c.id === id)

  const displayed = showPaid ? receivables : unpaid

  if (loading) return <div className="p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 fade-in">
      <PageHeader
        title="Debitor Borclar"
        subtitle="Gözlənilən alacaqlar · Yaşlandırma hesabatı"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowPaid(!showPaid)}>
              {showPaid ? 'Yalnız açıqlar' : 'Ödənilənlər də'}
            </Button>
            <Button onClick={() => { setEditRec(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni alacaq</Button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard label="Gözlənilən alacaq" value={fmt(totalExpected)} variant="danger" />
        <StatCard label="Tahsil edilmiş" value={fmt(totalPaid)} variant="success" />
        <StatCard label="Açıq alacaqlar" value={unpaid.length} />
        <StatCard label="60+ gün gecikmiş" value={overdue60} variant={overdue60 > 0 ? 'danger' : 'default'} />
      </div>

      {receivables.length === 0 ? (
        <EmptyState icon={IconMailDollar} title="Hələ alacaq yoxdur"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Əlavə et</Button>} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e8e8e4]">
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Açıqlama</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Layihə / Sifarişçi</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Gözlənilən tarix</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Yaşlandırma</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">Gözlənilən</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">Ödənilmiş</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">Qalıq</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(r => {
                  const aging = getAging(r.expected_date)
                  const remaining = Number(r.expected_amount || 0) - Number(r.paid_amount || 0)
                  return (
                    <tr key={r.id} className={`border-b border-[#f5f5f0] hover:bg-[#fafaf8] ${r.paid ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#0f172a]">{r.name}</div>
                        {r.contact_person && <div className="text-[10px] text-[#aaa]">{r.contact_person}</div>}
                      </td>
                      <td className="px-4 py-3 text-[#555]">
                        {getProject(r.project_id)?.name || getClient(r.client_id)?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-[#555]">
                        {r.expected_date ? new Date(r.expected_date).toLocaleDateString('az-AZ') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {r.paid ? <Badge variant="success" size="sm">Ödənilib</Badge> : <AgingBadge days={aging} />}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[#0f172a]">{fmt(r.expected_amount)}</td>
                      <td className="px-4 py-3 text-right text-green-600">{fmt(r.paid_amount)}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">{fmt(remaining)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {!r.paid && (
                            <button onClick={() => markPaid(r)} className="text-[#aaa] hover:text-green-600 p-1" title="Ödənildi">
                              <IconCheck size={12} />
                            </button>
                          )}
                          <button onClick={() => { setEditRec(r); setModalOpen(true) }} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={12} /></button>
                          <button onClick={() => setDeleteRec(r)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#f5f5f0]">
                  <td colSpan={4} className="px-4 py-2 text-xs font-medium text-[#555]">Cəmi qalıq</td>
                  <td className="px-4 py-2 text-right text-xs font-bold text-[#0f172a]">{fmt(totalExpected)}</td>
                  <td className="px-4 py-2 text-right text-xs font-bold text-green-700">{fmt(totalPaid)}</td>
                  <td className="px-4 py-2 text-right text-xs font-bold text-red-700">{fmt(totalExpected - displayed.filter(r=>!r.paid).reduce((s,r)=>s+Number(r.paid_amount||0),0))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      <ReceivableForm open={modalOpen} onClose={() => { setModalOpen(false); setEditRec(null) }}
        onSave={handleSave} receivable={editRec} projects={projects} clients={clients} />
      <ConfirmDialog open={!!deleteRec} title="Alacağı sil"
        message={`"${deleteRec?.name}" qeydini silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteRec(null)} danger />
    </div>
  )
}
