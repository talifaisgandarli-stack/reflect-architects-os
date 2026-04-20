import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconHeartHandshake, IconAlertTriangle } from '@tabler/icons-react'

function fmt(n) { return '₼' + Number(n || 0).toLocaleString() }

const PAYMENT_STATUSES = [
  { key: 'not_started', label: 'Başlanmayıb', color: 'default' },
  { key: '30_paid', label: '30% Ödənilib', color: 'info' },
  { key: 'interim_paid', label: 'Aralıq ödənilib', color: 'warning' },
  { key: 'hold_10', label: '10% Saxlanılır', color: 'warning' },
  { key: 'fully_closed', label: 'Tam bağlandı', color: 'success' },
]

const WORK_STATUSES = [
  { key: 'not_started', label: 'Başlanmayıb', color: 'default' },
  { key: 'in_progress', label: 'İcrada', color: 'info' },
  { key: 'completed', label: 'Tamamlandı', color: 'success' },
  { key: 'overdue', label: 'Gecikmiş', color: 'danger' },
]

function PodratForm({ open, onClose, onSave, work, projects }) {
  const [form, setForm] = useState({
    name: '', outsource_type: 'company', project_id: '', work_type: '',
    contract_amount: '', payment_status: 'not_started', work_status: 'not_started',
    paid_30_percent: false, paid_30_date: '', interim_payment: '', interim_date: '',
    paid_final_10: false, paid_final_10_date: '', client_approval_date: '',
    planned_deadline: '', followup_date: '', payment_method: 'transfer',
    contract_number: '', notes: ''
  })

  useEffect(() => {
    if (work) {
      setForm({
        name: work.name || '', outsource_type: work.outsource_type || 'company',
        project_id: work.project_id || '', work_type: work.work_type || '',
        contract_amount: work.contract_amount || '', payment_status: work.payment_status || 'not_started',
        work_status: work.work_status || 'not_started',
        paid_30_percent: work.paid_30_percent || false, paid_30_date: work.paid_30_date || '',
        interim_payment: work.interim_payment || '', interim_date: work.interim_date || '',
        paid_final_10: work.paid_final_10 || false, paid_final_10_date: work.paid_final_10_date || '',
        client_approval_date: work.client_approval_date || '',
        planned_deadline: work.planned_deadline || '', followup_date: work.followup_date || '',
        payment_method: work.payment_method || 'transfer',
        contract_number: work.contract_number || '', notes: work.notes || ''
      })
    } else {
      setForm({ name: '', outsource_type: 'company', project_id: '', work_type: '', contract_amount: '', payment_status: 'not_started', work_status: 'not_started', paid_30_percent: false, paid_30_date: '', interim_payment: '', interim_date: '', paid_final_10: false, paid_final_10_date: '', client_approval_date: '', planned_deadline: '', followup_date: '', payment_method: 'transfer', contract_number: '', notes: '' })
    }
  }, [work, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <Modal open={open} onClose={onClose} title={work ? 'Podrat işini redaktə et' : 'Yeni podrat işi'} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[#555] mb-1">Podratçı adı *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="Şirkət və ya şəxs adı" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Növ</label>
            <select value={form.outsource_type} onChange={e => set('outsource_type', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="company">Şirkət</option>
              <option value="individual">Fərdi</option>
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
            <label className="block text-xs font-medium text-[#555] mb-1">İş növü</label>
            <input value={form.work_type} onChange={e => set('work_type', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="Konstruksiya, MEP, Landşaft..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Müqavilə məbləği (₼)</label>
            <input type="number" value={form.contract_amount} onChange={e => set('contract_amount', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Müqavilə nömrəsi</label>
            <input value={form.contract_number} onChange={e => set('contract_number', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="№ ..." />
          </div>
        </div>

        <div className="border-t border-[#f0f0ec] pt-3">
          <div className="text-xs font-bold text-[#0f172a] mb-3">Ödəniş mərhələləri (30% → Aralıq → 10% saxlama → Final)</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.paid_30_percent} onChange={e => set('paid_30_percent', e.target.checked)}
                className="w-4 h-4 accent-[#0f172a]" />
              <label className="text-xs text-[#555]">30% ödənilib</label>
            </div>
            {form.paid_30_percent && (
              <div>
                <input type="date" value={form.paid_30_date} onChange={e => set('paid_30_date', e.target.value)}
                  className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1">Aralıq ödəniş (₼)</label>
              <input type="number" value={form.interim_payment} onChange={e => set('interim_payment', e.target.value)}
                className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
                placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1">Aralıq ödəniş tarixi</label>
              <input type="date" value={form.interim_date} onChange={e => set('interim_date', e.target.value)}
                className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1">Sifarişçi təsdiq tarixi</label>
              <input type="date" value={form.client_approval_date} onChange={e => set('client_approval_date', e.target.value)}
                className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.paid_final_10} onChange={e => set('paid_final_10', e.target.checked)}
                className="w-4 h-4 accent-[#0f172a]" />
              <label className="text-xs text-[#555]">Final 10% ödənilib</label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-[#f0f0ec] pt-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Ödəniş statusu</label>
            <select value={form.payment_status} onChange={e => set('payment_status', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {PAYMENT_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">İş statusu</label>
            <select value={form.work_status} onChange={e => set('work_status', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {WORK_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Deadline</label>
            <input type="date" value={form.planned_deadline} onChange={e => set('planned_deadline', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Follow-up tarixi</label>
            <input type="date" value={form.followup_date} onChange={e => set('followup_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Qeyd</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none" />
        </div>
        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto">{work ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function PodratIsleriPage() {
  const { addToast } = useToast()
  const [works, setWorks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editWork, setEditWork] = useState(null)
  const [deleteWork, setDeleteWork] = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [wRes, pRes] = await Promise.all([
      supabase.from('outsource_works').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name'),
    ])
    setWorks(wRes.data || [])
    setProjects(pRes.data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.name.trim()) { addToast('Ad daxil edin', 'error'); return }
    const data = {
      name: form.name.trim(), outsource_type: form.outsource_type,
      project_id: form.project_id || null, work_type: form.work_type || null,
      contract_amount: Number(form.contract_amount) || 0,
      payment_status: form.payment_status, work_status: form.work_status,
      paid_30_percent: form.paid_30_percent, paid_30_date: form.paid_30_date || null,
      interim_payment: Number(form.interim_payment) || 0, interim_date: form.interim_date || null,
      client_approval_date: form.client_approval_date || null,
      paid_final_10: form.paid_final_10, paid_final_10_date: form.paid_final_10_date || null,
      planned_deadline: form.planned_deadline || null, followup_date: form.followup_date || null,
      payment_method: form.payment_method, contract_number: form.contract_number || null,
      notes: form.notes || null
    }
    if (editWork) {
      const { error } = await supabase.from('outsource_works').update(data).eq('id', editWork.id)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Yeniləndi', 'success')
    } else {
      const { error } = await supabase.from('outsource_works').insert(data)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Podrat işi əlavə edildi', 'success')
    }
    setModalOpen(false); setEditWork(null); await loadData()
  }

  async function handleDelete() {
    await supabase.from('outsource_works').delete().eq('id', deleteWork.id)
    addToast('Silindi', 'success')
    setDeleteWork(null); await loadData()
  }

  const totalContract = works.reduce((s, w) => s + Number(w.contract_amount || 0), 0)
  const getProject = id => projects.find(p => p.id === id)

  if (loading) return <div className="p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 fade-in">
      <PageHeader
        title="Podrat İşləri"
        subtitle={`${works.length} podrat · 30%/Aralıq/10% saxlama/Final sistemi`}
        action={<Button onClick={() => { setEditWork(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni podrat</Button>}
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <StatCard label="Ümumi podrat dəyəri" value={fmt(totalContract)} />
        <StatCard label="Aktiv podratlar" value={works.filter(w => w.work_status === 'in_progress').length} />
        <StatCard label="Tamamlananlar" value={works.filter(w => w.work_status === 'completed').length} />
      </div>

      {works.length === 0 ? (
        <EmptyState icon={IconHeartHandshake} title="Hələ podrat işi yoxdur"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Əlavə et</Button>} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e8e8e4]">
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Podratçı</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Layihə</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">İş statusu</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Ödəniş</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Mərhələlər</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">Müqavilə</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Deadline</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {works.map(w => {
                  const days = w.planned_deadline ? Math.floor((new Date(w.planned_deadline) - new Date()) / 86400000) : null
                  const ws = WORK_STATUSES.find(s => s.key === w.work_status)
                  const ps = PAYMENT_STATUSES.find(s => s.key === w.payment_status)
                  return (
                    <tr key={w.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#0f172a]">{w.name}</div>
                        {w.work_type && <div className="text-[10px] text-[#aaa]">{w.work_type}</div>}
                      </td>
                      <td className="px-4 py-3 text-[#555]">{getProject(w.project_id)?.name || '—'}</td>
                      <td className="px-4 py-3"><Badge variant={ws?.color} size="sm">{ws?.label}</Badge></td>
                      <td className="px-4 py-3"><Badge variant={ps?.color} size="sm">{ps?.label}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${w.paid_30_percent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>30%</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${w.interim_payment > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>Ara</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${w.paid_final_10 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>10%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#0f172a]">{fmt(w.contract_amount)}</td>
                      <td className="px-4 py-3">
                        {w.planned_deadline ? (
                          <span className={`font-medium ${days < 0 ? 'text-red-500' : days <= 7 ? 'text-yellow-600' : 'text-[#555]'}`}>
                            {new Date(w.planned_deadline).toLocaleDateString('az-AZ')}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditWork(w); setModalOpen(true) }} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={12} /></button>
                          <button onClick={() => setDeleteWork(w)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <PodratForm open={modalOpen} onClose={() => { setModalOpen(false); setEditWork(null) }}
        onSave={handleSave} work={editWork} projects={projects} />
      <ConfirmDialog open={!!deleteWork} title="Podrat işini sil"
        message={`"${deleteWork?.name}" qeydini silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteWork(null)} danger />
    </div>
  )
}
