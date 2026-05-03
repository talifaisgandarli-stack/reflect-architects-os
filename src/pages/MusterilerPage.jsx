import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { Button, Modal, ConfirmDialog, Skeleton } from '../components/ui'
import {
  IconPlus, IconX, IconEdit, IconLayoutKanban, IconList,
  IconPhone, IconMail, IconBuildings, IconChevronRight,
  IconSearch, IconUser, IconCurrencyManat, IconTrendingUp
} from '@tabler/icons-react'

// ─── Constants ───────────────────────────────────────────────────────────────
const STAGES = [
  { key: 'Lead',        label: 'Potensial',  color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', confidence: 0.10 },
  { key: 'Təklif',      label: 'Təklif',     color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', confidence: 0.30 },
  { key: 'Müzakirə',    label: 'Müzakirə',   color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', confidence: 0.50 },
  { key: 'İmzalanıb',   label: 'İmzalanıb',  color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', confidence: 0.75 },
  { key: 'İcrada',      label: 'İcrada',     color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', confidence: 0.95 },
  { key: 'Bitib',       label: 'Bitib',      color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', confidence: 1.0  },
  { key: 'Arxiv',       label: 'Arxiv',      color: '#71717a', bg: '#fafafa', border: '#e4e4e7', confidence: 0    },
  { key: 'İtirildi',    label: 'İtirildi',   color: '#ef4444', bg: '#fef2f2', border: '#fecaca', confidence: 0    },
]
const STAGE_ORDER = STAGES.map(s => s.key)
const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.key, s]))

const LOST_REASONS = [
  'Büdcə uyğun deyil',
  'Rəqib seçildi',
  'Layihə ləğv olundu',
  'Müştəri cavab vermir',
  'Digər',
]

// Map old status values to new pipeline_stage
function legacyToStage(status) {
  const map = { lead: 'Lead', proposal: 'Təklif', in_progress: 'İcrada', completed: 'Bitib', archived: 'Arxiv' }
  return map[status] || 'Lead'
}

function effectiveStage(c) {
  return c.pipeline_stage || legacyToStage(c.status)
}

function stageOf(key) { return STAGE_MAP[key] || STAGES[0] }

// ─── LostDialog ───────────────────────────────────────────────────────────────
function LostDialog({ open, client, onConfirm, onClose }) {
  const [reason, setReason] = useState(LOST_REASONS[0])
  const [note, setNote] = useState('')
  if (!open) return null
  return (
    <Modal open={open} onClose={onClose} title="Müştəri İtirildi">
      <div className="p-4 space-y-4">
        <p className="text-sm text-[#555]">
          <span className="font-medium text-[#0f172a]">"{client?.name}"</span> müştərisi üçün itirmə səbəbini seçin:
        </p>
        <div className="space-y-2.5">
          {LOST_REASONS.map(r => (
            <label key={r} className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="lost_reason" value={r} checked={reason === r}
                onChange={() => setReason(r)} className="w-4 h-4 accent-[#ef4444]" />
              <span className={`text-sm ${reason === r ? 'text-[#0f172a] font-medium' : 'text-[#555]'}`}>{r}</span>
            </label>
          ))}
        </div>
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Qısa qeyd (isteğe bağlı)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none" />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border border-[#e8e8e4] rounded-lg text-[#555] hover:bg-[#f5f5f0] transition-colors">
            Geri
          </button>
          <button onClick={() => onConfirm(reason, note)}
            className="flex-1 px-4 py-2 text-sm bg-[#ef4444] text-white rounded-lg hover:bg-[#dc2626] transition-colors font-medium">
            İtirildi kimi işarələ
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── AdminOverrideDialog ──────────────────────────────────────────────────────
function AdminOverrideDialog({ open, client, toStage, onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  if (!open) return null
  const st = stageOf(toStage)
  return (
    <Modal open={open} onClose={onClose} title="Admin: Mərhələ atla">
      <div className="p-4 space-y-4">
        <p className="text-sm text-[#555]">
          <span className="font-medium text-[#0f172a]">"{client?.name}"</span> müştərisini
          birbaşa <span className="font-medium" style={{color: st.color}}>{st.label}</span> mərhələsinə köçürmək istəyirsiniz.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
          Mərhələ atlamaq yalnız admin icazəsidir. Səbəb qeyd edin.
        </div>
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Səbəb *</label>
          <input value={reason} onChange={e => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="Override səbəbi daxil edin" />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border border-[#e8e8e4] rounded-lg text-[#555] hover:bg-[#f5f5f0] transition-colors">
            Ləğv et
          </button>
          <button disabled={!reason.trim()} onClick={() => reason.trim() && onConfirm(reason)}
            className="flex-1 px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
            Köçür
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── ClientForm ────────────────────────────────────────────────────────────────
function ClientForm({ open, onClose, onSave, client }) {
  const [form, setForm] = useState({
    name: '', contact_person: '', phone: '', email: '',
    address: '', project_type: '', notes: '',
    expected_value: '', pipeline_stage: 'Lead',
  })
  useEffect(() => {
    if (client) {
      setForm({
        name: client.name || '', contact_person: client.contact_person || '',
        phone: client.phone || '', email: client.email || '',
        address: client.address || '', project_type: client.project_type || '',
        notes: client.notes || '', expected_value: client.expected_value || '',
        pipeline_stage: effectiveStage(client),
      })
    } else {
      setForm({ name: '', contact_person: '', phone: '', email: '', address: '', project_type: '', notes: '', expected_value: '', pipeline_stage: 'Lead' })
    }
  }, [client, open])
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function handleSave() {
    if (!form.name.trim()) return
    onSave({ ...form, expected_value: form.expected_value ? parseFloat(form.expected_value) : null })
  }
  return (
    <Modal open={open} onClose={onClose} title={client ? 'Müştərini redaktə et' : 'Yeni müştəri'}>
      <div className="space-y-3 p-1">
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Şirkət / Ad *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="Müştəri adı" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Əlaqə şəxsi</label>
            <input value={form.contact_person} onChange={e => set('contact_person', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="Ad Soyad" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Telefon</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="+994 50 000 00 00" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Email</label>
            <input value={form.email} onChange={e => set('email', e.target.value)} type="email"
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Gözlənilən dəyər (₼)</label>
            <input value={form.expected_value} onChange={e => set('expected_value', e.target.value)} type="number"
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="50000" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Layihə növü</label>
            <input value={form.project_type} onChange={e => set('project_type', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" placeholder="Yaşayış, Kommersiya..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Mərhələ</label>
            <select value={form.pipeline_stage} onChange={e => set('pipeline_stage', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] bg-white">
              {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Qeyd</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none" placeholder="Əlavə məlumat..." />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border border-[#e8e8e4] rounded-lg text-[#555] hover:bg-[#f5f5f0] transition-colors">
            Ləğv et
          </button>
          <button onClick={handleSave} disabled={!form.name.trim()}
            className="flex-1 px-4 py-2 text-sm bg-[#0f172a] text-white rounded-lg hover:bg-[#1e293b] transition-colors font-medium disabled:opacity-50">
            {client ? 'Yadda saxla' : 'Əlavə et'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── ClientCard (Kanban) ───────────────────────────────────────────────────────
function ClientCard({ client, projects, onClick, onDragStart, onDragEnd, isDragging }) {
  const stage = stageOf(effectiveStage(client))
  const clientProjects = projects.filter(p => p.client_id === client.id)
  const totalValue = clientProjects.reduce((s, p) => s + (p.contract_value || 0), 0)
  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
      onClick={onClick}
      className={`bg-white border rounded-xl p-3 cursor-pointer hover:shadow-md transition-all select-none ${isDragging ? 'opacity-40 shadow-lg' : 'shadow-sm'}`}
      style={{ borderColor: stage.border }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-semibold text-[#0f172a] leading-tight line-clamp-2">{client.name}</p>
        {client.expected_value && (
          <span className="text-[9px] font-bold text-[#22c55e] bg-green-50 px-1.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
            ₼{Number(client.expected_value).toLocaleString()}
          </span>
        )}
      </div>
      {client.contact_person && (
        <p className="text-[10px] text-[#888] mb-1.5 flex items-center gap-1">
          <IconUser size={10} className="flex-shrink-0" />{client.contact_person}
        </p>
      )}
      {client.project_type && (
        <p className="text-[9px] text-[#aaa]">{client.project_type}</p>
      )}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#f5f5f0]">
        <span className="text-[9px] text-[#aaa]">
          {clientProjects.length} layihə{totalValue > 0 ? ` · ₼${Number(totalValue).toLocaleString()}` : ''}
        </span>
        {stage.confidence > 0 && (
          <span className="text-[9px] font-bold" style={{ color: stage.color }}>
            {Math.round(stage.confidence * 100)}%
          </span>
        )}
      </div>
    </div>
  )
}

// ─── DetailPanel ──────────────────────────────────────────────────────────────
function DetailPanel({ client, projects, stageHistory, onClose, onEdit, onStageChange }) {
  const stage = stageOf(effectiveStage(client))
  const clientProjects = projects.filter(p => p.client_id === client.id)
  const totalRevenue = clientProjects.reduce((s, p) => s + (p.contract_value || 0), 0)

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col z-50 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e8e4]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: stage.bg, border: `1px solid ${stage.border}` }}>
            <IconBuildings size={16} style={{ color: stage.color }} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[#0f172a] truncate">{client.name}</h2>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: stage.bg, color: stage.color }}>{stage.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-[#f5f5f0] transition-colors text-[#555]">
            <IconEdit size={14} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f5f0] transition-colors text-[#555]">
            <IconX size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 px-5 py-4 border-b border-[#f5f5f0]">
          <div className="text-center">
            <p className="text-sm font-bold text-[#0f172a]">{clientProjects.length}</p>
            <p className="text-[9px] text-[#aaa] mt-0.5">Layihə</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-[#0f172a]">₼{totalRevenue > 0 ? Number(totalRevenue).toLocaleString() : '—'}</p>
            <p className="text-[9px] text-[#aaa] mt-0.5">Cəmi dəyər</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-[#0f172a]">{client.expected_value ? `₼${Number(client.expected_value).toLocaleString()}` : '—'}</p>
            <p className="text-[9px] text-[#aaa] mt-0.5">Gözlənilən</p>
          </div>
        </div>

        {/* Contact info */}
        <div className="px-5 py-4 border-b border-[#f5f5f0] space-y-2">
          <h3 className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-3">Əlaqə</h3>
          {client.contact_person && (
            <div className="flex items-center gap-2 text-xs text-[#555]">
              <IconUser size={13} className="text-[#aaa] flex-shrink-0" />{client.contact_person}
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-xs text-[#555]">
              <IconPhone size={13} className="text-[#aaa] flex-shrink-0" />{client.phone}
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-2 text-xs text-[#555]">
              <IconMail size={13} className="text-[#aaa] flex-shrink-0" />{client.email}
            </div>
          )}
          {client.project_type && (
            <div className="flex items-center gap-2 text-xs text-[#555]">
              <IconBuildings size={13} className="text-[#aaa] flex-shrink-0" />{client.project_type}
            </div>
          )}
          {!client.contact_person && !client.phone && !client.email && (
            <p className="text-xs text-[#bbb]">Əlaqə məlumatı yoxdur</p>
          )}
        </div>

        {/* Stage change */}
        <div className="px-5 py-4 border-b border-[#f5f5f0]">
          <h3 className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-3">Mərhələ dəyiş</h3>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map(s => (
              <button key={s.key}
                onClick={() => onStageChange(client, s.key)}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-all font-medium ${effectiveStage(client) === s.key ? 'shadow-sm' : 'opacity-60 hover:opacity-100'}`}
                style={{ background: s.bg, color: s.color, borderColor: s.border }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stage history */}
        {stageHistory.length > 0 && (
          <div className="px-5 py-4 border-b border-[#f5f5f0]">
            <h3 className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-3">Tarixçə</h3>
            <div className="space-y-2">
              {stageHistory.slice(0, 5).map(h => (
                <div key={h.id} className="flex items-center gap-2 text-[10px] text-[#555]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#e2e8f0] flex-shrink-0" />
                  <span className="text-[#aaa]">{new Date(h.changed_at).toLocaleDateString('az-AZ')}</span>
                  <span>{h.from_stage || '—'}</span>
                  <IconChevronRight size={10} className="text-[#aaa]" />
                  <span className="font-medium" style={{ color: stageOf(h.to_stage)?.color }}>{h.to_stage}</span>
                  {h.notes && <span className="text-[#aaa] truncate">· {h.notes}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        <div className="px-5 py-4">
          <h3 className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-3">Layihələr ({clientProjects.length})</h3>
          {clientProjects.length === 0 ? (
            <p className="text-xs text-[#bbb]">Layihə yoxdur</p>
          ) : (
            <div className="space-y-2">
              {clientProjects.map(p => (
                <div key={p.id} className="flex items-center justify-between px-3 py-2.5 bg-[#fafaf8] rounded-xl border border-[#f5f5f0]">
                  <div>
                    <p className="text-xs font-medium text-[#0f172a]">{p.name}</p>
                    <p className="text-[9px] text-[#aaa] mt-0.5 capitalize">{p.status} · {p.phase}</p>
                  </div>
                  {p.contract_value > 0 && (
                    <span className="text-[10px] font-bold text-[#0f172a]">₼{Number(p.contract_value).toLocaleString()}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {client.notes && (
          <div className="px-5 pb-6">
            <h3 className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-2">Qeyd</h3>
            <p className="text-xs text-[#555] leading-relaxed">{client.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MusterilerPage() {
  const { addToast } = useToast()
  const { isAdmin } = useAuth()

  const [clients,      setClients]      = useState([])
  const [projects,     setProjects]     = useState([])
  const [stageHistory, setStageHistory] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [view,         setView]         = useState('kanban')
  const [search,       setSearch]       = useState('')
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editClient,   setEditClient]   = useState(null)
  const [deleteClient, setDeleteClient] = useState(null)
  const [detailClient, setDetailClient] = useState(null)
  const [lostDialog,   setLostDialog]   = useState(null)   // { client, toStage }
  const [overrideDialog, setOverrideDialog] = useState(null) // { client, toStage }

  // Drag state
  const [dragId,     setDragId]     = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: c }, { data: p }, { data: h }] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id,name,client_id,contract_value,status,phase').order('created_at', { ascending: false }),
      supabase.from('client_stage_history').select('*').order('changed_at', { ascending: false }),
    ])
    setClients(c || [])
    setProjects(p || [])
    setStageHistory(h || [])
    setLoading(false)
  }

  async function handleSave(form) {
    const payload = {
      name: form.name, contact_person: form.contact_person, phone: form.phone,
      email: form.email, address: form.address, project_type: form.project_type,
      notes: form.notes, expected_value: form.expected_value,
      pipeline_stage: form.pipeline_stage,
    }
    if (editClient) {
      const { data, error } = await supabase.from('clients').update(payload).eq('id', editClient.id).select().single()
      if (error) { addToast('Xəta baş verdi', 'error'); return }
      setClients(prev => prev.map(c => c.id === editClient.id ? data : c))
      if (detailClient?.id === editClient.id) setDetailClient(data)
      addToast('Müştəri yeniləndi', 'success')
    } else {
      const { data, error } = await supabase.from('clients').insert(payload).select().single()
      if (error) { addToast('Xəta baş verdi', 'error'); return }
      setClients(prev => [data, ...prev])
      addToast('Müştəri əlavə edildi', 'success')
    }
    setModalOpen(false)
    setEditClient(null)
  }

  async function handleDelete() {
    const { error } = await supabase.from('clients').delete().eq('id', deleteClient.id)
    if (error) { addToast('Silinə bilmədi', 'error'); return }
    setClients(prev => prev.filter(c => c.id !== deleteClient.id))
    if (detailClient?.id === deleteClient.id) setDetailClient(null)
    addToast('Müştəri silindi', 'info')
    setDeleteClient(null)
  }

  async function _doStageChange(client, toStage, notes = null) {
    const fromStage = effectiveStage(client)
    const updated = { pipeline_stage: toStage }
    if (toStage === 'İtirildi') updated.lost_reason = notes
    if (toStage === 'Arxiv') updated.archived_at = new Date().toISOString()

    setClients(prev => prev.map(c => c.id === client.id ? { ...c, ...updated } : c))
    if (detailClient?.id === client.id) setDetailClient(prev => ({ ...prev, ...updated }))

    const { error } = await supabase.from('clients').update(updated).eq('id', client.id)
    if (error) {
      setClients(prev => prev.map(c => c.id === client.id ? client : c))
      addToast('Xəta baş verdi', 'error'); return
    }

    // Log to stage history
    const { data: histRow } = await supabase.from('client_stage_history').insert({
      client_id: client.id, from_stage: fromStage, to_stage: toStage, notes,
    }).select().single()
    if (histRow) setStageHistory(prev => [histRow, ...prev])
    addToast(`${stageOf(toStage).label} mərhələsinə keçirildi`, 'success')
  }

  async function handleStageChange(client, toStage) {
    const currentStage = effectiveStage(client)
    if (currentStage === toStage) return

    const fromIdx = STAGE_ORDER.indexOf(currentStage)
    const toIdx   = STAGE_ORDER.indexOf(toStage)
    const isSkipping = Math.abs(toIdx - fromIdx) > 1 && toStage !== 'İtirildi' && toStage !== 'Arxiv'

    if (toStage === 'İtirildi') {
      setLostDialog({ client, toStage })
      return
    }
    if (isSkipping && !isAdmin) {
      addToast('Mərhələ atlamaq qadağandır', 'error')
      return
    }
    if (isSkipping && isAdmin) {
      setOverrideDialog({ client, toStage })
      return
    }
    await _doStageChange(client, toStage)
  }

  // Weighted pipeline value
  const weightedPipeline = clients.reduce((sum, c) => {
    const s = stageOf(effectiveStage(c))
    return sum + ((c.expected_value || 0) * (s.confidence || 0))
  }, 0)

  const filtered = clients.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) ||
      (c.contact_person || '').toLowerCase().includes(q) ||
      (c.project_type || '').toLowerCase().includes(q)
  })

  const byStage = Object.fromEntries(STAGES.map(s => [s.key, filtered.filter(c => effectiveStage(c) === s.key)]))

  // ── Drag handlers ──
  function handleDragStart(clientId) { setDragId(clientId) }
  function handleDragEnd() { setDragId(null); setDragOverCol(null) }
  async function handleDrop(toStage) {
    if (!dragId) return
    const client = clients.find(c => c.id === dragId)
    if (!client) return
    setDragOverCol(null)
    await handleStageChange(client, toStage)
    setDragId(null)
  }

  const detailHistory = stageHistory.filter(h => h.client_id === detailClient?.id)

  return (
    <div className="flex flex-col h-full bg-[#f9f9f7]">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-[#e8e8e4] bg-white">
        <div>
          <h1 className="text-lg font-bold text-[#0f172a]">Müştərilər</h1>
          <p className="text-[10px] text-[#aaa] mt-0.5">
            {clients.length} müştəri
            {weightedPipeline > 0 && (
              <span className="ml-2 text-[#22c55e] font-medium">· Pipeline: ₼{Math.round(weightedPipeline).toLocaleString()}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <IconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#bbb]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Axtar..."
              className="pl-7 pr-3 py-1.5 text-xs border border-[#e8e8e4] rounded-lg focus:outline-none focus:border-[#0f172a] w-40" />
          </div>
          {/* View toggle */}
          <div className="flex border border-[#e8e8e4] rounded-lg overflow-hidden">
            <button onClick={() => setView('kanban')} className={`px-2.5 py-1.5 transition-colors ${view==='kanban'?'bg-[#0f172a] text-white':'text-[#555] hover:bg-[#f5f5f0]'}`}><IconLayoutKanban size={14}/></button>
            <button onClick={() => setView('list')}   className={`px-2.5 py-1.5 transition-colors ${view==='list'  ?'bg-[#0f172a] text-white':'text-[#555] hover:bg-[#f5f5f0]'}`}><IconList size={14}/></button>
          </div>
          <Button onClick={() => { setEditClient(null); setModalOpen(true) }} size="sm">
            <IconPlus size={14} /><span className="hidden sm:inline">Yeni müştəri</span>
          </Button>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex-1 p-6">
          <div className="flex gap-3 overflow-hidden">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="w-64 flex-shrink-0 space-y-3">
                <Skeleton className="h-5 w-24 rounded" />
                {[1,2].map(j => <Skeleton key={j} className="h-24 rounded-xl" />)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Kanban ── */}
      {!loading && view === 'kanban' && (
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="flex gap-3 h-full" style={{ minWidth: STAGES.length * 260 + 'px' }}>
            {STAGES.map(stage => {
              const colClients = byStage[stage.key] || []
              const isDragTarget = dragOverCol === stage.key
              return (
                <div key={stage.key}
                  className={`flex flex-col rounded-2xl transition-colors ${isDragTarget ? 'ring-2 ring-offset-1' : ''}`}
                  style={{ width: 240, minWidth: 240, background: isDragTarget ? stage.bg : 'transparent', ringColor: stage.color }}
                  onDragOver={e => { e.preventDefault(); setDragOverCol(stage.key) }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={() => handleDrop(stage.key)}>
                  {/* Column header */}
                  <div className="flex items-center gap-2 px-2 py-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                    <span className="text-xs font-semibold text-[#0f172a]">{stage.label}</span>
                    <span className="text-[9px] text-white font-bold px-1.5 py-0.5 rounded-full ml-auto" style={{ background: stage.color }}>
                      {colClients.length}
                    </span>
                    {stage.confidence > 0 && (
                      <span className="text-[9px] text-[#aaa]">{Math.round(stage.confidence*100)}%</span>
                    )}
                  </div>
                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto space-y-2 min-h-[120px] px-1 pb-2">
                    {colClients.map(client => (
                      <ClientCard key={client.id} client={client} projects={projects}
                        onClick={() => setDetailClient(client)}
                        isDragging={dragId === client.id}
                        onDragStart={() => handleDragStart(client.id)}
                        onDragEnd={handleDragEnd} />
                    ))}
                    {colClients.length === 0 && (
                      <div className={`h-16 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors ${isDragTarget ? 'border-current' : 'border-[#e8e8e4]'}`}
                        style={{ borderColor: isDragTarget ? stage.color : undefined }}>
                        <span className="text-[9px] text-[#bbb]">Boş</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── List ── */}
      {!loading && view === 'list' && (
        <div className="flex-1 overflow-auto px-4 lg:px-6 py-4">
          <div className="bg-white border border-[#e8e8e4] rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e8e8e4] bg-[#fafaf8]">
                  <th className="text-left py-3 px-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Müştəri</th>
                  <th className="text-left py-3 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider hidden md:table-cell">Əlaqə</th>
                  <th className="text-left py-3 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Mərhələ</th>
                  <th className="text-left py-3 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider hidden lg:table-cell">Gözlənilən</th>
                  <th className="text-left py-3 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider hidden lg:table-cell">Layihə növü</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-xs text-[#bbb]">Müştəri yoxdur</td></tr>
                ) : filtered.map(client => {
                  const stage = stageOf(effectiveStage(client))
                  const clientProjects = projects.filter(p => p.client_id === client.id)
                  return (
                    <tr key={client.id}
                      className="border-b border-[#f5f5f0] hover:bg-[#fafaf8] cursor-pointer"
                      onClick={() => setDetailClient(client)}>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#0f172a]">{client.name}</div>
                        {clientProjects.length > 0 && (
                          <div className="text-[9px] text-[#aaa] mt-0.5">{clientProjects.length} layihə</div>
                        )}
                      </td>
                      <td className="py-3 pr-4 hidden md:table-cell">
                        {client.contact_person && <div className="text-[#555]">{client.contact_person}</div>}
                        {client.phone && <div className="text-[#aaa] text-[10px]">{client.phone}</div>}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: stage.bg, color: stage.color }}>
                          {stage.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 hidden lg:table-cell">
                        {client.expected_value ? (
                          <span className="text-xs font-semibold text-[#0f172a]">₼{Number(client.expected_value).toLocaleString()}</span>
                        ) : <span className="text-[#ddd]">—</span>}
                      </td>
                      <td className="py-3 pr-4 hidden lg:table-cell text-[#888]">
                        {client.project_type || <span className="text-[#ddd]">—</span>}
                      </td>
                      <td className="py-3 pr-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setEditClient(client); setModalOpen(true) }}
                          className="p-1.5 rounded-lg hover:bg-[#f5f5f0] text-[#aaa] hover:text-[#555] transition-colors">
                          <IconEdit size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Detail panel ── */}
      {detailClient && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setDetailClient(null)} />
          <DetailPanel
            client={detailClient}
            projects={projects}
            stageHistory={detailHistory}
            onClose={() => setDetailClient(null)}
            onEdit={() => { setEditClient(detailClient); setModalOpen(true) }}
            onStageChange={handleStageChange} />
        </>
      )}

      <ClientForm open={modalOpen} onClose={() => { setModalOpen(false); setEditClient(null) }}
        onSave={handleSave} client={editClient} />
      <ConfirmDialog open={!!deleteClient} title="Müştərini sil"
        message={`"${deleteClient?.name}" müştərisini silmək istədiyinizə əminsiniz? Bağlı layihə məlumatları qalmaqda davam edəcək.`}
        onConfirm={handleDelete} onCancel={() => setDeleteClient(null)} danger />
      <LostDialog open={!!lostDialog} client={lostDialog?.client}
        onConfirm={async (reason, note) => { await _doStageChange(lostDialog.client, 'İtirildi', `${reason}${note ? ' — ' + note : ''}`); setLostDialog(null) }}
        onClose={() => setLostDialog(null)} />
      <AdminOverrideDialog open={!!overrideDialog} client={overrideDialog?.client} toStage={overrideDialog?.toStage}
        onConfirm={async (reason) => { await _doStageChange(overrideDialog.client, overrideDialog.toStage, reason); setOverrideDialog(null) }}
        onClose={() => setOverrideDialog(null)} />
    </div>
  )
}
