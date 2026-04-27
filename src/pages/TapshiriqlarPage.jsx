import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { Button, Modal, ConfirmDialog, Skeleton } from '../components/ui'
import { notify } from '../components/layout/MainLayout'
import {
  IconPlus, IconX, IconEdit, IconTrash, IconCheck, IconSend,
  IconLayoutKanban, IconList, IconSearch, IconArchive,
  IconCalendar, IconFlag, IconChevronDown, IconMessage,
  IconAlertCircle, IconAt, IconClock, IconHistory
} from '@tabler/icons-react'

// ─── Constants ────────────────────────────────────────────────────────────────
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

function MentionInput({ value, onChange, members, placeholder, rows=1, className='' }) {
  const [show, setShow] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  function handleKey(e) {
    const v = e.target.value
    onChange(v)
    const lastAt = v.lastIndexOf('@')
    if (lastAt !== -1 && lastAt === v.length - 1) { setShow(true); setQuery('') }
    else if (lastAt !== -1 && v.slice(lastAt).match(/^@\w*/)) {
      setShow(true); setQuery(v.slice(lastAt+1))
    } else setShow(false)
  }

  function pick(m) {
    const lastAt = value.lastIndexOf('@')
    onChange(value.slice(0, lastAt) + `@${m.full_name} `)
    setShow(false)
  }

  const filtered = members.filter(m => m.full_name.toLowerCase().includes(query.toLowerCase())).slice(0,5)

  return (
    <div className="relative flex-1">
      <textarea ref={ref} value={value} onChange={handleKey} rows={rows} placeholder={placeholder}
        className={`w-full px-3 py-2 border border-[#e8e8e4] rounded-xl text-xs focus:outline-none focus:border-[#0f172a] resize-none leading-relaxed ${className}`} />
      {show && filtered.length > 0 && (
        <div className="absolute bottom-full mb-1 left-0 bg-white border border-[#e8e8e4] rounded-xl shadow-lg overflow-hidden z-50 min-w-[180px]">
          {filtered.map(m => (
            <button key={m.id} onClick={() => pick(m)} type="button"
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#f5f5f0] text-left">
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
  const [title,    setTitle]    = useState('')
  const [projId,   setProjId]   = useState('')
  const [assignee, setAssignee] = useState('')
  const [due,      setDue]      = useState('')
  const [errors,   setErrors]   = useState({})
  const ref = useRef(null)
  useEffect(() => { ref.current?.focus() }, [])

  function save() {
    const errs = {}
    if (!title.trim())  errs.title    = true
    if (!assignee)      errs.assignee = true
    if (!due)           errs.due      = true
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({ title: title.trim(), status, project_id: projId || null,
      assignee_id: assignee, priority: 'medium', due_date: due, description: null })
  }

  return (
    <div className="bg-white rounded-xl border-2 border-[#0f172a] shadow-lg p-3 space-y-2">
      <textarea ref={ref} value={title} onChange={e => { setTitle(e.target.value); setErrors(v=>({...v,title:false})) }}
        onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();save()} if(e.key==='Escape')onCancel() }}
        rows={2} placeholder="Tapşırıq adı..."
        className={`w-full text-xs text-[#0f172a] outline-none resize-none leading-relaxed placeholder-[#ccc] ${errors.title?'placeholder-red-400':''}`} />
      <select value={projId} onChange={e => setProjId(e.target.value)}
        className="w-full text-[10px] px-2 py-1.5 border border-[#f0f0ec] rounded-lg outline-none text-[#888] bg-[#fafafa]">
        <option value="">Layihə seçin...</option>
        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <select value={assignee} onChange={e => { setAssignee(e.target.value); setErrors(v=>({...v,assignee:false})) }}
        className={`w-full text-[10px] px-2 py-1.5 border rounded-lg outline-none bg-[#fafafa] ${errors.assignee ? 'border-red-400 text-red-500' : 'border-[#f0f0ec] text-[#888]'}`}>
        <option value="">{errors.assignee ? '⚠ Cavabdeh seçin!' : 'Cavabdeh seçin...'}</option>
        {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
      </select>
      <input type="date" value={due} onChange={e => { setDue(e.target.value); setErrors(v=>({...v,due:false})) }}
        className={`w-full text-[10px] px-2 py-1.5 border rounded-lg outline-none ${errors.due ? 'border-red-400 bg-red-50 text-red-600' : 'border-[#f0f0ec] bg-[#fafafa] text-[#888]'}`}
        placeholder={errors.due ? 'Deadline məcburidir!' : ''} />
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
  const [form, setForm] = useState({ title:'', description:'', project_id:'', assignee_id:'', status: defaultStatus||'not_started', priority:'medium', due_date:'', tags:[], is_hidden:false })
  useEffect(() => {
    if (task) setForm({ title:task.title||'', description:task.description||'', project_id:task.project_id||'', assignee_id:task.assignee_id||'', status:task.status||'not_started', priority:task.priority||'medium', due_date:task.due_date||'', tags:task.tags||[], is_hidden:task.is_hidden||false })
    else setForm({ title:'', description:'', project_id:'', assignee_id:'', status:defaultStatus||'not_started', priority:'medium', due_date:'', tags:[], is_hidden:false })
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
            ['Cavabdeh *','assignee_id', members.map(m=>({v:m.id,l:m.full_name}))],
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
            if (!form.assignee_id) errs.push('Cavabdeh seçilməlidir')
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
  const [newCheck,   setNewCheck]   = useState('')
  const [newComment, setNewComment] = useState('')
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
    const { data } = await supabase.from('task_checklists').select('*').eq('task_id', task.id).order('position')
    setChecklists(data || [])
  }
  async function loadComments() {
    const { data } = await supabase.from('task_comments')
      .select('*, profiles(full_name)').eq('task_id', task.id).order('created_at')
    setComments(data || [])
  }

  async function addChecklist() {
    if (!newCheck.trim()) return
    await supabase.from('task_checklists').insert({ task_id: task.id, title: newCheck.trim(), completed: false, position: checklists.length })
    setNewCheck(''); loadChecklists()
  }
  async function toggleCheck(item) {
    await supabase.from('task_checklists').update({ completed: !item.completed }).eq('id', item.id)
    loadChecklists()
  }
  async function deleteCheck(id) {
    await supabase.from('task_checklists').delete().eq('id', id); loadChecklists()
  }

  async function sendComment() {
    if (!newComment.trim()) return
    // Parse @mentions
    const mentions = []
    const re = /@([\w\s]+?)(?= |$|@)/g
    let m
    const text = newComment
    while ((m = re.exec(text)) !== null) {
      const found = members.find(mb => mb.full_name.toLowerCase() === m[1].trim().toLowerCase())
      if (found) mentions.push(found.id)
    }
    await supabase.from('task_comments').insert({
      task_id: task.id, author_id: user?.id, content: newComment.trim(),
      type: 'comment', metadata: mentions.length ? { mentions } : null
    })
    // Mention olunanlara bildiriş
    for (const mid of mentions) {
      if (mid !== user?.id) {
        await notify(mid, task.title + ' — yeni şərh', newComment.trim().slice(0, 80), 'info', '/tapshiriqlar')
      }
    }
    setNewComment('')
    loadComments()
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function saveDue() {
    if (newDue !== task.due_date) {
      const oldDue = task.due_date
      // Activity log — deadline dəyişikliyi qeyd olunur
      await supabase.from('task_comments').insert({
        task_id: task.id, author_id: user?.id, type: 'activity',
        content: `deadline dəyişdi`,
        metadata: { old_due: oldDue, new_due: newDue, changed_by: user?.id }
      })
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

            {assignee && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-[#f8fafc] rounded-lg">
                <Avatar name={assignee.full_name} size={5} />
                <span className="text-[11px] text-[#555] font-medium">{assignee.full_name.split(' ')[0]}</span>
              </div>
            )}

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
                {checklists.map(item => (
                  <div key={item.id} className="flex items-center gap-2.5 group py-1 px-2 rounded-lg hover:bg-[#f8fafc] transition-colors">
                    <button onClick={() => toggleCheck(item)}
                      className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        item.completed ? 'bg-[#22c55e] border-[#22c55e]' : 'border-[#d1d5db] hover:border-[#0f172a]'
                      }`}>
                      {item.completed && <IconCheck size={9} className="text-white" strokeWidth={3} />}
                    </button>
                    <span className={`text-xs flex-1 leading-relaxed transition-colors ${
                      item.completed ? 'line-through text-[#bbb]' : 'text-[#333]'
                    }`}>{item.title}</span>
                    <button onClick={() => deleteCheck(item.id)}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-[#ccc] hover:text-red-400 transition-all">
                      <IconX size={11} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 items-center border-t border-[#f5f5f0] pt-3">
                <input value={newCheck} onChange={e => setNewCheck(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addChecklist()}
                  className="flex-1 px-3 py-2 bg-[#f8fafc] border border-transparent rounded-xl text-xs focus:outline-none focus:border-[#0f172a] focus:bg-white transition-all placeholder-[#bbb]"
                  placeholder="Yeni addım əlavə et... (Enter)" />
                <button onClick={addChecklist}
                  className="w-8 h-8 flex items-center justify-center bg-[#0f172a] text-white rounded-xl hover:bg-[#1e293b] transition-colors flex-shrink-0">
                  <IconPlus size={13} />
                </button>
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
                  <MentionInput value={newComment} onChange={setNewComment} members={members}
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
function KanbanCard({ task, projects, members, checkCounts, commentCounts, onClick, onArchive, onDragStart, onDragEnd, isDragging }) {
  const project  = projects.find(p => p.id === task.project_id)
  const assignee = members.find(m => m.id === task.assignee_id)
  const days = daysLeft(task.due_date)
  const pr = prio(task.priority)
  const isDone = task.status === 'done'
  const overdue = !isDone && days !== null && days < 0
  const cc = checkCounts[task.id] || { done:0, total:0 }
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
      style={{ cursor: 'grab', marginBottom: '0' }}
    >
      {/* Main card */}
      <div onClick={() => onClick(task)}
        className={`bg-white rounded-2xl border transition-all duration-200 ${
          overdue
            ? 'border-red-200 hover:border-red-400 hover:shadow-md'
            : 'border-[#ebebeb] hover:border-[#c8c8c8] hover:shadow-md'
        }`}
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        {/* Priority top bar */}
        <div className="h-[3px] rounded-t-2xl" style={{ background: pr.color }} />

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
          <p className={`text-[12px] font-semibold leading-snug mb-3 ${isDone ? 'line-through text-[#c0c0c0]' : 'text-[#1a1a2e]'}`}>
            {task.title}
          </p>

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

            {/* Right: deadline */}
            {task.due_date && (
              <span className={`text-[9px] font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
                overdue
                  ? 'bg-red-50 text-red-500'
                  : days===0 ? 'bg-yellow-50 text-yellow-600'
                  : days!==null&&days<=3 ? 'bg-amber-50 text-amber-500'
                  : 'text-[#c0c0c0]'
              }`}>
                <IconCalendar size={9} />
                {overdue ? `${Math.abs(days)}g keçib` : days===0 ? 'Bu gün' : new Date(task.due_date).toLocaleDateString('az-AZ',{day:'numeric',month:'short'})}
              </span>
            )}
          </div>
        </div>
      </div>

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
function KanbanColumn({ column, tasks, projects, members, checkCounts, commentCounts, onCardClick, onQuickAdd, onArchive, dragTaskId, onDragStart, onDragEnd, onDrop, onDragOver, isDragOver }) {
  const [adding, setAdding] = useState(false)

  return (
    <div className="flex flex-col flex-1 min-w-[260px] max-w-[320px]">
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
        {tasks.map(task => (
          <KanbanCard key={task.id} task={task} projects={projects} members={members}
            checkCounts={checkCounts} commentCounts={commentCounts}
            onClick={onCardClick} onArchive={onArchive}
            onDragStart={onDragStart} onDragEnd={onDragEnd}
            isDragging={dragTaskId === task.id} />
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
  const { user } = useAuth()
  const [tasks,         setTasks]         = useState([])
  const [projects,      setProjects]      = useState([])
  const [members,       setMembers]       = useState([])
  const [checkCounts,   setCheckCounts]   = useState({})
  const [commentCounts, setCommentCounts] = useState({})
  const [loading,       setLoading]       = useState(true)
  const [view,          setView]          = useState('kanban')
  const [filterProj,    setFilterProj]    = useState('all')
  const [filterUser,    setFilterUser]    = useState('all')
  const [search,        setSearch]        = useState('')
  const [modalOpen,     setModalOpen]     = useState(false)
  const [defaultSt,     setDefaultSt]     = useState('not_started')
  const [editTask,      setEditTask]      = useState(null)
  const [deleteTask,    setDeleteTask]    = useState(null)
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

  async function loadData() {
    setLoading(true)
    const [tRes, pRes, mRes, ckRes, cmtRes] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name').order('name'),
      supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name'),
      supabase.from('task_checklists').select('task_id, completed'),
      supabase.from('task_comments').select('task_id, type'),
    ])
    setTasks(tRes.data || [])
    setProjects(pRes.data || [])
    setMembers(mRes.data || [])
    const cc = {}
    for (const item of (ckRes.data||[])) {
      if (!cc[item.task_id]) cc[item.task_id] = { done:0, total:0 }
      cc[item.task_id].total++
      if (item.completed) cc[item.task_id].done++
    }
    setCheckCounts(cc)
    const cmt = {}
    for (const item of (cmtRes.data||[])) {
      if (item.type === 'comment') cmt[item.task_id] = (cmt[item.task_id]||0) + 1
    }
    setCommentCounts(cmt)
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.title.trim()) { addToast('Tapşırıq adı daxil edin', 'error'); return }
    const data = { title:form.title.trim(), description:form.description||null, project_id:form.project_id||null, assignee_id:form.assignee_id||null, status:form.status, priority:form.priority, due_date:form.due_date||null, tags:form.tags||[], is_hidden:form.is_hidden||false }
    if (editTask) {
      const { error } = await supabase.from('tasks').update(data).eq('id', editTask.id)
      if (error) { addToast('Xəta: '+error.message,'error'); return }
      // Activity: status dəyişibsə qeyd et
      if (editTask.status !== data.status) {
        await supabase.from('task_comments').insert({ task_id:editTask.id, author_id:user?.id, type:'activity', content:'status dəyişdi', metadata:{ old_status:editTask.status, new_status:data.status } })
      }
      addToast('Tapşırıq yeniləndi','success')
    } else {
      const { data:inserted, error } = await supabase.from('tasks').insert(data).select().single()
      if (error) { addToast('Xəta: '+error.message,'error'); return }
      await supabase.from('task_comments').insert({ task_id:inserted.id, author_id:user?.id, type:'activity', content:'tapşırıq yaradıldı', metadata:{} })
      // Cavabdehə bildiriş
      if (data.assignee_id && data.assignee_id !== user?.id) {
        await notify(data.assignee_id, 'Yeni tapşırıq', data.title, 'info', '/tapshiriqlar')
      }
      addToast('Tapşırıq əlavə edildi','success')
    }
    setModalOpen(false); setEditTask(null)
    if (detailTask?.id === editTask?.id) setDetailTask(null)
    await loadData()
  }

  async function handleQuickSave(form) {
    const { data:inserted, error } = await supabase.from('tasks').insert({ title:form.title, status:form.status, project_id:form.project_id||null, assignee_id:form.assignee_id||null, priority:'medium', due_date:form.due_date||null, description:null }).select().single()
    if (error) { addToast('Xəta','error'); return }
    await supabase.from('task_comments').insert({ task_id:inserted.id, author_id:user?.id, type:'activity', content:'tapşırıq yaradıldı', metadata:{} })
    await loadData()
  }

  async function handleDelete() {
    await supabase.from('tasks').delete().eq('id', deleteTask.id)
    addToast('Silindi','success')
    setDeleteTask(null)
    if (detailTask?.id === deleteTask?.id) setDetailTask(null)
    await loadData()
  }

  async function handleStatusChange(task, newStatus) {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    await supabase.from('task_comments').insert({ task_id:task.id, author_id:user?.id, type:'activity', content:'status dəyişdi', metadata:{ old_status:task.status, new_status:newStatus } })
    // Tapşırıq sahibinə bildiriş (özü deyilsə)
    if (task.assignee_id && task.assignee_id !== user?.id && newStatus === 'done') {
      await notify(task.assignee_id, task.title, 'Tapşırıq tamamlandı kimi işarələndi', 'success', '/tapshiriqlar')
    }
    if (detailTask?.id === task.id) setDetailTask({ ...detailTask, status: newStatus })
    await loadData()
  }

  async function handleDeadlineChange(task, newDue) {
    await supabase.from('tasks').update({ due_date: newDue || null }).eq('id', task.id)
    if (detailTask?.id === task.id) setDetailTask({ ...detailTask, due_date: newDue })
    await loadData()
  }

  async function archiveDone() {
    const doneTasks = tasks.filter(t => t.status === 'done' && !t.archived)
    if (!doneTasks.length) { addToast('Arxivlənəcək tamamlanmış tapşırıq yoxdur','info'); return }
    const now = new Date()
    for (const t of doneTasks) {
      await supabase.from('tasks').update({ archived:true, archived_at:now.toISOString(), archive_year:now.getFullYear() }).eq('id', t.id)
    }
    addToast(`${doneTasks.length} tapşırıq arxivləndi`,'success')
    await loadData()
  }

  async function handleSingleArchive(task) {
    const now = new Date()
    await supabase.from('tasks').update({ archived:true, archived_at:now.toISOString(), archive_year:now.getFullYear() }).eq('id', task.id)
    addToast('Tapşırıq arxivləndi','success')
    if (detailTask?.id === task.id) setDetailTask(null)
    await loadData()
  }

  async function handleUnarchive(task) {
    await supabase.from('tasks').update({ archived:false, archived_at:null, archive_year:null }).eq('id', task.id)
    addToast('Tapşırıq geri qaytarıldı','success')
    await loadData()
  }

  async function handleDrop(targetColKey) {
    if (!dragTaskId || !targetColKey) return
    const task = tasks.find(t => t.id === dragTaskId)
    if (!task || task.status === targetColKey) {
      setDragTaskId(null); setDragOverCol(null); setDragOverIdx(null)
      return
    }
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === dragTaskId ? { ...t, status: targetColKey } : t))
    await supabase.from('tasks').update({ status: targetColKey }).eq('id', dragTaskId)
    await supabase.from('task_comments').insert({
      task_id: dragTaskId, author_id: user?.id, type: 'activity',
      content: 'status dəyişdi',
      metadata: { old_status: task.status, new_status: targetColKey }
    })
    if (detailTask?.id === dragTaskId) setDetailTask(prev => ({ ...prev, status: targetColKey }))
    setDragTaskId(null); setDragOverCol(null); setDragOverIdx(null)
  }

  const { isAdmin } = useAuth()
  const activeTasks = tasks.filter(t => !t.archived && (isAdmin || !t.is_hidden))
  const filtered = activeTasks.filter(t => {
    if (filterProj !== 'all' && t.project_id !== filterProj) return false
    if (filterUser !== 'all' && t.assignee_id !== filterUser) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filterTag !== 'all' && !(t.tags||[]).includes(filterTag)) return false
    // Gizli tapşırıqlar: showHidden=true olduqda yalnız hidden-lar, default-da hidden-lar gizlənir (non-admin üçün activeTasks-da artıq yoxdur)
    if (isAdmin && !showHidden && t.is_hidden) return false
    if (isAdmin && showHidden && !t.is_hidden) return false
    if (filterOverdue) { const d=daysLeft(t.due_date); if (t.status==='done'||d===null||d>=0) return false }
    return true
  })
  const tasksByCol = Object.fromEntries(COLUMNS.map(c => [c.key, filtered.filter(t => t.status===c.key)]))
  const overdueCount = activeTasks.filter(t => { const d=daysLeft(t.due_date); return t.status!=='done'&&d!==null&&d<0 }).length

  if (loading) return (
    <div className="p-4 lg:p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-4">{COLUMNS.map((_,i)=><Skeleton key={i} className="h-64 flex-1"/>)}</div>
    </div>
  )

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Top Bar ── */}
      <div className="px-4 lg:px-6 pt-5 pb-4 border-b border-[#e8e8e4] bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-sm font-bold text-[#0f172a]">Tapşırıqlar</h1>
            <p className="text-[11px] text-[#888] mt-0.5">
              {activeTasks.length} aktiv
              {overdueCount > 0 && <span className="text-red-500 font-medium ml-1.5">· {overdueCount} gecikmiş</span>}
              {tasks.filter(t=>t.archived).length > 0 && <span className="text-[#bbb] ml-1.5">· {tasks.filter(t=>t.archived).length} arxivdə</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border border-[#e8e8e4] rounded-lg overflow-hidden">
              <button onClick={() => setView('kanban')} className={`px-2.5 py-1.5 transition-colors ${view==='kanban'?'bg-[#0f172a] text-white':'text-[#555] hover:bg-[#f5f5f0]'}`}><IconLayoutKanban size={14}/></button>
              <button onClick={() => setView('list')}   className={`px-2.5 py-1.5 transition-colors ${view==='list'  ?'bg-[#0f172a] text-white':'text-[#555] hover:bg-[#f5f5f0]'}`}><IconList size={14}/></button>
            </div>
            <button onClick={() => setArchiveOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs text-[#555] hover:border-[#0f172a] transition-colors">
              <IconArchive size={13} /> Arxiv
            </button>
            <button onClick={archiveDone}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs text-[#555] hover:border-[#0f172a] transition-colors">
              Tamamlananları arxivlə
            </button>
            <Button onClick={() => { setEditTask(null); setDefaultSt('not_started'); setModalOpen(true) }} size="sm">
              <IconPlus size={14} /> Yeni tapşırıq
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

      {/* ── Board ── */}
      {view === 'kanban' ? (
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
              />
            ))}
          </div>
        </div>
      ) : (
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
                        {assignee && <div className="flex items-center gap-1.5"><Avatar name={assignee.full_name} size={5}/><span className="text-[10px] text-[#555]">{assignee.full_name.split(' ')[0]}</span></div>}
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
      <ArchiveModal open={archiveOpen} onClose={() => setArchiveOpen(false)}
        tasks={tasks} projects={projects} members={members} checkCounts={checkCounts} onUnarchive={handleUnarchive} />
    </div>
  )
}
