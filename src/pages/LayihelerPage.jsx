import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { notifyAll } from '../lib/notify'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton } from '../components/ui'
import { IconBuildings, IconPlus, IconLayoutKanban, IconList, IconEdit, IconTrash, IconAlertTriangle, IconChevronRight } from '@tabler/icons-react'

const STATUSES = [
  { key: 'waiting', label: 'Gözləyir', color: 'default' },
  { key: 'active', label: 'İcrada', color: 'info' },
  { key: 'on_hold', label: 'Dayandırılıb', color: 'warning' },
  { key: 'completed', label: 'Tamamlandı', color: 'success' },
]

const PHASES = [
  { key: 'urban_justification', label: 'Şəhərsalma əsaslandırması' },
  { key: 'concept', label: 'Konsept' },
  { key: 'sketch', label: 'Eskiz layihəsi' },
  { key: 'interior', label: 'İnteryer layihəsi' },
  { key: 'working_drawings', label: 'İşçi layihə' },
  { key: 'expertise', label: 'Ekspertiza' },
  { key: 'author_supervision', label: 'Müəllif nəzarəti' },
]

const RISK_LEVELS = [
  { key: 'normal', label: 'Normal', color: 'success' },
  { key: 'attention', label: 'Diqqət', color: 'warning' },
  { key: 'critical', label: 'Kritik', color: 'danger' },
]

function statusBadge(status) {
  const s = STATUSES.find(x => x.key === status)
  return <Badge variant={s?.color || 'default'}>{s?.label || status}</Badge>
}

function riskBadge(risk) {
  const r = RISK_LEVELS.find(x => x.key === risk)
  return <Badge variant={r?.color || 'default'} size="sm">{r?.label || risk}</Badge>
}

function phaseBadge(phase) {
  if (Array.isArray(phase)) {
    return (
      <div className="flex flex-wrap gap-1">
        {phase.map(ph => {
          const p = PHASES.find(x => x.key === ph)
          return <Badge key={ph} variant="default" size="sm">{p?.label || ph}</Badge>
        })}
      </div>
    )
  }
  const p = PHASES.find(x => x.key === phase)
  return <Badge variant="default" size="sm">{p?.label || phase}</Badge>
}

function fmt(n) {
  if (!n) return '₼0'
  return '₼' + Number(n).toLocaleString()
}

const EDV_RATE = 0.18
function edvCalc(n) { return Math.round(Number(n || 0) * EDV_RATE) }
function withEdvCalc(n) { return Math.round(Number(n || 0) * (1 + EDV_RATE)) }

function daysLeft(deadline) {
  if (!deadline) return null
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(deadline); d.setHours(0,0,0,0)
  return Math.floor((d - today) / 86400000)
}

function deadlineLabel(days, status) {
  const doneStatuses = ['completed']
  if (doneStatuses.includes(status)) return null
  if (days === null) return null
  if (days < 0) return { text: `${Math.abs(days)}g keçmiş`, color: 'text-red-500' }
  if (days === 0) return { text: 'Bu gün', color: 'text-yellow-600' }
  if (days <= 7) return { text: `${days} gün`, color: 'text-yellow-600' }
  return { text: `${days} gün`, color: 'text-[#aaa]' }
}

