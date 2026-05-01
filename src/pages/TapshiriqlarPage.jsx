import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { Button, Modal, ConfirmDialog, Skeleton } from '../components/ui'
import { notify } from '../lib/notify'
import { logActivity } from '../lib/logActivity'
import {
  IconPlus, IconX, IconEdit, IconTrash, IconCheck, IconSend,
  IconLayoutKanban, IconList, IconSearch, IconArchive,
  IconCalendar, IconFlag, IconChevronDown, IconMessage,
  IconAlertCircle, IconAt, IconClock, IconHistory
} from '@tabler/icons-react'

// ─── Constants ───────────────────────────────────── v2.1───────────────────────────
const COLUMNS = [
  { key: 'not_started', label: 'Başlanmayıb', color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0' },
  { key: 'in_progress',  label: 'İcrada',      color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'review',       label: 'Yoxlanılır',  color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { key: 'done',         label: 'Tamamlandı',  color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
]
const PRIORITIES = [
  { key: 'high',   label: 'Kritik', color: '#ef4444', bg: '#fef2f2' },
  { key: 'medium', label: 'Orta',   color: '#f59e0b', bg: '#fffbeb' },
  { key: 'low',    label: 'Aşağı',  color: '#94a3b8', bg: '#f8fafc' },
]

const TASK_TAGS = [
  { key: 'BD', label: 'BD', color: '#0369a1', bg: '#dbeafe', text: '#0369a1' },
]
const PROJECT_COLORS = ['#0f172a','#1d4ed8','#059669','#d97706','#7c3aed','#db2777','#0891b2','#16a34a']

const prio    = k => PRIORITIES.find(p => p.key === k) || PRIORITIES[1]
const col     = k => COLUMNS.find(c => c.key === k)   || COLUMNS[0]
const projClr = (id, projects) => PROJECT_COLORS[projects.findIndex(p => p.id === id) % PROJECT_COLORS.length] || '#0f172a'

function daysLeft(due) {
  if (!due) return null
  const t = new Date(); t.setHours(0,0,0,0)
  const d = new Date(due); d.setHours(0,0,0,0)
  return Math.floor((d - t) / 86400000)
}

function Avatar({ name='?', size=6 }) {
  const initials = name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
  const sz = { 5:'w-5 h-5', 6:'w-6 h-6', 7:'w-7 h-7', 8:'w-8 h-8' }[size] || 'w-6 h-6'
  const fs = { 5:'7px', 6:'9px', 7:'10px', 8:'11px' }[size] || '9px'
  return (
    <div className={`${sz} rounded-full bg-[#0f172a] flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold" style={{fontSize:fs}}>{initials}</span>
    </div>
  )
}

function MentionInput({ value, onChange, onMentionsChange, members, placeholder, rows=1, className='' }) {
  const [show, setShow] = useState(false)
  const [query, setQuery] = useState('')
  const [mentionIds, setMentionIds] = useState([])
  const ref = useRef(null)

  function handleChange(e) {
    const v = e.target.value
    onChange(v)
    // If text was cleared, reset tracked mentions
    if (!v.trim()) {
      setMentionIds([])
      onMentionsChange?.([])
    }
    const lastAt = v.lastIndexOf('@')
    if (lastAt === -1) { setShow(false); return }
    const afterAt = v.slice(lastAt + 1)
    if (lastAt === v.length - 1) { setShow(true); setQuery(''); return }
    if (!afterAt.includes(' ') || afterAt.length < 30) {
      setShow(true)
      setQuery(afterAt)
    } else {
      setShow(false)
    }
  }

  function pick(m) {
    const lastAt = value.lastIndexOf('@')
    onChange(value.slice(0, lastAt) + '@' + m.full_name + ' ')
    setShow(false)
    setQuery('')
    // Track picked user by ID — stable, independent of name changes
    const updated = mentionIds.includes(m.id) ? mentionIds : [...mentionIds, m.id]
    setMentionIds(updated)
    onMentionsChange?.(updated)
    ref.current?.focus()
  }

  const filtered = query.length === 0
    ? members.slice(0, 6)
    : members.filter(m => m.full_name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)

  return (
    <div className="relative flex-1">
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={e => { if (e.key === 'Escape') setShow(false) }}
        rows={rows}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-[#e8e8e4] rounded-xl text-xs focus:outline-none focus:border-[#0f172a] resize-none leading-relaxed ${className}`}
      />
      {show && filtered.length > 0 && (
        <div className="absolute bottom-full mb-1 left-0 bg-white border border-[#e8e8e4] rounded-xl shadow-lg overflow-hidden z-50 w-56">
          <div className="px-3 py-1.5 border-b border-[#f0f0ec]">
            <span className="text-[10px] text-[#aaa] font-medium">Komanda üzvü seçin</span>
          </div>
          {filtered.map(m => (
            <button key={m.id} onClick={() => pick(m)} type="button"
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#f5f5f0] text-left transition-colors">
              <Avatar name={m.full_name} size={5} />
              <span className="text-xs text-[#333]">{m.full_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Inline Quick-Add (Trello style) ─────────────────────────────────────────
function QuickAdd({ status, projects, members, onSave, onCancel }) {
  const [title,      setTitle]      = useState('')
  const [projId,     setProjId]     = useState('')
  const [assignees,  setAssignees]  = useState([])
  const [due,        setDue]        = useState('')
  const [errors,     setErrors]     = useState({})
  const ref = useRef(null)
  useEffect(() => { ref.current?.focus() }, [])

  function toggleAssignee(id) {
    setAssignees(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
    setErrors(v => ({...v, assignee: false}))
  }

  function save() {
    const errs = {}
    if (!title.trim())       errs.title    = true
    if (!assignees.length)   errs.assignee = true
    if (!due)                errs.due      = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({
      title: title.trim(), status,
      project_id:   projId || null,
      assignee_ids: assignees,
      assignee_id:  assignees[0] || null,
      priority: 'medium', due_date: due, description: null
    })
  }

  return (
    <div className="bg-white rounded-xl border-2 border-[#0f172a] shadow-lg p-3 space-y-2">
      <textarea ref={ref} value={title} onChange={e => { setTitle(e.target.value); setErrors(v=>({...v,title:false})) }}
        onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();save()} if(e.key==='Escape')onCancel() }}
        rows={2} placeholder="Tapşırıq adı..."
        className={`w-full text-xs text-[#0f172a] outline-none resize-none leading-relaxed placeholder-[#ccc] ${errors.title?'placeholder-red-400':''}`} />

      <select value={projId} onChange={e => setProjId(e.target.value)}
        className="w-full text-[10px] px-2 py-1.5 border border-[#f0f0ec] rounded-lg outline-none text-[#888] bg-[#fafafa]">
        <option value="">Layihə seçin...</option>
        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      {/* Multi-select cavabdeh */}
      <div>
        <div className={`flex flex-wrap gap-1 p-1.5 border rounded-lg bg-[#fafafa] ${errors.assignee ? 'border-red-400' : 'border-[#f0f0ec]'}`}>
          {members.map(m => (
            <button key={m.id} type="button" onClick={() => toggleAssignee(m.id)}
              className={`text-[10px] px-2 py-1 rounded-full font-medium border transition-all ${
                assignees.includes(m.id)
                  ? 'bg-[#0f172a] text-white border-[#0f172a]'
                  : 'border-[#e0e0e0] text-[#555] bg-white hover:border-[#0f172a]'
              }`}>
              {m.full_name.split(' ')[0]}
            </button>
          ))}
        </div>
        {errors.assignee && <p className="text-[10px] text-red-500 mt-0.5">⚠ Cavabdeh seçin</p>}
        {assignees.length > 0 && <p className="text-[10px] text-[#888] mt-0.5">{assignees.length} nəfər seçildi</p>}
      </div>

      <input type="date" value={due} onChange={e => { setDue(e.target.value); setErrors(v=>({...v,due:false})) }}
        className={`w-full text-[10px] px-2 py-1.5 border rounded-lg outline-none ${errors.due ? 'border-red-400 bg-red-50 text-red-600' : 'border-[#f0f0ec] bg-[#fafafa] text-[#888]'}`} />
      {errors.due && <p className="text-[10px] text-red-500 -mt-1">⚠ Deadline məcburidir</p>}

      <div className="flex gap-1.5">
        <button onClick={save}
          className="flex-1 py-1.5 bg-[#0f172a] text-white text-[10px] font-semibold rounded-lg hover:bg-[#1e293b] transition-colors">
          Əlavə et
        </button>
        <button onClick={onCancel}
          className="w-7 h-7 flex items-center justify-center text-[#aaa] hover:text-[#555] rounded-lg hover:bg-[#f5f5f0] transition-colors">
          <IconX size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── Task Form (full) ─────────────────────────────────────────────────────────
function TaskForm({ open, onClose, onSave, task, projects, members, defaultStatus }) {
  const { isAdmin } = useAuth()
  const [form, setForm] = useState({ title:'', description:'', project_id:'', assignee_ids:[], status: defaultStatus||'not_started', priority:'medium', due_date:'', tags:[], is_hidden:false })
  useEffect(() => {
    if (task) setForm({ title:task.title||'', description:task.description||'', project_id:task.project_id||'', assignee_ids:task.assignee_ids||[], status:task.status||'not_started', priority:task.priority||'medium', due_date:task.due_date||'', tags:task.tags||[], is_hidden:task.is_hidden||false })
    else setForm({ title:'', description:'', project_id:'', assignee_ids:[], status:defaultStatus||'not_started', priority:'medium', due_date:'', tags:[], is_hidden:false })
  }, [task, open, defaultStatus])
  const [formErrors, setFormErrors] = useState([])
  const set = (k,v) => setForm(f => ({...f,[k]:v}))
  return (
    <Modal open={open} onClose={onClose} title={task ? 'Tapşırığı redaktə et' : 'Yeni tapşırıq'}>
      <div className="space-y-3">
        <input value={form.title} onChange={e => set('title', e.target.value)} autoFocus
          className="w-full px-3 py-2.5 border border-[#e8e8e4] rounded-xl text-sm font-medium focus:outline-none focus:border-[#0f172a] placeholder-[#ccc]"
          placeholder="Tapşırıq adı..." />
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Layihə','project_id', projects.map(p=>({v:p.id,l:p.name}))],
            ['Status','status', COLUMNS.map(c=>({v:c.key,l:c.label}))],
            ['Prioritet','priority', PRIORITIES.map(p=>({v:p.key,l:p.label}))],
          ].map(([label, key, opts]) => (
            <div key={key}>
              <label className="block text-[10px] font-semibold text-[#888] uppercase tracking-wider mb-1">{label}</label>
              <select value={form[key]} onChange={e => set(key, e.target.value)}
                className="w-full px-2.5 py-2 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none focus:border-[#0f172a]">
                <option value="">— seçin</option>
                {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          ))}
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-[#888] uppercase tracking-wider mb-1">Cavabdeh şəxslər <span className="text-red-400">*</span></label>
            <div className="flex flex-wrap gap-1.5 p-2 border border-[#e8e8e4] rounded-lg max-h-24 overflow-y-auto">
              {members.map(m => {
                const sel = (form.assignee_ids||[]).includes(m.id)
                return (
                  <button key={m.id} type="button"
                    onClick={() => set('assignee_ids', sel ? (form.assignee_ids||[]).filter(x=>x!==m.id) : [...(form.assignee_ids||[]), m.id])}
                    className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border font-medium transition-all ${sel ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'border-[#e8e8e4] text-[#555] hover:border-[#0f172a]'}`}>
                    {m.full_name.split(' ')[0]}
                  </button>
                )
              })}
            </div>
            {(form.assignee_ids||[]).length > 0 && (
              <p className="text-[10px] text-[#888] mt-1">{(form.assignee_ids||[]).length} nəfər seçildi</p>
            )}
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-[#888] uppercase tracking-wider mb-1">
              Deadline <span className="text-red-400">*</span>
            </label>
            <input type="date" value={form.due_date} onChange={e => { set('due_date', e.target.value); setFormErrors([]) }}
              className={`w-full px-2.5 py-2 border rounded-lg text-xs focus:outline-none focus:border-[#0f172a] ${!form.due_date && formErrors.length ? 'border-red-400 bg-red-50' : 'border-[#e8e8e4]'}`} />
          </div>
        </div>
        {/* Tags */}
        <div>
          <label className="block text-[10px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">Taglər</label>
          <div className="flex gap-2 flex-wrap">
            {TASK_TAGS.map(tag => (
              <button key={tag.key} type="button"
                onClick={() => set('tags', form.tags.includes(tag.key) ? form.tags.filter(t=>t!==tag.key) : [...form.tags, tag.key])}
                className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                style={form.tags.includes(tag.key)
                  ? { background: tag.color, color: 'white', borderColor: tag.color }
                  : { background: tag.bg, color: tag.text, borderColor: tag.color+'44' }}>
                {tag.label}
              </button>
            ))}
          </div>
        </div>
        {/* Gizli tapşırıq — yalnız admin */}
        {isAdmin && (
          <div className="flex items-center justify-between px-3 py-2.5 bg-[#f8fafc] rounded-xl border border-[#e8e8e4]">
            <div>
              <div className="text-xs font-semibold text-[#0f172a]">Gizli tapşırıq</div>
              <div className="text-[10px] text-[#888] mt-0.5">Yalnız adminlər görə bilər</div>
            </div>
            <button type="button" onClick={() => set('is_hidden', !form.is_hidden)}
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${form.is_hidden ? 'bg-[#0f172a]' : 'bg-[#e2e8f0]'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_hidden ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        )}
        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
          className="w-full px-3 py-2 border border-[#e8e8e4] rounded-xl text-xs focus:outline-none focus:border-[#0f172a] resize-none placeholder-[#ccc]"
          placeholder="Təsvir..." />
        <div className="flex gap-2 pt-1 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => {
            const errs = []
            if (!(form.assignee_ids||[]).length) errs.push('Ən azı bir cavabdeh seçin')
            if (!form.due_date)    errs.push('Deadline məcburidir')
            if (errs.length) { setFormErrors(errs); return }
            setFormErrors([])
            onSave(form)
          }} className="ml-auto">{task ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
        {formErrors.length > 0 && (
          <div className="space-y-1">
            {formErrors.map((e,i) => (
              <p key={i} className="text-[11px] text-red-500 flex items-center gap-1">⚠ {e}</p>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ task, projects, members, onClose, onEdit, onDelete, onStatusChange, onDeadlineChange }) {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [checklists, setChecklists] = useState([])
  const [comments,   setComments]   = useState([])
  const [newCheck,     setNewCheck]     = useState('')
  const [checkAssignee, setCheckAssignee] = useState('')
  const [checkDue,      setCheckDue]      = useState('')
  const [checkErrors,   setCheckErrors]   = useState({})
  const [editingId,     setEditingId]     = useState(null)
  const [editTitle,     setEditTitle]     = useState('')
  const [editAssignee,  setEditAssignee]  = useState('')
  const [editDue,       setEditDue]       = useState('')
  const [editErrors,    setEditErrors]    = useState({})
  const [newComment, setNewComment] = useState('')
  const [commentMentions, setCommentMentions] = useState([])
  const [tab, setTab]               = useState('checklist')
  const [editingDue, setEditingDue] = useState(false)
  const [newDue,     setNewDue]     = useState(task.due_date || '')
  const bottomRef = useRef(null)
  const project  = projects.find(p => p.id === task.project_id)
  const assignee = members.find(m => m.id === task.assignee_id)
  const days = daysLeft(task.due_date)
  const pr   = prio(task.priority)
  const cl   = col(task.status)

  useEffect(() => { loadChecklists(); loadComments() }, [task?.id])
  useEffect(() => { setNewDue(task.due_date || '') }, [task.due_date])

  async function loadChecklists() {
    const { data } = await supabase.from('task_checklists').select('id,task_id,title,completed,position,assignee_id,due_date').eq('task_id', task.id).order('position')
    setChecklists(data || [])
  }
  async function loadComments() {
    const { data } = await supabase.from('task_comments')
      .select('*, profiles(full_name)').eq('task_id', task.id).order('created_at')
    setComments(data || [])
  }

  async function addChecklist() {
    const errs = {}
    if (!newCheck.trim())   errs.title    = true
    if (!checkAssignee)     errs.assignee = true
    if (!checkDue)          errs.due      = true
    if (Object.keys(errs).length) { setCheckErrors(errs); return }
    setCheckErrors({})

    await supabase.from('task_checklists').insert({
      task_id:     task.id,
      title:       newCheck.trim(),
      completed:   false,
      position:    checklists.length,
      assignee_id: checkAssignee,
      due_date:    checkDue,
    })
    setNewCheck('')
    setCheckAssignee('')
    setCheckDue('')
    loadChecklists()
  }
  async function toggleCheck(item) {
    await supabase.from('task_checklists').update({ completed: !item.completed }).eq('id', item.id)
    loadChecklists()
  }
  async function deleteCheck(id) {
    await supabase.from('task_checklists').delete().eq('id', id); loadChecklists()
  }

  function startEditCheck(item) {
    setEditingId(item.id)
    setEditTitle(item.title || '')
    setEditAssignee(item.assignee_id || task.assignee_id || '')
    setEditDue(item.due_date || task.due_date || '')
    setEditErrors({})
  }
  function cancelEditCheck() {
    setEditingId(null); setEditErrors({})
  }
  async function saveEditCheck() {
    const errs = {}
    if (!editTitle.trim())  errs.title    = true
    if (!editAssignee)      errs.assignee = true
    if (!editDue)           errs.due      = true
    if (Object.keys(errs).length) { setEditErrors(errs); return }
    await supabase.from('task_checklists').update({
      title:       editTitle.trim(),
      assignee_id: editAssignee,
      due_date:    editDue,
    }).eq('id', editingId)
    setEditingId(null); setEditErrors({})
    loadChecklists()
  }

  async function sendComment() {
    if (!newComment.trim()) return
    // Use IDs tracked by the picker — no text-parsing, stable against name changes
    const mentions = commentMentions
    await supabase.from('task_comments').insert({
      task_id: task.id, author_id: user?.id, content: newComment.trim(),
      type: 'comment', metadata: mentions.length ? { mentions } : null
    })
    for (const mid of mentions) {
      if (mid !== user?.id) {
        await notify(mid, task.title + ' — yeni şərh', newComment.trim().slice(0, 80), 'info', '/tapshiriqlar?task=' + task.id)
      }
    }
    setNewComment('')
    setCommentMentions([])
    loadComments()
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function saveDue() {
    if (newDue !== task.due_date) {
      const oldDue = task.due_date
      await logActivity(task.id, user?.id, 'deadline dəyişdi', { old_due: oldDue, new_due: newDue, changed_by: user?.id })
      onDeadlineChange(task, newDue)
    }
    setEditingDue(false)
  }

  const done  = checklists.filter(c => c.completed).length
  const pct   = checklists.length ? Math.round(done / checklists.length * 100) : 0
  const cmts  = comments.filter(c => c.type === 'comment')
  const acts  = comments.filter(c => c.type === 'activity')

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" />
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col"
        style={{ borderLeft: '1px solid #e8e8e4' }} onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4 border-b border-[#f0f0ec] flex-shrink-0">
          <div className="flex items-start gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: pr.bg, color: pr.color }}>{pr.label}</span>
                {project && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-semibold"
                    style={{ background: projClr(project.id, projects) }}>{project.name}</span>
                )}
              </div>
              <h2 className="text-sm font-bold text-[#0f172a] leading-snug">{task.title}</h2>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => onEdit(task)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f5f0] text-[#bbb] hover:text-[#555] transition-colors"><IconEdit size={13}/></button>
              <button onClick={() => onDelete(task)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#bbb] hover:text-red-400 transition-colors"><IconTrash size={13}/></button>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f5f0] text-[#bbb] hover:text-[#555] transition-colors"><IconX size={13}/></button>
            </div>
          </div>

          {/* Tags */}
          {((task.tags||[]).length > 0 || task.is_hidden) && (
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {(task.tags||[]).map(tag => {
                const tg = TASK_TAGS.find(t=>t.key===tag)
                return tg ? (
                  <span key={tag} className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide"
                    style={{ background: tg.color, color: 'white' }}>{tg.label}</span>
                ) : null
              })}
              {task.is_hidden && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0f172a] text-white/70 flex items-center gap-1">
                  🔒 Gizli tapşırıq
                </span>
              )}
            </div>
          )}
          {/* Meta row */}
          <div className="flex flex-wrap gap-2 items-center">
            <select value={task.status} onChange={e => onStatusChange(task, e.target.value)}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none"
              style={{ background: cl.bg, borderColor: cl.border, color: cl.color }}>
              {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>

            {/* Cavabdeh şəxslər */}
            <div className="flex flex-wrap gap-1.5">
              {((task.assignee_ids||[]).length > 0
                ? (task.assignee_ids||[]).map(id => members.find(m=>m.id===id)).filter(Boolean)
                : assignee ? [assignee] : []
              ).map(m => (
                <div key={m.id} className="flex items-center gap-1.5 px-2 py-1 bg-[#f8fafc] rounded-lg">
                  <Avatar name={m.full_name} size={5} />
                  <span className="text-[11px] text-[#555] font-medium">{m.full_name.split(' ')[0]}</span>
                </div>
              ))}
            </div>

            {/* Deadline — klik edib dəyiş */}
            <div>
              {editingDue ? (
                <div className="flex items-center gap-1">
                  <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)}
                    className="text-[11px] px-2 py-1 border border-[#0f172a] rounded-lg focus:outline-none" />
                  <button onClick={saveDue} className="text-[11px] px-2 py-1 bg-[#0f172a] text-white rounded-lg">✓</button>
                  <button onClick={() => setEditingDue(false)} className="text-[11px] px-1.5 py-1 text-[#aaa] hover:text-[#555] rounded-lg">✕</button>
                </div>
              ) : (
                <button onClick={() => setEditingDue(true)}
                  className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg transition-colors ${
                    task.due_date
                      ? days !== null && days < 0 ? 'bg-red-50 text-red-500 hover:bg-red-100'
                      : days === 0 ? 'bg-yellow-50 text-yellow-600'
                      : 'bg-[#f8fafc] text-[#555] hover:bg-[#f0f0ec]'
                      : 'bg-[#f8fafc] text-[#bbb] hover:bg-[#f0f0ec]'
                  }`}>
                  <IconCalendar size={11} />
                  {task.due_date
                    ? `${new Date(task.due_date).toLocaleDateString('az-AZ')}${days !== null ? (days < 0 ? ` · ${Math.abs(days)}g keçib` : days === 0 ? ' · Bu gün' : '') : ''}`
                    : 'Deadline yoxdur'}
                </button>
              )}
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-[#666] leading-relaxed mt-3 pt-3 border-t border-[#f5f5f0]">
              {task.description}
            </p>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-[#f0f0ec] px-5 flex-shrink-0">
          {[
            { k:'checklist', label:'Checklist', badge: checklists.length ? `${done}/${checklists.length}` : null },
            { k:'comments',  label:'Şərhlər',   badge: cmts.length || null },
            { k:'activity',  label:'Aktivlik',  badge: acts.length || null },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                tab === t.k ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#888] hover:text-[#555]'
              }`}>
              {t.label}
              {t.badge && <span className="text-[9px] bg-[#0f172a] text-white px-1.5 py-0.5 rounded-full">{t.badge}</span>}
            </button>
          ))}
          {tab === 'checklist' && checklists.length > 0 && (
            <div className="ml-auto flex items-center gap-2 py-2.5">
              <div className="h-1 w-20 bg-[#f0f0ec] rounded-full overflow-hidden">
                <div className="h-full bg-[#22c55e] rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] text-[#888] font-medium">{pct}%</span>
            </div>
          )}
        </div>

        {/* ── Tab body ── */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* CHECKLIST */}
          {tab === 'checklist' && (
            <div className="flex-1 overflow-y-auto p-5">
              {checklists.length === 0 && (
                <div className="text-center py-6 text-xs text-[#bbb]">Hələ checklist yoxdur</div>
              )}
              <div className="space-y-1 mb-4">
                {checklists.map(item => {
                  const isOverdueItem = item.due_date && !item.completed && new Date(item.due_date) < new Date()
                  const isMissing = !item.completed && (!item.assignee_id || !item.due_date)
                  const isEditing = editingId === item.id

                  if (isEditing) {
                    return (
                      <div key={item.id} className="bg-blue-50/40 border border-blue-200 rounded-lg p-2 space-y-2">
                        <input value={editTitle} onChange={e => { setEditTitle(e.target.value); setEditErrors(v=>({...v,title:false})) }}
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') saveEditCheck(); if (e.key === 'Escape') cancelEditCheck() }}
                          className={`w-full px-2 py-1.5 bg-white border rounded-lg text-xs focus:outline-none ${
                            editErrors.title ? 'border-red-400 bg-red-50' : 'border-[#e8e8e4] focus:border-[#0f172a]'
                          }`}
                          placeholder="Başlıq *" />
                        <div className="flex gap-2">
                          <select value={editAssignee} onChange={e => { setEditAssignee(e.target.value); setEditErrors(v=>({...v,assignee:false})) }}
                            className={`flex-1 px-2 py-1.5 bg-white border rounded-lg text-[11px] focus:outline-none text-[#555] ${
                              editErrors.assignee ? 'border-red-400 bg-red-50' : 'border-[#e8e8e4] focus:border-[#0f172a]'
                            }`}>
                            <option value="">Cavabdeh seçin... *</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                          </select>
                          <input type="date" value={editDue} onChange={e => { setEditDue(e.target.value); setEditErrors(v=>({...v,due:false})) }}
                            className={`px-2 py-1.5 bg-white border rounded-lg text-[11px] focus:outline-none text-[#555] ${
                              editErrors.due ? 'border-red-400 bg-red-50' : 'border-[#e8e8e4] focus:border-[#0f172a]'
                            }`} />
                        </div>
                        {(editErrors.title || editErrors.assignee || editErrors.due) && (
                          <p className="text-[10px] text-red-500">⚠ Başlıq, cavabdeh və tarix məcburidir</p>
                        )}
                        <div className="flex gap-1.5">
                          <button onClick={saveEditCheck} className="flex-1 py-1.5 bg-[#0f172a] text-white text-[10px] font-semibold rounded-lg hover:bg-[#1e293b] transition-colors">
                            Yadda saxla
                          </button>
                          <button onClick={cancelEditCheck} className="px-3 py-1.5 bg-white border border-[#e8e8e4] text-[#666] text-[10px] font-semibold rounded-lg hover:bg-[#f8f8f5] transition-colors">
                            Ləğv et
                          </button>
                        </div>
                      </div>
                    )
                  }

                  return (
                  <div key={item.id} className={`flex items-start gap-2 group py-1.5 px-2 rounded-lg transition-colors ${
                    isOverdueItem ? 'bg-red-50/60 hover:bg-red-50 border border-red-100' : 'hover:bg-[#f8fafc]'
                  }`}>
                    <button onClick={() => toggleCheck(item)}
                      className={`w-4 h-4 mt-0.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        item.completed ? 'bg-[#22c55e] border-[#22c55e]' : 'border-[#d1d5db] hover:border-[#0f172a]'
                      }`}>
                      {item.completed && <IconCheck size={9} className="text-white" strokeWidth={3} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs leading-relaxed transition-colors block ${
                        item.completed ? 'line-through text-[#bbb]' : 'text-[#333]'
                      }`}>{item.title}</span>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {item.assignee_id && (() => {
                          const m = members.find(mb=>mb.id===item.assignee_id)
                          return m ? (
                            <span className="text-[10px] text-[#888] flex items-center gap-1">
                              <Avatar name={m.full_name} size={5} />
                              {m.full_name.split(' ')[0]}
                            </span>
                          ) : null
                        })()}
                        {item.due_date && (
                          <span className={`text-[10px] font-medium flex items-center gap-0.5 ${
                            new Date(item.due_date) < new Date() && !item.completed ? 'text-red-500' : 'text-[#aaa]'
                          }`}>
                            <IconCalendar size={9} />
                            {new Date(item.due_date).toLocaleDateString('az-AZ',{day:'numeric',month:'short'})}
                          </span>
                        )}
                        {isMissing && (
                          <button type="button" onClick={() => startEditCheck(item)}
                            className="text-[9px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded transition-colors">
                            ⚠ {!item.assignee_id && !item.due_date ? 'cavabdeh + tarix yoxdur' : !item.assignee_id ? 'cavabdeh yoxdur' : 'tarix yoxdur'} — düzəlt
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => startEditCheck(item)}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-[#ccc] hover:text-[#0f172a] transition-all">
                        <IconEdit size={11} />
                      </button>
                      <button onClick={() => deleteCheck(item.id)}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-[#ccc] hover:text-red-400 transition-all">
                        <IconX size={11} />
                      </button>
                    </div>
                  </div>
                  )
                })}
              </div>
              <div className="border-t border-[#f5f5f0] pt-3 space-y-2">
                <div className="flex gap-2 items-center">
                  <input value={newCheck} onChange={e => { setNewCheck(e.target.value); setCheckErrors(v=>({...v,title:false})) }}
                    onKeyDown={e => e.key === 'Enter' && addChecklist()}
                    className={`flex-1 px-3 py-2 bg-[#f8fafc] border rounded-xl text-xs focus:outline-none focus:bg-white transition-all placeholder-[#bbb] ${
                      checkErrors.title ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-[#0f172a]'
                    }`}
                    placeholder="Yeni addım əlavə et..." />
                  <button onClick={addChecklist}
                    className="w-8 h-8 flex items-center justify-center bg-[#0f172a] text-white rounded-xl hover:bg-[#1e293b] transition-colors flex-shrink-0">
                    <IconPlus size={13} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <select value={checkAssignee} onChange={e => { setCheckAssignee(e.target.value); setCheckErrors(v=>({...v,assignee:false})) }}
                    className={`flex-1 px-2 py-1.5 bg-[#f8fafc] border rounded-lg text-[11px] focus:outline-none focus:bg-white text-[#888] ${
                      checkErrors.assignee ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-[#0f172a]'
                    }`}>
                    <option value="">Cavabdeh seçin... *</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                  </select>
                  <input type="date" value={checkDue} onChange={e => { setCheckDue(e.target.value); setCheckErrors(v=>({...v,due:false})) }}
                    className={`px-2 py-1.5 bg-[#f8fafc] border rounded-lg text-[11px] focus:outline-none focus:bg-white text-[#888] ${
                      checkErrors.due ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-[#0f172a]'
                    }`} />
                </div>
                {(checkErrors.title || checkErrors.assignee || checkErrors.due) && (
                  <p className="text-[10px] text-red-500">⚠ Başlıq, cavabdeh və tarix məcburidir</p>
                )}
              </div>
            </div>
          )}

          {/* COMMENTS */}
          {tab === 'comments' && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cmts.length === 0 && (
                  <div className="text-center py-10">
                    <IconMessage size={28} className="text-[#e8e8e4] mx-auto mb-2" />
                    <p className="text-xs text-[#bbb]">Hələ şərh yoxdur</p>
                    <p className="text-[10px] text-[#ccc] mt-1">@ yazaraq komanda üzvlərini tag edin</p>
                  </div>
                )}
                {cmts.map(c => {
                  const author = members.find(m => m.id === c.author_id)
                  const isMe = c.author_id === user?.id
                  const mentions = c.metadata?.mentions || []
                  // Highlight mentions in text
                  const highlighted = c.content.replace(/@([\w\s]+?)(?= |$)/g, (match) => `__MENTION__${match}__END__`)
                  const parts = highlighted.split(/__MENTION__|__END__/)
                  return (
                    <div key={c.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <Avatar name={author?.full_name || '?'} size={7} />
                      <div className={`max-w-[78%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-[#555]">
                            {author?.full_name?.split(' ')[0] || '?'}
                          </span>
                          <span className="text-[9px] text-[#ccc]">
                            {new Date(c.created_at).toLocaleString('az-AZ', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                          </span>
                        </div>
                        <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                          isMe ? 'bg-[#0f172a] text-white rounded-tr-sm' : 'bg-[#f5f5f0] text-[#333] rounded-tl-sm'
                        }`}>
                          {parts.map((part, i) =>
                            part.startsWith('@')
                              ? <span key={i} className={`font-semibold ${isMe ? 'text-blue-300' : 'text-blue-600'}`}>{part}</span>
                              : part
                          )}
                        </div>
                        {mentions.length > 0 && (
                          <div className="flex gap-1 flex-wrap mt-0.5">
                            {mentions.map(mid => {
                              const mb = members.find(m => m.id === mid)
                              return mb ? (
                                <span key={mid} className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">@{mb.full_name.split(' ')[0]}</span>
                              ) : null
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              <div className="p-4 border-t border-[#f0f0ec] flex-shrink-0">
                <div className="flex gap-2 items-end">
                  <MentionInput value={newComment} onChange={setNewComment}
                    onMentionsChange={setCommentMentions}
                    members={members}
                    placeholder="Şərh yazın... @ ilə tag edin" rows={2}
                    className="bg-[#f8fafc] border-transparent focus:bg-white focus:border-[#0f172a]" />
                  <button onClick={sendComment} disabled={!newComment.trim()}
                    className="w-9 h-9 flex items-center justify-center bg-[#0f172a] text-white rounded-xl hover:bg-[#1e293b] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0">
                    <IconSend size={13} />
                  </button>
                </div>
                <p className="text-[10px] text-[#ccc] mt-1.5">@ yazaraq komanda üzvlərini tag edin — onlara bildiriş gedəcək</p>
              </div>
            </div>
          )}

          {/* ACTIVITY */}
          {tab === 'activity' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-1">
              {acts.length === 0 && (
                <div className="text-center py-10">
                  <IconHistory size={28} className="text-[#e8e8e4] mx-auto mb-2" />
                  <p className="text-xs text-[#bbb]">Hələ aktivlik yoxdur</p>
                </div>
              )}
              {acts.map(a => {
                const author = members.find(m => m.id === a.author_id)
                const meta = a.metadata || {}
                let actionText = a.content
                let detail = null

                if (meta.old_due !== undefined) {
                  actionText = 'deadline dəyişdi'
                  detail = (
                    <span className="text-[10px] text-[#888]">
                      {meta.old_due
                        ? <span className="line-through text-red-400">{new Date(meta.old_due).toLocaleDateString('az-AZ')}</span>
                        : <span className="text-[#bbb]">yox idi</span>}
                      {' → '}
                      {meta.new_due
                        ? <span className="text-green-600">{new Date(meta.new_due).toLocaleDateString('az-AZ')}</span>
                        : <span className="text-[#bbb]">silinib</span>}
                    </span>
                  )
                } else if (meta.old_status) {
                  const oldC = col(meta.old_status), newC = col(meta.new_status)
                  detail = (
                    <span className="text-[10px]">
                      <span style={{ color: oldC.color }}>{oldC.label}</span>
                      {' → '}
                      <span style={{ color: newC.color }}>{newC.label}</span>
                    </span>
                  )
                }

                return (
                  <div key={a.id} className="flex gap-2.5 py-2 border-b border-[#f8fafc] last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#d1d5db] mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-[#333]">
                          {author?.full_name || 'Sistem'}
                        </span>
                        <span className="text-[11px] text-[#888]">{actionText}</span>
                        {detail}
                      </div>
                      <span className="text-[10px] text-[#bbb]">
                        {new Date(a.created_at).toLocaleString('az-AZ', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────
function KanbanCard({ task, projects, members, checkCounts, commentCounts, onClick, onArchive, onDragStart, onDragEnd, isDragging, filterUser, mySubtasks, onCardDragOver }) {
  const project        = projects.find(p => p.id === task.project_id)
  const assignee       = members.find(m => m.id === task.assignee_id)
  const filteredMember = filterUser && filterUser !== 'all' ? members.find(m => m.id === filterUser) : null
  const days = daysLeft(task.due_date)
  const pr = prio(task.priority)
  const isDone = task.status === 'done'
  const overdue = !isDone && days !== null && days < 0
  const cc = checkCounts[task.id] || { done:0, total:0, overdueItems:[], assigneeItems:{} }
  const overdueChecks = (cc.overdueItems||[]).length
  const myChecks = filterUser && filterUser !== 'all' ? (cc.assigneeItems||{})[filterUser] : null
  const hasSubtaskOverdue = overdueChecks > 0 && task.status !== 'done'
  const cmt = commentCounts[task.id] || 0

  return (
    <div
      className="group relative translate-x-0"
      draggable
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('taskId', task.id)
        onDragStart(task.id)
        // Slight rotation like Trello
        setTimeout(() => e.target.style.opacity = '0.5', 0)
      }}
      onDragEnd={e => {
        e.target.style.opacity = '1'
        onDragEnd()
      }}
      onDragEnter={e => { e.preventDefault(); onCardDragOver && onCardDragOver() }}
      style={{ cursor: 'grab', marginBottom: '0' }}
    >
      {/* Main card */}
      <div onClick={() => onClick(task)}
        className={`bg-white rounded-2xl border transition-all duration-200 ${
          overdue
            ? 'border-red-300 hover:border-red-500 hover:shadow-md'
            : hasSubtaskOverdue
            ? 'border-orange-200 hover:border-orange-400 hover:shadow-md'
            : 'border-[#ebebeb] hover:border-[#c8c8c8] hover:shadow-md'
        }`}
        style={{ boxShadow: overdue ? '0 1px 6px rgba(239,68,68,0.15)' : '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        {/* Priority top bar — qırmızı overdue üçün override */}
        <div className="h-[3px] rounded-t-2xl" style={{ background: overdue ? '#ef4444' : hasSubtaskOverdue ? '#f97316' : pr.color }} />

        <div className="p-3.5">
          {/* Header: project + tags + hidden */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
              {project && (
                <span className="text-[9px] font-bold uppercase tracking-widest truncate"
                  style={{ color: projClr(project.id, projects) }}>
                  {project.name}
                </span>
              )}
              {(task.tags||[]).map(tag => {
                const tg = TASK_TAGS.find(t=>t.key===tag)
                return tg ? (
                  <span key={tag} className="text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wide flex-shrink-0"
                    style={{ background: tg.bg, color: tg.text, border: `1px solid ${tg.color}40` }}>
                    {tg.label}
                  </span>
                ) : null
              })}
              {task.is_hidden && (
                <span className="text-[9px] text-[#94a3b8] flex-shrink-0">🔒</span>
              )}
            </div>
          </div>

          {/* Title */}
          <p className={`text-[12px] font-semibold leading-snug mb-3 ${isDone ? 'line-through text-[#c0c0c0]' : overdue ? 'text-red-700' : 'text-[#1a1a2e]'}`}>
            {task.title}
          </p>
          {/* Gecikmiş xəbərdarlıq */}
          {(overdue || hasSubtaskOverdue) && !isDone && (
            <div className={`flex items-center gap-1 text-[9px] font-bold mb-2 px-2 py-1 rounded-lg w-fit ${
              overdue ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
            }`}>
              {overdue
                ? `🔴 ${Math.abs(days)} gün gecikib`
                : `🟠 ${overdueChecks} subtask gecikib`}
            </div>
          )}

          {/* Checklist bar */}
          {cc.total > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-1 bg-[#f0f0f0] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width:`${Math.round(cc.done/cc.total*100)}%`, background: cc.done===cc.total ? '#22c55e' : '#94a3b8' }} />
              </div>
              <span className="text-[9px] text-[#aaa] font-medium tabular-nums">{cc.done}/{cc.total}</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            {/* Left: avatar + comments */}
            <div className="flex items-center gap-2">
              {assignee && (
                <div className="flex items-center gap-1">
                  <Avatar name={assignee.full_name} size={5} />
                  <span className="text-[9px] text-[#94a3b8]">{assignee.full_name.split(' ')[0]}</span>
                </div>
              )}
              {cmt > 0 && (
                <div className="flex items-center gap-0.5 text-[#cbd5e1]">
                  <IconMessage size={10} />
                  <span className="text-[9px] font-medium">{cmt}</span>
                </div>
              )}
            </div>

            {/* Right: deadline — gecikmiş olarsa yuxarıdakı badge göstərir, burada yalnız gələcək tarix */}
            {task.due_date && !overdue && (
              <span className={`text-[9px] font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
                days===0 ? 'bg-yellow-50 text-yellow-600'
                : days!==null&&days<=3 ? 'bg-amber-50 text-amber-500'
                : 'text-[#c0c0c0]'
              }`}>
                <IconCalendar size={9} />
                {days===0 ? 'Bu gün' : new Date(task.due_date).toLocaleDateString('az-AZ',{day:'numeric',month:'short'})}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* filterUser-in subtask-ları — card expand */}
      {mySubtasks && mySubtasks.length > 0 && (
        <div className="border-t border-[#f0f0ec] px-3.5 py-2.5 bg-[#f8faff]"
          onClick={e => e.stopPropagation()}>
          <div className="text-[9px] font-bold text-blue-500 uppercase tracking-wider mb-1.5">
            {filteredMember ? filteredMember.full_name.split(' ')[0] : 'Sizin'} subtask-lar ({mySubtasks.filter(s=>s.completed).length}/{mySubtasks.length})
          </div>
          <div className="space-y-1">
            {mySubtasks.map(item => {
              const isOverdue = item.due_date && !item.completed && new Date(item.due_date) < new Date()
              return (
                <div key={item.id} className={`flex items-center gap-2 py-0.5 px-1.5 rounded-md ${isOverdue ? 'bg-orange-50' : ''}`}>
                  <div className={`w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center ${
                    item.completed ? 'bg-[#22c55e] border-[#22c55e]' : isOverdue ? 'border-orange-400' : 'border-[#d1d5db]'
                  }`}>
                    {item.completed && <IconCheck size={8} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className={`text-[10px] flex-1 leading-snug ${item.completed ? 'line-through text-[#bbb]' : isOverdue ? 'text-orange-700 font-medium' : 'text-[#333]'}`}>
                    {item.title}
                  </span>
                  {item.due_date && (
                    <span className={`text-[8px] font-medium flex-shrink-0 ${isOverdue ? 'text-orange-500' : 'text-[#bbb]'}`}>
                      {isOverdue ? '⚠ ' : ''}{new Date(item.due_date).toLocaleDateString('az-AZ',{day:'numeric',month:'short'})}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Archive button — always visible on hover, outside overflow-hidden */}
      <button
        onClick={e => { e.stopPropagation(); onArchive(task) }}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 w-6 h-6 flex items-center justify-center rounded-lg bg-white border border-[#e8e8e4] text-[#94a3b8] hover:text-[#64748b] hover:border-[#94a3b8] shadow-sm"
        title="Arxivə göndər">
        <IconArchive size={11} />
      </button>
    </div>
  )
}

// ─── Kanban Column ────────────────────────────────────────────────────────────
function KanbanColumn({ column, tasks, projects, members, checkCounts, commentCounts, onCardClick, onQuickAdd, onArchive, dragTaskId, onDragStart, onDragEnd, onDrop, onDragOver, isDragOver, filterUser, mySubtasksMap, onCardDragOver }) {
  const [adding, setAdding] = useState(false)

  return (
    <div className="flex flex-col flex-1 min-w-[240px] sm:min-w-[260px] max-w-[320px]">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: column.color }} />
          <span className="text-[11px] font-bold text-[#1a1a2e] tracking-wide">{column.label}</span>
          <span className="text-[10px] font-bold min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-md"
            style={{ background: column.bg, color: column.color }}>{tasks.length}</span>
        </div>
        <button onClick={() => setAdding(true)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#aaa] hover:text-[#0f172a] hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-[#e8e8e4]">
          <IconPlus size={13} />
        </button>
      </div>

      {/* Drop zone */}
      <div
        className="flex flex-col gap-2.5 flex-1 rounded-2xl p-2 transition-all duration-150"
        style={{
          minHeight: 80,
          background: isDragOver ? column.bg : 'transparent',
          border: isDragOver ? `2px dashed ${column.color}` : '2px dashed transparent',
        }}
        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragTaskId) onDragOver(column.key) }}
        onDragEnter={e => { e.preventDefault() }}
        onDrop={e => { e.preventDefault(); onDrop(column.key) }}
      >
        {adding && (
          <QuickAdd status={column.key} projects={projects} members={members}
            onSave={data => { onQuickAdd(data); setAdding(false) }}
            onCancel={() => setAdding(false)} />
        )}
        {tasks.map((task, idx) => (
          <KanbanCard key={task.id} task={task} projects={projects} members={members}
            checkCounts={checkCounts} commentCounts={commentCounts}
            onClick={onCardClick} onArchive={onArchive}
            onDragStart={onDragStart} onDragEnd={onDragEnd}
            isDragging={dragTaskId === task.id}
            filterUser={filterUser}
            mySubtasks={mySubtasksMap?.[task.id] || null}
            onCardDragOver={() => onCardDragOver?.(idx)} />
        ))}
        {!adding && (
          <div onClick={() => setAdding(true)}
            className="border-2 border-dashed rounded-2xl px-3 py-2.5 text-center cursor-pointer transition-all flex items-center justify-center gap-1.5"
            style={{ borderColor: column.color + '25' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = column.color + '55'}
            onMouseLeave={e => e.currentTarget.style.borderColor = column.color + '25'}>
            <IconPlus size={11} style={{ color: column.color + '70' }} />
            <span className="text-[10px] font-medium" style={{ color: column.color + '90' }}>Əlavə et</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Archive Modal ────────────────────────────────────────────────────────────
function ArchiveModal({ open, onClose, tasks, projects, members, checkCounts, onUnarchive }) {
  const [year, setYear] = useState(new Date().getFullYear())
  const years = [...new Set(tasks.map(t => t.archive_year).filter(Boolean))].sort((a,b) => b-a)
  const filtered = tasks.filter(t => t.archived && t.archive_year === year)
  return (
    <Modal open={open} onClose={onClose} title={`Arxiv · ${filtered.length} tapşırıq`} size="xl">
      <div className="flex gap-2 mb-4 flex-wrap">
        {years.length === 0 && (
          <span className="text-xs text-[#bbb]">Hələ arxivlənmiş tapşırıq yoxdur</span>
        )}
        {years.map(y => (
          <button key={y} onClick={() => setYear(y)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${year===y ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'border-[#e8e8e4] text-[#555]'}`}>
            {y} ili
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-xs text-[#bbb]">Bu il üçün arxivlənmiş tapşırıq yoxdur</div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filtered.map(t => {
            const project  = projects.find(p => p.id === t.project_id)
            const assignee = members.find(m => m.id === t.assignee_id)
            const cc = checkCounts[t.id] || { done:0, total:0 }
            return (
              <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-[#f0f0ec] hover:border-[#e8e8e4] group">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[#555] truncate">{t.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {project && <span className="text-[10px] text-[#aaa]">{project.name}</span>}
                    {t.archived_at && (
                      <span className="text-[10px] text-[#ccc]">
                        {new Date(t.archived_at).toLocaleDateString('az-AZ')}
                      </span>
                    )}
                  </div>
                </div>
                {assignee && <Avatar name={assignee.full_name} size={5} />}
                {cc.total > 0 && <span className="text-[10px] text-[#aaa]">{cc.done}/{cc.total}</span>}
                <button
                  onClick={() => onUnarchive(t)}
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#e8e8e4] text-[10px] font-medium text-[#555] hover:bg-[#0f172a] hover:text-white hover:border-[#0f172a] transition-all">
                  <IconArchive size={10} /> Geri qaytar
                </button>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TapshiriqlarPage() {
  const { addToast } = useToast()
  const location = useLocation()
  const { user } = useAuth()
  const [tasks,         setTasks]         = useState([])
  const [projects,      setProjects]      = useState([])
  const [members,       setMembers]       = useState([])
  const [checkCounts,   setCheckCounts]   = useState({})
  const [commentCounts, setCommentCounts] = useState({})
  const [allChecklists, setAllChecklists] = useState([]) // bütün subtask-lar
  const [loading,       setLoading]       = useState(true)
  const [view,          setView]          = useState('kanban')
  const [filterProj,    setFilterProj]    = useState('all')
  const [filterUser,    setFilterUser]    = useState('all')
  const [search,        setSearch]        = useState('')
  const [modalOpen,     setModalOpen]     = useState(false)
  const [defaultSt,     setDefaultSt]     = useState('not_started')
  const [editTask,      setEditTask]      = useState(null)
  const [deleteTask,    setDeleteTask]    = useState(null)
  const [doneWarn,      setDoneWarn]      = useState(null) // { task, newStatus, incomplete }
  const [detailTask,    setDetailTask]    = useState(null)
  const [archiveOpen,   setArchiveOpen]   = useState(false)
  const [filterTag,     setFilterTag]     = useState('all')
  const [showHidden,    setShowHidden]    = useState(false)
  const [filterOverdue, setFilterOverdue] = useState(false)
  // Drag & Drop state
  const [dragTaskId,   setDragTaskId]   = useState(null)
  const [dragOverCol,  setDragOverCol]  = useState(null)
  const [dragOverIdx,  setDragOverIdx]  = useState(null)

  useEffect(() => { loadData() }, [])

  // URL-dəki ?task= parametrinə görə detail panel aç
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const taskId = params.get('task')
    if (taskId && tasks.length > 0) {
      const found = tasks.find(t => t.id === taskId)
      if (found) {
        setDetailTask(found)
        // URL-i təmizlə
        window.history.replaceState({}, '', '/tapshiriqlar')
      }
    }
  }, [location.search, tasks])

  async function loadData() {
    setLoading(true)
    const [tRes, pRes, mRes, ckRes, cmtRes] = await Promise.all([
      supabase.from('tasks').select('*').order('position', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name').order('name'),
      supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name'),
      supabase.from('task_checklists').select('id, task_id, title, completed, assignee_id, due_date'),
      supabase.from('task_comments').select('task_id, type'),
    ])
    setTasks(tRes.data || [])
    setProjects(pRes.data || [])
    setMembers(mRes.data || [])
    if (ckRes.error) {
      // task_checklists cədvəlində assignee_id/due_date sütunları yoxdursa bu xəta baş verir.
      // SQL: ALTER TABLE task_checklists ADD COLUMN IF NOT EXISTS assignee_id uuid, due_date date;
      console.error('Checklist query failed — run schema migration:', ckRes.error.message)
    }
    const cc = {}
    const now = new Date(); now.setHours(0,0,0,0)
    for (const item of (ckRes.data||[])) {
      if (!cc[item.task_id]) cc[item.task_id] = { done:0, total:0, overdueItems:[], assigneeItems:{} }
      cc[item.task_id].total++
      if (item.completed) cc[item.task_id].done++
      else if (item.due_date) {
        // Timezone-safe: tarix string-ini lokal saatla müqayisə et
        const [y,m,d] = item.due_date.split('-').map(Number)
        const dueLocal = new Date(y, m-1, d)
        if (dueLocal < now) cc[item.task_id].overdueItems.push(item)
      }
      // Subtask-ları cavabdehə görə indekslə
      if (item.assignee_id) {
        if (!cc[item.task_id].assigneeItems[item.assignee_id]) {
          cc[item.task_id].assigneeItems[item.assignee_id] = { done:0, total:0 }
        }
        cc[item.task_id].assigneeItems[item.assignee_id].total++
        if (item.completed) cc[item.task_id].assigneeItems[item.assignee_id].done++
      }
    }
    setCheckCounts(cc)
    setAllChecklists(ckRes.data || [])  // subtitle + mySubtasksMap üçün
    const cmt = {}
    for (const item of (cmtRes.data||[])) {
      if (item.type === 'comment') cmt[item.task_id] = (cmt[item.task_id]||0) + 1
    }
    setCommentCounts(cmt)
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.title.trim()) { addToast('Tapşırıq adı daxil edin', 'error'); return }
    const data = { title:form.title.trim(), description:form.description||null, project_id:form.project_id||null, assignee_ids:form.assignee_ids||[], assignee_id:(form.assignee_ids||[])[0]||null, status:form.status, priority:form.priority, due_date:form.due_date||null, tags:form.tags||[], is_hidden:form.is_hidden||false }
    if (editTask) {
      const { error } = await supabase.from('tasks').update(data).eq('id', editTask.id)
      if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin','error'); return }
      // Activity: status dəyişibsə qeyd et
      if (editTask.status !== data.status) {
        await logActivity(editTask.id, user?.id, 'status dəyişdi', { old_status: editTask.status, new_status: data.status })
      }
      // Cavabdeh dəyişibsə yeni cavabdehə bildiriş
      if (data.assignee_id && data.assignee_id !== editTask.assignee_id && data.assignee_id !== user?.id) {
        await notify(data.assignee_id, 'Tapşırıq sizə təyin edildi', data.title, 'info', '/tapshiriqlar?task=' + editTask.id)
      }
      // Optimistic update for edit
      setTasks(prev => prev.map(t => t.id === editTask.id ? { ...t, ...data } : t))
      if (detailTask?.id === editTask.id) setDetailTask(prev => ({ ...prev, ...data }))
      addToast('Tapşırıq yeniləndi','success')
    } else {
      const { data:inserted, error } = await supabase.from('tasks').insert(data).select().single()
      if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin','error'); return }
      // Optimistic: yeni tapşırığı dərhal state-ə əlavə et
      setTasks(prev => [inserted, ...prev])
      setCheckCounts(prev => ({ ...prev, [inserted.id]: { done:0, total:0, overdueItems:[], assigneeItems:{} } }))
      setCommentCounts(prev => ({ ...prev, [inserted.id]: 0 }))
      logActivity(inserted.id, user?.id, 'tapşırıq yaradıldı', {})
      for (const uid of (data.assignee_ids||[])) {
        if (uid !== user?.id) notify(uid, 'Yeni tapşırıq', data.title, 'info', '/tapshiriqlar?task=' + inserted.id)
      }
      addToast('Tapşırıq əlavə edildi','success')
    }
    setModalOpen(false); setEditTask(null)
  }

  async function handleQuickSave(form) {
    const payload = {
      title: form.title,
      status: form.status,
      project_id: form.project_id || null,
      assignee_ids: form.assignee_ids || [],
      assignee_id: (form.assignee_ids||[])[0] || null,
      priority: 'medium',
      due_date: form.due_date || null,
      description: null,
      tags: [],
      is_hidden: false,
      archived: false,
    }
    const { data:inserted, error } = await supabase.from('tasks').insert(payload).select().single()
    if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin', 'error'); return }
    // Optimistic — yeni tapşırığı dərhal state-ə əlavə et
    setTasks(prev => [inserted, ...prev])
    // Activity + bildiriş (fire and forget)
    supabase.from('task_comments').insert({ task_id:inserted.id, author_id:user?.id, type:'activity', content:'tapşırıq yaradıldı', metadata:{} })
    for (const uid of (form.assignee_ids||[])) {
      if (uid !== user?.id) notify(uid, 'Yeni tapşırıq', form.title, 'info', '/tapshiriqlar?task=' + inserted.id)
    }
    // checkCounts yenilə
    setCheckCounts(prev => ({ ...prev, [inserted.id]: { done:0, total:0 } }))
    setCommentCounts(prev => ({ ...prev, [inserted.id]: 0 }))
  }

  async function handleDelete() {
    const id = deleteTask.id
    setTasks(prev => prev.filter(t => t.id !== id))
    if (detailTask?.id === id) setDetailTask(null)
    setDeleteTask(null)
    addToast('Silindi','success')
    await supabase.from('tasks').delete().eq('id', id)
  }

  async function _doStatusChange(task, newStatus) {
    const oldStatus = task.status
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    if (detailTask?.id === task.id) setDetailTask(prev => ({ ...prev, status: newStatus }))
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    if (error) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: oldStatus } : t))
      if (detailTask?.id === task.id) setDetailTask(prev => ({ ...prev, status: oldStatus }))
      addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin', 'error')
      return
    }
    logActivity(task.id, user?.id, 'status dəyişdi', { old_status: oldStatus, new_status: newStatus })
    if (newStatus === 'done') {
      const allAssignees = (task.assignee_ids||[]).length > 0 ? task.assignee_ids : (task.assignee_id ? [task.assignee_id] : [])
      for (const uid of allAssignees) {
        if (uid !== user?.id) notify(uid, task.title, 'Tapşırıq tamamlandı kimi işarələndi', 'success', '/tapshiriqlar?task=' + task.id)
      }
    }
  }

  async function handleStatusChange(task, newStatus) {
    if (task.status === newStatus) return
    if (newStatus === 'done') {
      const cc = checkCounts[task.id]
      const incomplete = (cc?.total || 0) - (cc?.done || 0)
      if (incomplete > 0) { setDoneWarn({ task, newStatus, incomplete }); return }
    }
    await _doStatusChange(task, newStatus)
  }

  async function handleDeadlineChange(task, newDue) {
    // Optimistic
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, due_date: newDue || null } : t))
    if (detailTask?.id === task.id) setDetailTask(prev => ({ ...prev, due_date: newDue }))
    const { error } = await supabase.from('tasks').update({ due_date: newDue || null }).eq('id', task.id)
    if (error) addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin', 'error')
  }

  async function archiveDone() {
    const doneTasks = tasks.filter(t => t.status === 'done' && !t.archived)
    if (!doneTasks.length) { addToast('Arxivlənəcək tamamlanmış tapşırıq yoxdur','info'); return }
    const now = new Date()
    const ids = doneTasks.map(t => t.id)
    const patch = { archived:true, archived_at:now.toISOString(), archive_year:now.getFullYear() }
    setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, ...patch } : t))
    addToast(`${doneTasks.length} tapşırıq arxivləndi`,'success')
    for (const t of doneTasks) {
      supabase.from('tasks').update(patch).eq('id', t.id)
    }
  }

  async function handleSingleArchive(task) {
    const now = new Date()
    const patch = { archived:true, archived_at:now.toISOString(), archive_year:now.getFullYear() }
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...patch } : t))
    if (detailTask?.id === task.id) setDetailTask(null)
    addToast('Tapşırıq arxivləndi','success')
    supabase.from('tasks').update(patch).eq('id', task.id)
  }

  async function handleUnarchive(task) {
    const patch = { archived:false, archived_at:null, archive_year:null }
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...patch } : t))
    addToast('Tapşırıq geri qaytarıldı','success')
    supabase.from('tasks').update(patch).eq('id', task.id)
  }

  async function handleDrop(targetColKey) {
    if (!dragTaskId || !targetColKey) return
    const task = tasks.find(t => t.id === dragTaskId)
    if (!task) { setDragTaskId(null); setDragOverCol(null); setDragOverIdx(null); return }

    if (task.status === targetColKey) {
      const colTasks = tasks.filter(t => t.status === targetColKey && !t.archived)
      const fromIdx = colTasks.findIndex(t => t.id === dragTaskId)
      const toIdx = dragOverIdx ?? colTasks.length - 1
      setDragTaskId(null); setDragOverCol(null); setDragOverIdx(null)
      if (fromIdx < 0 || fromIdx === toIdx) return
      const reordered = [...colTasks]
      const [moved] = reordered.splice(fromIdx, 1)
      reordered.splice(Math.min(toIdx, reordered.length), 0, moved)
      const withPos = reordered.map((t, i) => ({ ...t, position: i + 1 }))
      setTasks(prev => [...prev.filter(t => t.status !== targetColKey || t.archived), ...withPos])
      await Promise.all(withPos.map(t => supabase.from('tasks').update({ position: t.position }).eq('id', t.id)))
      return
    }
    if (targetColKey === 'done') {
      const cc = checkCounts[dragTaskId]
      const incomplete = (cc?.total || 0) - (cc?.done || 0)
      if (incomplete > 0) {
        setDoneWarn({ task, newStatus: targetColKey, incomplete })
        setDragTaskId(null); setDragOverCol(null); setDragOverIdx(null)
        return
      }
    }
    setDragTaskId(null); setDragOverCol(null); setDragOverIdx(null)
    await _doStatusChange(task, targetColKey)
  }

  const { isAdmin } = useAuth()
  const activeTasks = tasks.filter(t => !t.archived && (isAdmin || !t.is_hidden))
  const filtered = activeTasks.filter(t => {
    if (filterProj !== 'all' && t.project_id !== filterProj) return false
    if (filterUser !== 'all') {
      const inIds   = (t.assignee_ids||[]).includes(filterUser)
      const inOld   = t.assignee_id === filterUser
      // Checklist subtask-ında bu üzv var? (total > 0 şərti ilə)
      const cc      = checkCounts[t.id]
      const inCheck = cc?.assigneeItems?.[filterUser]?.total > 0
      if (!inIds && !inOld && !inCheck) return false
    }
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filterTag !== 'all' && !(t.tags||[]).includes(filterTag)) return false
    if (isAdmin && !showHidden && t.is_hidden) return false
    if (isAdmin && showHidden && !t.is_hidden) return false
    if (filterOverdue) {
      const d = daysLeft(t.due_date)
      const hasOverdueCheck = (checkCounts[t.id]?.overdueItems||[]).length > 0
      if (t.status==='done' && !hasOverdueCheck) return false
      if (d!==null && d>=0 && !hasOverdueCheck) return false
      if (d===null && !hasOverdueCheck) return false
    }
    return true
  })
  const tasksByCol = Object.fromEntries(COLUMNS.map(c => [c.key, filtered.filter(t => t.status===c.key)]))
  const overdueCount = activeTasks.filter(t => { const d=daysLeft(t.due_date); return t.status!=='done'&&d!==null&&d<0 }).length
  const overdueSubtaskCount = (() => {
    const todayLocal = new Date()
    todayLocal.setHours(0,0,0,0)
    return allChecklists.filter(item => {
      if (item.completed || !item.due_date) return false
      const [y,m,d] = item.due_date.split('-').map(Number)
      return new Date(y, m-1, d) < todayLocal
    }).length
  })()
  // filterUser seçildiyi halda hər task üçün onun subtask-ları
  const mySubtasksMap = (() => {
    if (filterUser === 'all') return {}
    const map = {}
    for (const item of allChecklists) {
      if (item.assignee_id === filterUser) {
        if (!map[item.task_id]) map[item.task_id] = []
        map[item.task_id].push(item)
      }
    }
    return map
  })()
  // Seçilmiş üzvün gecikmiş subtask-ları
  const myOverdueSubtasks = filterUser !== 'all'
    ? activeTasks.flatMap(t => {
        const cc = checkCounts[t.id] || {}
        return (cc.overdueItems || []).filter(item => item.assignee_id === filterUser).map(item => ({ ...item, taskTitle: t.title }))
      })
    : []
  const filterMember = members.find(m => m.id === filterUser)

  if (loading) return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-4 lg:px-6 pt-5 pb-4 border-b border-[#e8e8e4] bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-36" />
        </div>
      </div>
      <div className="flex-1 overflow-x-auto p-4 lg:p-6">
        <div className="flex gap-4 h-full min-w-max">
          {COLUMNS.map((col, i) => (
            <div key={i} className="w-[280px] flex flex-col gap-2">
              <Skeleton className="h-5 w-24 mb-1" />
              {[...Array(i === 1 ? 3 : i === 0 ? 2 : 1)].map((_, j) => (
                <div key={j} className="bg-white rounded-xl border border-[#e8e8e4] p-3 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex justify-between pt-1">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Top Bar ── */}
      <div className="px-4 lg:px-6 pt-5 pb-4 border-b border-[#e8e8e4] bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-sm font-bold text-[#0f172a]">Tapşırıqlar</h1>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[11px] text-[#888]">{activeTasks.length} aktiv</span>
              {overdueCount > 0 && (
                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                  🔴 {overdueCount} gecikmiş task
                </span>
              )}
              {overdueSubtaskCount > 0 && (
                <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                  🟠 {overdueSubtaskCount} gecikmiş subtask
                </span>
              )}
              {tasks.filter(t=>t.archived).length > 0 && (
                <span className="text-[10px] text-[#bbb] bg-[#f5f5f0] px-2 py-0.5 rounded-full">
                  {tasks.filter(t=>t.archived).length} arxivdə
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex border border-[#e8e8e4] rounded-lg overflow-hidden">
              <button onClick={() => setView('kanban')} className={`px-2.5 py-1.5 transition-colors ${view==='kanban'?'bg-[#0f172a] text-white':'text-[#555] hover:bg-[#f5f5f0]'}`}><IconLayoutKanban size={14}/></button>
              <button onClick={() => setView('list')}   className={`px-2.5 py-1.5 transition-colors ${view==='list'  ?'bg-[#0f172a] text-white':'text-[#555] hover:bg-[#f5f5f0]'}`}><IconList size={14}/></button>
            </div>
            <button onClick={() => setArchiveOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs text-[#555] hover:border-[#0f172a] transition-colors">
              <IconArchive size={13} /> <span className="hidden sm:inline">Arxiv</span>
            </button>
            <button onClick={archiveDone}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs text-[#555] hover:border-[#0f172a] transition-colors">
              Tamamlananları arxivlə
            </button>
            <Button onClick={() => { setEditTask(null); setDefaultSt('not_started'); setModalOpen(true) }} size="sm">
              <IconPlus size={14} /> <span className="hidden sm:inline">Yeni tapşırıq</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e8e8e4] rounded-lg bg-white min-w-[160px]">
            <IconSearch size={12} className="text-[#bbb]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="text-xs outline-none flex-1 placeholder-[#ccc]" placeholder="Axtar..." />
          </div>
          <select value={filterProj} onChange={e => setFilterProj(e.target.value)}
            className="px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none bg-white">
            <option value="all">Bütün layihələr</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
            className="px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none bg-white">
            <option value="all">Bütün üzvlər</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
          {/* Gecikmiş filter */}
          <button onClick={() => setFilterOverdue(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border font-medium transition-all ${
              filterOverdue
                ? 'bg-red-500 text-white border-red-500'
                : 'text-[#888] border-[#e8e8e4] hover:border-red-300 hover:text-red-500'
            }`}>
            <IconAlertCircle size={12} /> Gecikmiş
          </button>
          {/* BD tag filter */}
          <button onClick={() => setFilterTag(t => t === 'BD' ? 'all' : 'BD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
              filterTag === 'BD'
                ? 'bg-[#1a3040] text-white border-[#1a3040]'
                : 'bg-[#e8f4ff] text-[#1a3040] border-[#1a3040]/30 hover:border-[#1a3040]'
            }`}>
            BD
          </button>
          {/* Hidden filter — yalnız admin */}
          {isAdmin && (
            <button onClick={() => setShowHidden(h => !h)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                showHidden
                  ? 'bg-[#0f172a] text-white border-[#0f172a]'
                  : 'text-[#555] border-[#e8e8e4] hover:border-[#0f172a]'
              }`}>
              🔒 {showHidden ? 'Gizli görünür' : 'Gizlilər'}
            </button>
          )}
          {(filterProj !== 'all' || filterUser !== 'all' || search || filterTag !== 'all' || showHidden || filterOverdue) && (
            <button onClick={() => { setFilterProj('all'); setFilterUser('all'); setSearch(''); setFilterTag('all'); setShowHidden(false); setFilterOverdue(false) }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#888] hover:text-red-500 border border-[#e8e8e4] hover:border-red-200 rounded-lg transition-colors">
              <IconX size={11}/> Sıfırla
            </button>
          )}
          <div className="ml-auto flex gap-3">
            {COLUMNS.map(c => (
              <div key={c.key} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background:c.color }}/>
                <span className="text-[10px] text-[#888] font-medium">{tasksByCol[c.key]?.length||0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Board: Kanban ── */}
      {view === 'kanban' && (
        <>
          <div className="flex-1 overflow-auto p-4 lg:p-6" style={{ background: '#fafaf8' }}>
            <div className="flex gap-3 h-full"
              style={{ minWidth: COLUMNS.length * 280 + 'px' }}>
              {COLUMNS.map(column => (
                <KanbanColumn key={column.key} column={column}
                  tasks={tasksByCol[column.key]||[]}
                  projects={projects} members={members}
                  checkCounts={checkCounts} commentCounts={commentCounts}
                  onCardClick={t => setDetailTask(t)}
                  onQuickAdd={handleQuickSave}
                  onArchive={handleSingleArchive}
                  dragTaskId={dragTaskId}
                  onDragStart={id => setDragTaskId(id)}
                  onDragEnd={() => { setDragTaskId(null); setDragOverCol(null) }}
                  onDrop={handleDrop}
                  onDragOver={key => setDragOverCol(key)}
                  isDragOver={dragOverCol === column.key}
                  filterUser={filterUser}
                  mySubtasksMap={mySubtasksMap}
                  onCardDragOver={idx => { setDragOverCol(column.key); setDragOverIdx(idx) }}
                />
              ))}
            </div>
          </div>
          {myOverdueSubtasks.length > 0 && filterMember && (
            <div className="mx-4 lg:mx-6 mb-4 bg-orange-50 border border-orange-200 rounded-2xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">🟠</span>
                <span className="text-xs font-bold text-orange-800">{filterMember.full_name} — gecikmiş subtask-lar ({myOverdueSubtasks.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {myOverdueSubtasks.slice(0, 8).map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-white border border-orange-200 rounded-xl px-2.5 py-1.5 text-[10px]">
                    <span className="text-orange-500">⏰</span>
                    <div>
                      <div className="font-semibold text-[#0f172a]">{item.title}</div>
                      <div className="text-[#888]">{item.taskTitle} · {new Date(item.due_date).toLocaleDateString('az-AZ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Board: List ── */}
      {view === 'list' && (
        <div className="flex-1 overflow-auto px-4 lg:px-6 py-4">
          <div className="bg-white border border-[#e8e8e4] rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e8e8e4] bg-[#fafaf8]">
                  <th className="w-3 px-3 py-3" />
                  <th className="text-left py-3 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Tapşırıq</th>
                  <th className="text-left py-3 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Cavabdeh</th>
                  <th className="text-left py-3 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Deadline</th>
                  <th className="text-left py-3 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Checklist</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-xs text-[#bbb]">Tapşırıq yoxdur</td></tr>
                ) : filtered.map(task => {
                  const project  = projects.find(p => p.id === task.project_id)
                  const assignee = members.find(m => m.id === task.assignee_id)
                  const d = daysLeft(task.due_date)
                  const pr = prio(task.priority)
                  const cl = col(task.status)
                  const cc = checkCounts[task.id]||{done:0,total:0}
                  const overdue = task.status!=='done'&&d!==null&&d<0
                  return (
                    <tr key={task.id} className={`border-b border-[#f5f5f0] hover:bg-[#fafaf8] cursor-pointer ${overdue?'bg-red-50/20':''}`}
                      onClick={() => setDetailTask(task)}>
                      <td className="px-3 py-3"><div className="w-[3px] h-6 rounded-full" style={{background:pr.color}}/></td>
                      <td className="py-3 pr-4">
                        <div className={`text-xs font-medium ${task.status==='done'?'line-through text-[#bbb]':'text-[#0f172a]'}`}>{task.title}</div>
                        {project && <div className="text-[9px] mt-0.5" style={{color:projClr(project.id,projects)}}>{project.name}</div>}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          {((task.assignee_ids||[]).length > 0
                            ? (task.assignee_ids||[]).map(id=>members.find(m=>m.id===id)).filter(Boolean)
                            : assignee ? [assignee] : []
                          ).slice(0,2).map((m,i) => (
                            <div key={m.id} className="flex items-center gap-1">
                              <Avatar name={m.full_name} size={5}/>
                              {i===0 && <span className="text-[10px] text-[#555]">{m.full_name.split(' ')[0]}</span>}
                            </div>
                          ))}
                          {(task.assignee_ids||[]).length > 2 && <span className="text-[9px] text-[#aaa]">+{(task.assignee_ids||[]).length-2}</span>}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{background:cl.bg,color:cl.color}}>{cl.label}</span>
                      </td>
                      <td className="py-3 pr-4">
                        {task.due_date && <span className={`text-[10px] font-medium ${overdue?'text-red-500':d===0?'text-yellow-600':'text-[#888]'}`}>{new Date(task.due_date).toLocaleDateString('az-AZ')}{overdue?` (${Math.abs(d)}g)`:''}</span>}
                      </td>
                      <td className="py-3 pr-4">
                        {cc.total>0&&<div className="flex items-center gap-1.5"><div className="w-12 h-1 bg-[#f0f0ec] rounded-full overflow-hidden"><div className="h-full bg-[#22c55e] rounded-full" style={{width:`${Math.round(cc.done/cc.total*100)}%`}}/></div><span className="text-[9px] text-[#aaa]">{cc.done}/{cc.total}</span></div>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Seçilmiş üzvün gecikmiş subtask-ları — list view üçün */}
      {view === 'list' && myOverdueSubtasks.length > 0 && filterMember && (
        <div className="mx-4 lg:mx-6 mb-4 bg-orange-50 border border-orange-200 rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🟠</span>
            <span className="text-xs font-bold text-orange-800">{filterMember.full_name} — gecikmiş subtask-lar ({myOverdueSubtasks.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {myOverdueSubtasks.slice(0, 8).map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-white border border-orange-200 rounded-xl px-2.5 py-1.5 text-[10px]">
                <span className="text-orange-500">⏰</span>
                <div>
                  <div className="font-semibold text-[#0f172a]">{item.title}</div>
                  <div className="text-[#888]">{item.taskTitle} · {new Date(item.due_date).toLocaleDateString('az-AZ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {detailTask && (
        <DetailPanel task={detailTask} projects={projects} members={members}
          onClose={() => setDetailTask(null)}
          onEdit={t => { setEditTask(t); setModalOpen(true) }}
          onDelete={t => { setDeleteTask(t); setDetailTask(null) }}
          onStatusChange={handleStatusChange}
          onDeadlineChange={handleDeadlineChange} />
      )}

      <TaskForm open={modalOpen} onClose={() => { setModalOpen(false); setEditTask(null) }}
        onSave={handleSave} task={editTask} projects={projects} members={members} defaultStatus={defaultSt} />
      <ConfirmDialog open={!!deleteTask} title="Tapşırığı sil"
        message={`"${deleteTask?.title}" tapşırığını silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteTask(null)} danger />
      <ConfirmDialog open={!!doneWarn} title="Tamamlanmamış alt tapşırıqlar"
        message={`Bu tapşırıqda ${doneWarn?.incomplete} tamamlanmamış alt tapşırıq var. Yenə də "Tamamlandı" kimi işarələmək istəyirsiniz?`}
        onConfirm={() => { const w = doneWarn; setDoneWarn(null); _doStatusChange(w.task, w.newStatus) }}
        onCancel={() => setDoneWarn(null)} />
      <ArchiveModal open={archiveOpen} onClose={() => setArchiveOpen(false)}
        tasks={tasks} projects={projects} members={members} checkCounts={checkCounts} onUnarchive={handleUnarchive} />
    </div>
  )
}