// ── Project Form Modal ──────────────────────────────────────
function ProjectForm({ open, onClose, onSave, project, clients }) {
  const [form, setForm] = useState({
    name: '', client_id: '', contract_value: '',
    advance_paid: '', advance_method: 'transfer', interim_payments: [], status: 'waiting', risk_level: 'normal',
    phases: ['concept'], completion_percent: '0',
    deadline: '', start_date: '', payment_method: 'transfer',
    final_payment: '', final_payment_method: 'transfer', final_payment_date: '',
    vat_included: false, notes: '', next_action: '', blocker: ''
  })

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || '',
        client_id: project.client_id || '',
        contract_value: project.contract_value || '',
        advance_paid: project.advance_paid || '',
        advance_method: project.advance_method || 'transfer',
        interim_payments: Array.isArray(project.interim_payments) ? project.interim_payments : [],
        status: project.status || 'waiting',
        risk_level: project.risk_level || 'normal',
        phases: Array.isArray(project.phases) ? project.phases : (project.phase ? [project.phase] : ['concept']),
        final_payment: project.final_payment || '',
        final_payment_method: project.final_payment_method || 'transfer',
        final_payment_date: project.final_payment_date || '',
        completion_percent: project.completion_percent || '0',
        deadline: project.deadline || '',
        start_date: project.start_date || '',
        payment_method: project.payment_method || 'transfer',
        vat_included: project.vat_included || false,
        notes: project.notes || '',
        next_action: project.next_action || '',
        blocker: project.blocker || ''
      })
    } else {
      setForm({
        name: '', client_id: '', contract_value: '',
        advance_paid: '', status: 'waiting', risk_level: 'normal',
        phase: 'concept', completion_percent: '0',
        deadline: '', start_date: '', payment_method: 'transfer',
        vat_included: false, notes: '', next_action: '', blocker: ''
      })
    }
  }, [project, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <Modal open={open} onClose={onClose} title={project ? 'Layihəni redaktə et' : 'Yeni layihə'} size="xl">
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3">
            <label className="block text-xs font-medium text-[#555] mb-1">Layihə adı *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="Layihənin adı" />
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
            <label className="block text-xs font-medium text-[#555] mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div className="col-span-3">
            <label className="block text-xs font-medium text-[#555] mb-1">Mərhələlər (çoxlu seçim)</label>
            <div className="flex flex-wrap gap-2 p-2 border border-[#e8e8e4] rounded-lg bg-white">
              {PHASES.map(p => (
                <label key={p.key} className={`flex items-center gap-1.5 px-2 py-1 rounded-full border cursor-pointer text-xs transition-colors ${
                  (form.phases || []).includes(p.key)
                    ? 'bg-[#0f172a] text-white border-[#0f172a]'
                    : 'border-[#e8e8e4] text-[#555] hover:border-[#0f172a]'
                }`}>
                  <input type="checkbox" className="hidden"
                    checked={(form.phases || []).includes(p.key)}
                    onChange={e => {
                      const cur = form.phases || []
                      if (e.target.checked) set('phases', [...cur, p.key])
                      else set('phases', cur.filter(x => x !== p.key))
                    }} />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Müqavilə (₼, ƏDV xaric)</label>
            <input type="number" value={form.contract_value} onChange={e => set('contract_value', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="0" />
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
            <label className="block text-xs font-medium text-[#555] mb-1">Başlama</label>
            <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Deadline</label>
            <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Tamamlanma (%)</label>
            <input type="number" min="0" max="100" value={form.completion_percent} onChange={e => set('completion_percent', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Risk</label>
            <select value={form.risk_level} onChange={e => set('risk_level', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {RISK_LEVELS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Növbəti addım</label>
            <input value={form.next_action} onChange={e => set('next_action', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="Növbəti nə edilməlidir?" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Bloker</label>
            <input value={form.blocker} onChange={e => set('blocker', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="Gecikdirən amil" />
          </div>
        </div>

        {/* ƏDV + Ödəniş mərhələləri — compact */}
        <div className="bg-[#fafaf8] border border-[#e8e8e4] rounded-lg p-3">
          <div className="text-xs font-bold text-[#0f172a] mb-2">Ödəniş mərhələləri</div>
          <div className="grid grid-cols-4 gap-2 mb-2">
            <div className="col-span-2">
              <label className="block text-[10px] text-[#888] mb-1">Avans (₼)</label>
              <input type="number" value={form.advance_paid} onChange={e => set('advance_paid', e.target.value)}
                className="w-full px-2 py-1.5 border border-[#e8e8e4] rounded text-xs focus:outline-none focus:border-[#0f172a]" placeholder="0" />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] text-[#888] mb-1">Avans üsulu</label>
              <select value={form.advance_method} onChange={e => set('advance_method', e.target.value)}
                className="w-full px-2 py-1.5 border border-[#e8e8e4] rounded text-xs focus:outline-none focus:border-[#0f172a]">
                <option value="transfer">Köçürmə</option>
                <option value="cash">Nağd</option>
              </select>
            </div>
          </div>
          {(Number(form.contract_value) > 0 || Number(form.advance_paid) > 0) && form.payment_method === 'transfer' && (
            <div className="bg-amber-50 border border-amber-100 rounded p-2 text-[10px] mb-2">
              <span className="text-[#888]">Müq: </span><strong>{fmt(Number(form.contract_value))}</strong>
              <span className="text-[#888] ml-2">ƏDV: </span><strong className="text-amber-600">{fmt(edvCalc(Number(form.contract_value)))}</strong>
              <span className="text-[#888] ml-2">Cəmi: </span><strong className="text-green-600">{fmt(withEdvCalc(Number(form.contract_value)))}</strong>
            </div>
          )}
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[#888]">Aralıq ödənişlər</span>
            <button onClick={() => set('interim_payments', [...(Array.isArray(form.interim_payments) ? form.interim_payments : []), { amount: '', method: 'transfer', date: '', note: '' }])}
              className="text-[10px] text-blue-500 hover:text-blue-700 font-medium">+ Əlavə et</button>
          </div>
          {(Array.isArray(form.interim_payments) ? form.interim_payments : []).map((ip, i) => (
            <div key={i} className="flex gap-2 mb-1 items-center">
              <span className="text-[10px] text-[#aaa] w-4">{i+1}.</span>
              <input type="number" placeholder="₼" value={ip.amount}
                onChange={e => { const arr = [...form.interim_payments]; arr[i] = {...arr[i], amount: e.target.value}; set('interim_payments', arr) }}
                className="flex-1 px-2 py-1 border border-[#e8e8e4] rounded text-xs focus:outline-none focus:border-[#0f172a]" />
              <select value={ip.method}
                onChange={e => { const arr = [...form.interim_payments]; arr[i] = {...arr[i], method: e.target.value}; set('interim_payments', arr) }}
                className="flex-1 px-2 py-1 border border-[#e8e8e4] rounded text-xs focus:outline-none focus:border-[#0f172a]">
                <option value="transfer">Köçürmə</option>
                <option value="cash">Nağd</option>
              </select>
              <input type="date" value={ip.date}
                onChange={e => { const arr = [...form.interim_payments]; arr[i] = {...arr[i], date: e.target.value}; set('interim_payments', arr) }}
                className="flex-1 px-2 py-1 border border-[#e8e8e4] rounded text-xs focus:outline-none focus:border-[#0f172a]" />
              <button onClick={() => set('interim_payments', form.interim_payments.filter((_, idx) => idx !== i))} className="text-[#aaa] hover:text-red-500 text-xs">✕</button>
            </div>
          ))}
          {/* Final ödəniş */}
          <div className="mt-2 pt-2 border-t border-[#e8e8e4]">
            <div className="text-[10px] font-medium text-[#555] mb-1.5">Final ödəniş</div>
            <div className="flex gap-2">
              <input type="number" placeholder="Məbləğ (₼)" value={form.final_payment}
                onChange={e => set('final_payment', e.target.value)}
                className="flex-1 px-2 py-1.5 border border-[#e8e8e4] rounded text-xs focus:outline-none focus:border-[#0f172a]" />
              <select value={form.final_payment_method} onChange={e => set('final_payment_method', e.target.value)}
                className="flex-1 px-2 py-1.5 border border-[#e8e8e4] rounded text-xs focus:outline-none focus:border-[#0f172a]">
                <option value="transfer">Köçürmə</option>
                <option value="cash">Nağd</option>
              </select>
              <input type="date" value={form.final_payment_date} onChange={e => set('final_payment_date', e.target.value)}
                className="flex-1 px-2 py-1.5 border border-[#e8e8e4] rounded text-xs focus:outline-none focus:border-[#0f172a]" />
            </div>
            {Number(form.final_payment) > 0 && (
              <div className={`mt-1.5 rounded p-1.5 text-[10px] ${form.final_payment_method === 'transfer' ? 'bg-amber-50' : 'bg-[#f5f5f0]'}`}>
                {form.final_payment_method === 'transfer'
                  ? `ƏDV xaric: ${fmt(Number(form.final_payment))} · ƏDV: ${fmt(edvCalc(Number(form.final_payment)))} · ƏDV daxil: ${fmt(withEdvCalc(Number(form.final_payment)))}`
                  : `Nağd · ${fmt(Number(form.final_payment))}`}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Qeyd</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none"
            placeholder="Əlavə qeydlər..." />
        </div>
        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto">
            {project ? 'Yadda saxla' : 'Əlavə et'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Kanban Card ──────────────────────────────────────────────
function KanbanCard({ project, onEdit, onDelete, isAdmin = true }) {
  const days = daysLeft(project.deadline)
  const dl = deadlineLabel(days, project.status)
  const pct = Math.min(100, Math.max(0, Number(project.completion_percent) || 0))

  return (
    <div className="bg-white border border-[#e8e8e4] rounded-lg p-3 mb-2 hover:border-[#0f172a] transition-colors cursor-pointer group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-[#0f172a] truncate">{project.name}</div>
          {project.clients?.name && (
            <div className="text-[10px] text-[#aaa] mt-0.5">{project.clients.name}</div>
          )}
        </div>
        {isAdmin && <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <button onClick={() => onEdit(project)} className="text-[#aaa] hover:text-[#0f172a] p-0.5">
            <IconEdit size={12} />
          </button>
          <button onClick={() => onDelete(project)} className="text-[#aaa] hover:text-red-500 p-0.5">
            <IconTrash size={12} />
          </button>
        </div>}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        {riskBadge(project.risk_level)}
        {phaseBadge(project.phases && project.phases.length > 0 ? project.phases : project.phase)}
      </div>

      {pct > 0 && (
        <div className="mb-2">
          <div className="flex justify-between text-[9px] text-[#aaa] mb-0.5">
            <span>Tamamlanma</span><span>{Math.round(pct)}%</span>
          </div>
          <div className="h-1 bg-[#f0f0ec] rounded-full">
            <div className="h-1 bg-[#0f172a] rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="border-t border-[#f5f5f0] pt-2 mt-1">
        {isAdmin && (
          project.payment_method === 'transfer' ? (
            <div className="flex items-center justify-between gap-1">
              <div className="text-center">
                <div className="text-[9px] text-[#aaa]">ƏDV xaric</div>
                <div className="text-[10px] font-bold text-[#0f172a]">{fmt(project.contract_value)}</div>
              </div>
              <div className="text-[9px] text-[#aaa]">+</div>
              <div className="text-center">
                <div className="text-[9px] text-[#aaa]">ƏDV 18%</div>
                <div className="text-[10px] font-bold text-amber-600">{fmt(edvCalc(project.contract_value))}</div>
              </div>
              <div className="text-[9px] text-[#aaa]">=</div>
              <div className="text-center">
                <div className="text-[9px] text-[#aaa]">Cəmi</div>
                <div className="text-[10px] font-bold text-green-600">{fmt(withEdvCalc(project.contract_value))}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[9px] text-[#aaa]">Nağd · ƏDV yoxdur</div>
                <div className="text-[10px] font-bold text-[#0f172a]">{fmt(project.contract_value)}</div>
              </div>
            </div>
          )
        )}
        {dl && (
          <div className="text-right mt-0.5">
            <span className={`text-[9px] font-medium ${dl.color}`}>{dl.text}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function LayihelerPage() {
  const { addToast } = useToast()
  const { isAdmin } = useAuth()
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('kanban')
  const [modalOpen, setModalOpen] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [deleteProject, setDeleteProject] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [pRes, cRes] = await Promise.all([
      supabase.from('projects').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name').order('name')
    ])
    setProjects(pRes.data || [])
    setClients(cRes.data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    const data = {
      name: form.name,
      client_id: form.client_id || null,
      contract_value: Number(form.contract_value) || 0,
      advance_paid: Number(form.advance_paid) || 0,
      advance_method: form.advance_method || 'transfer',
      interim_payments: form.interim_payments || [],
      edv_amount: form.payment_method === 'transfer' ? edvCalc(Number(form.contract_value) || 0) : 0,
      amount_with_edv: form.payment_method === 'transfer' ? withEdvCalc(Number(form.contract_value) || 0) : (Number(form.contract_value) || 0),
      status: form.status,
      risk_level: form.risk_level,
      phases: form.phases || [],
      phase: (form.phases || [])[0] || 'concept',
      final_payment: Number(form.final_payment) || 0,
      final_payment_method: form.final_payment_method || 'transfer',
      final_payment_date: form.final_payment_date || null,
      completion_percent: Number(form.completion_percent) || 0,
      deadline: form.deadline || null,
      start_date: form.start_date || null,
      payment_method: form.payment_method,
      vat_included: form.vat_included,
      notes: form.notes,
      next_action: form.next_action,
      blocker: form.blocker,
    }

    if (editProject) {
      const { error } = await supabase.from('projects').update(data).eq('id', editProject.id)
      if (error) { addToast('Xəta: ' + error.message, 'error'); console.error('UPDATE ERROR:', error); return }
      addToast('Layihə yeniləndi', 'success')
    } else {
      const { error } = await supabase.from('projects').insert(data)
      if (error) { addToast('Xəta: ' + error.message, 'error'); console.error('INSERT ERROR:', error); return }
      await notifyAll('Yeni layihə əlavə edildi', form.name?.trim() || 'Yeni layihə', 'info', '/layiheler')
      addToast('Layihə əlavə edildi', 'success')
    }

    setModalOpen(false)
    setEditProject(null)
    loadData()
  }

  async function handleDelete() {
    const { error } = await supabase.from('projects').delete().eq('id', deleteProject.id)
    if (error) { addToast('Xəta baş verdi', 'error'); return }
    addToast('Layihə silindi', 'success')
    setDeleteProject(null)
    loadData()
  }

  function openEdit(p) { setEditProject(p); setModalOpen(true) }
  function openNew() { setEditProject(null); setModalOpen(true) }

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter)

  const grouped = STATUSES.reduce((acc, s) => {
    acc[s.key] = projects.filter(p => p.status === s.key)
    return acc
  }, {})

  if (loading) return (
    <div className="p-6 space-y-3">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64" />)}
      </div>
    </div>
  )

  return (
    <div className="p-4 lg:p-6 fade-in">
      <PageHeader
        title="Layihələr"
        subtitle={`${projects.length} layihə · ${projects.filter(p => p.status === 'active').length} icrada`}
        action={
          <div className="flex items-center gap-2">
            <div className="flex border border-[#e8e8e4] rounded-lg overflow-hidden">
              <button onClick={() => setView('kanban')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'kanban' ? 'bg-[#0f172a] text-white' : 'text-[#555] hover:bg-[#f5f5f0]'}`}>
                <IconLayoutKanban size={14} />
              </button>
              <button onClick={() => setView('table')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'table' ? 'bg-[#0f172a] text-white' : 'text-[#555] hover:bg-[#f5f5f0]'}`}>
                <IconList size={14} />
              </button>
            </div>
            {isAdmin && (
              <Button onClick={openNew} size="sm">
                <IconPlus size={14} /> Yeni layihə
              </Button>
            )}
          </div>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 border-b border-[#e8e8e4]">
        {[{ key: 'all', label: 'Hamısı' }, ...STATUSES].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              filter === s.key ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#888] hover:text-[#555]'
            }`}>
            {s.label}
            <span className="ml-1.5 text-[10px] text-[#aaa]">
              {s.key === 'all' ? projects.length : projects.filter(p => p.status === s.key).length}
            </span>
          </button>
        ))}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={IconBuildings}
          title="Hələ layihə yoxdur"
          description="İlk layihəni əlavə edin — qrafiklər avtomatik dolacaq"
          action={isAdmin ? <Button onClick={openNew} size="sm"><IconPlus size={14} /> İlk layihəni əlavə et</Button> : null}
        />
      ) : view === 'kanban' ? (
        // KANBAN VIEW
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUSES.filter(status => filter === 'all' || filter === status.key).map(status => (
            <div key={status.key}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-[#555]">{status.label}</span>
                <span className="text-[10px] text-[#aaa] bg-[#f5f5f0] px-1.5 py-0.5 rounded-full">
                  {grouped[status.key]?.length || 0}
                </span>
              </div>
              <div className="min-h-24">
                {(grouped[status.key] || []).map(p => (
                  <KanbanCard key={p.id} project={p} onEdit={openEdit} onDelete={setDeleteProject} isAdmin={isAdmin} />
                ))}
                {isAdmin && (
                  <button onClick={openNew}
                    className="w-full py-2 text-[11px] text-[#bbb] hover:text-[#555] border border-dashed border-[#e8e8e4] hover:border-[#bbb] rounded-lg transition-colors">
                    + Əlavə et
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // TABLE VIEW
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e8e8e4]">
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Layihə</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Sifarişçi</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Mərhələ</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">Dəyər</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">Avans</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Deadline</th>
                  <th className="text-left px-4 py-3 font-medium text-[#888]">Risk</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const days = daysLeft(p.deadline)
                  return (
                    <tr key={p.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#0f172a]">{p.name}</div>
                        {p.next_action && <div className="text-[10px] text-[#aaa] mt-0.5 truncate max-w-48">{p.next_action}</div>}
                      </td>
                      <td className="px-4 py-3 text-[#555]">{p.clients?.name || '—'}</td>
                      <td className="px-4 py-3">{statusBadge(p.status)}</td>
                      <td className="px-4 py-3">{phaseBadge(p.phases && p.phases.length > 0 ? p.phases : p.phase)}</td>
                      {isAdmin && <td className="px-4 py-3 text-right">
                        <div className="font-medium text-[#0f172a]">{fmt(p.contract_value)}</div>
                        {p.payment_method === 'transfer' && (
                          <div className="text-[10px] text-green-600">{fmt(withEdvCalc(p.contract_value))} (ƏDV daxil)</div>
                        )}
                      </td>}
                      {isAdmin && <td className="px-4 py-3 text-right text-[#555]">{fmt(p.advance_paid)}</td>}
                      <td className="px-4 py-3">
                        {p.deadline ? (
                          <div>
                            <span className="font-medium text-[#555]">{new Date(p.deadline).toLocaleDateString('az-AZ')}</span>
                            {(() => { const dl2 = deadlineLabel(days, p.status); return dl2 ? <span className={`ml-1 text-[10px] ${dl2.color}`}>({dl2.text})</span> : null })()}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">{riskBadge(p.risk_level)}</td>
                      <td className="px-4 py-3">
                        {isAdmin && <div className="flex gap-1">
                          <button onClick={() => openEdit(p)} className="text-[#aaa] hover:text-[#0f172a] p-1 transition-colors">
                            <IconEdit size={13} />
                          </button>
                          <button onClick={() => setDeleteProject(p)} className="text-[#aaa] hover:text-red-500 p-1 transition-colors">
                            <IconTrash size={13} />
                          </button>
                        </div>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#f5f5f0]">
                  <td colSpan={4} className="px-4 py-2 text-xs font-medium text-[#555]">Cəmi ({filtered.length} layihə)</td>
                  {isAdmin && <td className="px-4 py-2 text-right text-xs">
                    <div className="font-bold text-[#0f172a]">{fmt(filtered.reduce((s, p) => s + Number(p.contract_value || 0), 0))}</div>
                    <div className="text-green-600">{fmt(filtered.reduce((s, p) => s + Number(p.amount_with_edv || p.contract_value || 0), 0))} (ƏDV daxil)</div>
                  </td>}
                  {isAdmin && <td className="px-4 py-2 text-right text-xs font-bold text-[#0f172a]">
                    {fmt(filtered.reduce((s, p) => s + Number(p.advance_paid || 0), 0))}
                  </td>}
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      <ProjectForm
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditProject(null) }}
        onSave={handleSave}
        project={editProject}
        clients={clients}
      />

      <ConfirmDialog
        open={!!deleteProject}
        title="Layihəni sil"
        message={`"${deleteProject?.name}" layihəsini silmək istədiyinizə əminsiniz? Bu əməliyyat geri alına bilməz.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteProject(null)}
        danger
      />
    </div>
  )
}
