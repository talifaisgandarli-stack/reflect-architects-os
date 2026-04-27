import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { Button, Modal, ConfirmDialog, Skeleton } from '../components/ui'
import {
  IconPlus, IconX, IconEdit, IconTrash, IconCheck, IconSend,
  IconLayoutKanban, IconList, IconSearch, IconFilter,
  IconCalendar, IconUser, IconFlag, IconBuildings,
  IconCheckbox, IconMessage, IconChevronDown, IconChevronRight,
  IconAlertCircle, IconClock, IconDots
} from '@tabler/icons-react'

// ─── Constants ───────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'not_started', label: 'Başlanmayıb', color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0' },
  { key: 'in_progress',  label: 'İcrada',       color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'review',       label: 'Yoxlanılır',   color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { key: 'done',         label: 'Tamamlandı',   color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
]

const PRIORITIES = [
  { key: 'high',   label: 'Kritik',  color: '#ef4444', bg: '#fef2f2' },
  { key: 'medium', label: 'Orta',    color: '#f59e0b', bg: '#fffbeb' },
  { key: 'low',    label: 'Aşağı',   color: '#94a3b8', bg: '#f8fafc' },
]

const PROJECT_COLORS = [
  '#0f172a','#1d4ed8','#059669','#d97706','#7c3aed','#db2777','#0891b2','#16a34a'
]

function prio(key) { return PRIORITIES.find(p => p.key === key) || PRIORITIES[1] }
function col(key)  { return COLUMNS.find(c => c.key === key)  || COLUMNS[0] }

function projColor(id, projects) {
  const idx = projects.findIndex(p => p.id === id)
  return PROJECT_COLORS[idx % PROJECT_COLORS.length] || '#0f172a'
}

function daysLeft(due) {
  if (!due) return null
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(due); d.setHours(0,0,0,0)
  return Math.floor((d - today) / 86400000)
}

function Avatar({ name, size = 6, className = '' }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
  return (
    <div className={`w-${size} h-${size} rounded-full bg-[#0f172a] flex items-center justify-center flex-shrink-0 ${className}`}>
      <span className="text-white font-bold" style={{ fontSize: size === 6 ? 10 : size === 5 ? 9 : 8 }}>{initials}</span>
    </div>
  )
}

// ─── Task Form ────────────────────────────────────────────────────────────────
function TaskForm({ open, onClose, onSave, task, projects, members, defaultStatus }) {
  const [form, setForm] = useState({
    title: '', description: '', project_id: '', assignee_id: '',
    status: defaultStatus || 'not_started', priority: 'medium', due_date: ''
  })
  useEffect(() => {
    if (task) setForm({
      title: task.title || '', description: task.description || '',
      project_id: task.project_id || '', assignee_id: task.assignee_id || '',
      status: task.status || 'not_started', priority: task.priority || 'medium',
      due_date: task.due_date || ''
    })
    else setForm({ title: '', description: '', project_id: '', assignee_id: '',
      status: defaultStatus || 'not_started', priority: 'medium', due_date: '' })
  }, [task, open, defaultStatus])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Tapşırığı redaktə et' : 'Yeni tapşırıq'}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Tapşırıq adı *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} autoFocus
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="Tapşırığın adı..." />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Layihə</label>
            <select value={form.project_id} onChange={e => set('project_id', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="">— seçin</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Cavabdeh</label>
            <select value={form.assignee_id} onChange={e => set('assignee_id', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="">— seçin</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Prioritet</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[#555] mb-1">Deadline</label>
            <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Təsvir</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none"
            placeholder="Əlavə məlumat..." />
        </div>
        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto">{task ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ task, projects, members, onClose, onEdit, onDelete, onStatusChange }) {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [checklists, setChecklists] = useState([])
  const [comments, setComments]     = useState([])
  const [newCheck, setNewCheck]     = useState('')
  const [newComment, setNewComment] = useState('')
  const [activeTab, setActiveTab]   = useState('checklist')
  const commentEndRef = useRef(null)

  const project  = projects.find(p => p.id === task.project_id)
  const assignee = members.find(m => m.id === task.assignee_id)
  const days     = daysLeft(task.due_date)
  const pr       = prio(task.priority)
  const cl       = col(task.status)

  useEffect(() => {
    if (!task?.id) return
    loadChecklists()
    loadComments()
  }, [task?.id])

  async function loadChecklists() {
    const { data } = await supabase.from('task_checklists')
      .select('*').eq('task_id', task.id).order('position')
    setChecklists(data || [])
  }

  async function loadComments() {
    const { data } = await supabase.from('task_comments')
      .select('*, profiles(full_name)')
      .eq('task_id', task.id).order('created_at')
    setComments(data || [])
  }

  async function addChecklist() {
    if (!newCheck.trim()) return
    await supabase.from('task_checklists').insert({
      task_id: task.id, title: newCheck.trim(),
      completed: false, position: checklists.length
    })
    setNewCheck('')
    loadChecklists()
  }

  async function toggleChecklist(item) {
    await supabase.from('task_checklists').update({ completed: !item.completed }).eq('id', item.id)
    loadChecklists()
  }

  async function deleteChecklist(id) {
    await supabase.from('task_checklists').delete().eq('id', id)
    loadChecklists()
  }

  async function addComment() {
    if (!newComment.trim()) return
    await supabase.from('task_comments').insert({
      task_id: task.id, author_id: user?.id,
      content: newComment.trim(), type: 'comment'
    })
    setNewComment('')
    loadComments()
    setTimeout(() => commentEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const doneCount = checklists.filter(c => c.completed).length
  const checkPct  = checklists.length ? Math.round((doneCount / checklists.length) * 100) : 0

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden"
        style={{ borderLeft: '1px solid #e8e8e4' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-[#f0f0ec]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              {/* Priority stripe */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: pr.color }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: pr.color }}>
                  {pr.label}
                </span>
                {project && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium"
                    style={{ background: projColor(project.id, projects) }}>
                    {project.name}
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-[#0f172a] leading-snug">{task.title}</h2>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => onEdit(task)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f5f0] text-[#aaa] hover:text-[#0f172a] transition-colors">
                <IconEdit size={13} />
              </button>
              <button onClick={() => onDelete(task)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#aaa] hover:text-red-500 transition-colors">
                <IconTrash size={13} />
              </button>
              <button onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f5f0] text-[#aaa] hover:text-[#0f172a] transition-colors">
                <IconX size={13} />
              </button>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-3">
            {/* Status */}
            <select value={task.status} onChange={e => onStatusChange(task, e.target.value)}
              className="text-[11px] font-medium px-2 py-1 rounded-lg border cursor-pointer focus:outline-none"
              style={{ background: cl.bg, borderColor: cl.border, color: cl.color }}>
              {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>

            {/* Assignee */}
            {assignee && (
              <div className="flex items-center gap-1.5">
                <Avatar name={assignee.full_name} size={5} />
                <span className="text-[11px] text-[#555]">{assignee.full_name}</span>
              </div>
            )}

            {/* Deadline */}
            {task.due_date && (
              <div className={`flex items-center gap-1 text-[11px] font-medium ${
                days !== null && days < 0 ? 'text-red-500' :
                days === 0 ? 'text-yellow-600' : 'text-[#888]'
              }`}>
                <IconCalendar size={11} />
                {new Date(task.due_date).toLocaleDateString('az-AZ')}
                {days !== null && (
                  <span>{days < 0 ? ` · ${Math.abs(days)}g keçib` : days === 0 ? ' · Bu gün' : ` · ${days}g`}</span>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-[#666] leading-relaxed mt-3 pb-3 border-t border-[#f5f5f0] pt-3">
              {task.description}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#f0f0ec] px-5">
          {[
            { key: 'checklist', label: 'Checklist', count: checklists.length },
            { key: 'comments',  label: 'Şərhlər',   count: comments.filter(c => c.type === 'comment').length },
            { key: 'activity',  label: 'Aktivlik',  count: null },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-[#0f172a] text-[#0f172a]'
                  : 'border-transparent text-[#888] hover:text-[#555]'
              }`}>
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className="text-[9px] bg-[#0f172a] text-white px-1.5 py-0.5 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
          {checklists.length > 0 && activeTab === 'checklist' && (
            <div className="ml-auto flex items-center gap-2 py-2">
              <div className="h-1 w-24 bg-[#f0f0ec] rounded-full overflow-hidden">
                <div className="h-full bg-[#22c55e] rounded-full transition-all"
                  style={{ width: `${checkPct}%` }} />
              </div>
              <span className="text-[10px] text-[#888]">{doneCount}/{checklists.length}</span>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Checklist ── */}
          {activeTab === 'checklist' && (
            <div className="p-5">
              <div className="space-y-1.5 mb-4">
                {checklists.map(item => (
                  <div key={item.id} className="flex items-center gap-2.5 group">
                    <button onClick={() => toggleChecklist(item)}
                      className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        item.completed
                          ? 'bg-[#22c55e] border-[#22c55e]'
                          : 'border-[#d1d5db] hover:border-[#0f172a]'
                      }`}>
                      {item.completed && <IconCheck size={9} className="text-white" strokeWidth={3} />}
                    </button>
                    <span className={`text-xs flex-1 ${item.completed ? 'line-through text-[#aaa]' : 'text-[#333]'}`}>
                      {item.title}
                    </span>
                    <button onClick={() => deleteChecklist(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#ccc] hover:text-red-400 transition-all">
                      <IconX size={11} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newCheck} onChange={e => setNewCheck(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addChecklist()}
                  className="flex-1 px-3 py-2 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none focus:border-[#0f172a]"
                  placeholder="Yeni addım əlavə et..." />
                <button onClick={addChecklist}
                  className="px-3 py-2 bg-[#0f172a] text-white rounded-lg text-xs font-medium hover:bg-[#1e293b] transition-colors">
                  <IconPlus size={12} />
                </button>
              </div>
            </div>
          )}

          {/* ── Comments ── */}
          {activeTab === 'comments' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 p-5 space-y-4 overflow-y-auto">
                {comments.filter(c => c.type === 'comment').length === 0 && (
                  <div className="text-center py-8 text-xs text-[#bbb]">
                    Hələ şərh yoxdur
                  </div>
                )}
                {comments.filter(c => c.type === 'comment').map(c => {
                  const author = members.find(m => m.id === c.author_id)
                  const isMe = c.author_id === user?.id
                  return (
                    <div key={c.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <Avatar name={author?.full_name || '?'} size={6} className="flex-shrink-0 mt-0.5" />
                      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#aaa]">{author?.full_name?.split(' ')[0] || '?'}</span>
                          <span className="text-[10px] text-[#ccc]">
                            {new Date(c.created_at).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-[#0f172a] text-white rounded-tr-sm'
                            : 'bg-[#f5f5f0] text-[#333] rounded-tl-sm'
                        }`}>
                          {c.content}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={commentEndRef} />
              </div>
              <div className="p-4 border-t border-[#f0f0ec]">
                <div className="flex gap-2">
                  <input value={newComment} onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && addComment()}
                    className="flex-1 px-3 py-2.5 border border-[#e8e8e4] rounded-xl text-xs focus:outline-none focus:border-[#0f172a]"
                    placeholder="Şərh yazın..." />
                  <button onClick={addComment} disabled={!newComment.trim()}
                    className="w-9 h-9 flex items-center justify-center bg-[#0f172a] text-white rounded-xl hover:bg-[#1e293b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    <IconSend size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Activity ── */}
          {activeTab === 'activity' && (
            <div className="p-5 space-y-3">
              {comments.length === 0 && (
                <div className="text-center py-8 text-xs text-[#bbb]">Aktivlik yoxdur</div>
              )}
              {[...comments].reverse().map(c => {
                const author = members.find(m => m.id === c.author_id)
                return (
                  <div key={c.id} className="flex gap-2.5">
                    <Avatar name={author?.full_name || '?'} size={5} className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-medium text-[#0f172a]">
                          {author?.full_name || 'Sistem'}
                        </span>
                        <span className="text-[11px] text-[#666]">
                          {c.type === 'comment' ? 'şərh yazdı' : c.content}
                        </span>
                        <span className="text-[10px] text-[#bbb]">
                          {new Date(c.created_at).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' })}
                          {' '}
                          {new Date(c.created_at).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {c.type === 'comment' && (
                        <p className="text-xs text-[#888] mt-0.5 leading-relaxed">{c.content}</p>
                      )}
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
function KanbanCard({ task, projects, members, checkCounts, commentCounts, onClick }) {
  const project  = projects.find(p => p.id === task.project_id)
  const assignee = members.find(m => m.id === task.assignee_id)
  const days     = daysLeft(task.due_date)
  const pr       = prio(task.priority)
  const isDone   = task.status === 'done'
  const overdue  = !isDone && days !== null && days < 0
  const cc       = checkCounts[task.id] || { done: 0, total: 0 }
  const cmtCount = commentCounts[task.id] || 0

  return (
    <div
      onClick={() => onClick(task)}
      className="bg-white rounded-xl border border-[#e8e8e4] p-3 cursor-pointer hover:border-[#0f172a] hover:shadow-sm transition-all duration-150 group relative"
    >
      {/* Priority left bar */}
      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
        style={{ background: pr.color }} />

      <div className="pl-2.5">
        {/* Project tag */}
        {project && (
          <div className="flex items-center gap-1 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: projColor(project.id, projects) }} />
            <span className="text-[9px] font-semibold uppercase tracking-wider"
              style={{ color: projColor(project.id, projects) }}>
              {project.name}
            </span>
          </div>
        )}

        {/* Title */}
        <p className={`text-xs font-medium leading-snug mb-2.5 ${isDone ? 'line-through text-[#aaa]' : 'text-[#0f172a]'}`}>
          {task.title}
        </p>

        {/* Checklist progress */}
        {cc.total > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex-1 h-1 bg-[#f0f0ec] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#22c55e] transition-all"
                style={{ width: `${Math.round((cc.done / cc.total) * 100)}%` }} />
            </div>
            <span className="text-[9px] text-[#aaa]">{cc.done}/{cc.total}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {assignee && <Avatar name={assignee.full_name} size={5} />}
            {cmtCount > 0 && (
              <div className="flex items-center gap-0.5 text-[#aaa]">
                <IconMessage size={10} />
                <span className="text-[9px]">{cmtCount}</span>
              </div>
            )}
          </div>

          {task.due_date && (
            <span className={`text-[9px] font-medium flex items-center gap-0.5 ${
              overdue ? 'text-red-500' :
              days === 0 ? 'text-yellow-600' :
              days !== null && days <= 3 ? 'text-amber-500' :
              'text-[#bbb]'
            }`}>
              <IconCalendar size={9} />
              {overdue ? `${Math.abs(days)}g keçib` :
               days === 0 ? 'Bu gün' :
               new Date(task.due_date).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Kanban Column ────────────────────────────────────────────────────────────
function KanbanColumn({ column, tasks, projects, members, checkCounts, commentCounts, onCardClick, onAddClick }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex flex-col min-w-[260px] max-w-[280px]">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <button onClick={() => setCollapsed(c => !c)} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: column.color }} />
            <span className="text-xs font-bold text-[#0f172a]">{column.label}</span>
          </button>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: column.bg, color: column.color }}>
            {tasks.length}
          </span>
        </div>
        <button onClick={() => onAddClick(column.key)}
          className="w-5 h-5 flex items-center justify-center rounded-md text-[#aaa] hover:text-[#0f172a] hover:bg-[#f5f5f0] transition-colors">
          <IconPlus size={12} />
        </button>
      </div>

      {/* Cards */}
      {!collapsed && (
        <div className="flex flex-col gap-2 flex-1">
          {tasks.map(task => (
            <KanbanCard
              key={task.id}
              task={task}
              projects={projects}
              members={members}
              checkCounts={checkCounts}
              commentCounts={commentCounts}
              onClick={onCardClick}
            />
          ))}
          {tasks.length === 0 && (
            <div
              className="border-2 border-dashed border-[#e8e8e4] rounded-xl p-4 text-center cursor-pointer hover:border-[#bbb] transition-colors"
              onClick={() => onAddClick(column.key)}>
              <span className="text-xs text-[#ccc]">+ Əlavə et</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── List Row ─────────────────────────────────────────────────────────────────
function ListRow({ task, projects, members, checkCounts, commentCounts, onClick, onStatusChange }) {
  const project  = projects.find(p => p.id === task.project_id)
  const assignee = members.find(m => m.id === task.assignee_id)
  const days     = daysLeft(task.due_date)
  const pr       = prio(task.priority)
  const cl       = col(task.status)
  const isDone   = task.status === 'done'
  const overdue  = !isDone && days !== null && days < 0
  const cc       = checkCounts[task.id] || { done: 0, total: 0 }

  return (
    <tr className={`border-b border-[#f5f5f0] hover:bg-[#fafaf8] cursor-pointer group ${overdue ? 'bg-red-50/30' : ''}`}
      onClick={() => onClick(task)}>
      <td className="px-4 py-2.5 w-3">
        <div className="w-0.5 h-8 rounded-full" style={{ background: pr.color }} />
      </td>
      <td className="py-2.5 pr-4">
        <div className={`text-xs font-medium ${isDone ? 'line-through text-[#aaa]' : 'text-[#0f172a]'}`}>
          {task.title}
        </div>
        {project && (
          <div className="flex items-center gap-1 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: projColor(project.id, projects) }} />
            <span className="text-[9px]" style={{ color: projColor(project.id, projects) }}>{project.name}</span>
          </div>
        )}
      </td>
      <td className="py-2.5 pr-4">
        {assignee && (
          <div className="flex items-center gap-1.5">
            <Avatar name={assignee.full_name} size={5} />
            <span className="text-[10px] text-[#555]">{assignee.full_name.split(' ')[0]}</span>
          </div>
        )}
      </td>
      <td className="py-2.5 pr-4">
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ background: cl.bg, color: cl.color }}>
          {cl.label}
        </span>
      </td>
      <td className="py-2.5 pr-4">
        {task.due_date && (
          <span className={`text-[10px] font-medium ${
            overdue ? 'text-red-500' : days === 0 ? 'text-yellow-600' : 'text-[#888]'
          }`}>
            {new Date(task.due_date).toLocaleDateString('az-AZ')}
            {overdue && <span className="ml-1">({Math.abs(days)}g)</span>}
          </span>
        )}
      </td>
      <td className="py-2.5 pr-4">
        {cc.total > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-12 h-1 bg-[#f0f0ec] rounded-full overflow-hidden">
              <div className="h-full bg-[#22c55e] rounded-full"
                style={{ width: `${Math.round((cc.done / cc.total) * 100)}%` }} />
            </div>
            <span className="text-[9px] text-[#aaa]">{cc.done}/{cc.total}</span>
          </div>
        )}
      </td>
    </tr>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TapshiriqlarPage() {
  const { addToast } = useToast()
  const { user }     = useAuth()

  const [tasks,         setTasks]         = useState([])
  const [projects,      setProjects]      = useState([])
  const [members,       setMembers]       = useState([])
  const [checkCounts,   setCheckCounts]   = useState({})
  const [commentCounts, setCommentCounts] = useState({})
  const [loading,       setLoading]       = useState(true)

  const [view,       setView]       = useState('kanban')
  const [filterProj, setFilterProj] = useState('all')
  const [filterUser, setFilterUser] = useState('all')
  const [search,     setSearch]     = useState('')

  const [modalOpen,    setModalOpen]    = useState(false)
  const [defaultStatus,setDefaultStatus]= useState('not_started')
  const [editTask,     setEditTask]     = useState(null)
  const [deleteTask,   setDeleteTask]   = useState(null)
  const [detailTask,   setDetailTask]   = useState(null)

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

    // Checklist counts per task
    const cc = {}
    for (const item of (ckRes.data || [])) {
      if (!cc[item.task_id]) cc[item.task_id] = { done: 0, total: 0 }
      cc[item.task_id].total++
      if (item.completed) cc[item.task_id].done++
    }
    setCheckCounts(cc)

    // Comment counts per task
    const cmt = {}
    for (const item of (cmtRes.data || [])) {
      if (item.type === 'comment') cmt[item.task_id] = (cmt[item.task_id] || 0) + 1
    }
    setCommentCounts(cmt)
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.title.trim()) { addToast('Tapşırıq adı daxil edin', 'error'); return }
    const data = {
      title: form.title.trim(), description: form.description || null,
      project_id: form.project_id || null, assignee_id: form.assignee_id || null,
      status: form.status, priority: form.priority, due_date: form.due_date || null,
    }
    if (editTask) {
      const { error } = await supabase.from('tasks').update(data).eq('id', editTask.id)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Tapşırıq yeniləndi', 'success')
    } else {
      const { error } = await supabase.from('tasks').insert(data)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Tapşırıq əlavə edildi', 'success')
    }
    setModalOpen(false); setEditTask(null)
    if (detailTask?.id === editTask?.id) setDetailTask(null)
    await loadData()
  }

  async function handleDelete() {
    await supabase.from('tasks').delete().eq('id', deleteTask.id)
    addToast('Silindi', 'success')
    setDeleteTask(null)
    if (detailTask?.id === deleteTask?.id) setDetailTask(null)
    await loadData()
  }

  async function handleStatusChange(task, newStatus) {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    // Activity log
    await supabase.from('task_comments').insert({
      task_id: task.id, author_id: user?.id,
      content: `status dəyişdi: ${col(task.status).label} → ${col(newStatus).label}`,
      type: 'activity'
    })
    if (detailTask?.id === task.id) setDetailTask({ ...detailTask, status: newStatus })
    await loadData()
  }

  // Filtered tasks
  const filtered = tasks.filter(t => {
    if (filterProj !== 'all' && t.project_id !== filterProj) return false
    if (filterUser !== 'all' && t.assignee_id !== filterUser) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const tasksByCol = Object.fromEntries(
    COLUMNS.map(c => [c.key, filtered.filter(t => t.status === c.key)])
  )

  const totalDone    = tasks.filter(t => t.status === 'done').length
  const totalOverdue = tasks.filter(t => {
    const d = daysLeft(t.due_date)
    return t.status !== 'done' && d !== null && d < 0
  }).length

  if (loading) return (
    <div className="p-4 lg:p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-4">
        {COLUMNS.map((_, i) => <Skeleton key={i} className="h-64 flex-1" />)}
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col">

      {/* ── Top Bar ── */}
      <div className="px-4 lg:px-6 pt-5 pb-4 border-b border-[#e8e8e4] bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-base font-bold text-[#0f172a]">Tapşırıqlar</h1>
            <p className="text-xs text-[#888] mt-0.5">
              {tasks.length} tapşırıq · {totalDone} tamamlandı
              {totalOverdue > 0 && <span className="text-red-500 font-medium"> · {totalOverdue} gecikmiş</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex border border-[#e8e8e4] rounded-lg overflow-hidden">
              <button onClick={() => setView('kanban')}
                className={`px-2.5 py-1.5 text-xs transition-colors ${view === 'kanban' ? 'bg-[#0f172a] text-white' : 'text-[#555] hover:bg-[#f5f5f0]'}`}>
                <IconLayoutKanban size={14} />
              </button>
              <button onClick={() => setView('list')}
                className={`px-2.5 py-1.5 text-xs transition-colors ${view === 'list' ? 'bg-[#0f172a] text-white' : 'text-[#555] hover:bg-[#f5f5f0]'}`}>
                <IconList size={14} />
              </button>
            </div>
            <Button onClick={() => { setEditTask(null); setDefaultStatus('not_started'); setModalOpen(true) }} size="sm">
              <IconPlus size={14} /> Yeni tapşırıq
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e8e8e4] rounded-lg bg-white">
            <IconSearch size={12} className="text-[#aaa]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="text-xs outline-none w-36 placeholder-[#bbb]"
              placeholder="Axtar..." />
          </div>

          {/* Project filter */}
          <select value={filterProj} onChange={e => setFilterProj(e.target.value)}
            className="px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none focus:border-[#0f172a] bg-white">
            <option value="all">Bütün layihələr</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          {/* Assignee filter */}
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
            className="px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none focus:border-[#0f172a] bg-white">
            <option value="all">Bütün üzvlər</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>

          {/* Active filters indicator */}
          {(filterProj !== 'all' || filterUser !== 'all' || search) && (
            <button onClick={() => { setFilterProj('all'); setFilterUser('all'); setSearch('') }}
              className="flex items-center gap-1 px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs text-[#888] hover:text-red-500 hover:border-red-200 transition-colors">
              <IconX size={11} /> Filtrləri sıfırla
            </button>
          )}

          {/* Stats */}
          <div className="ml-auto flex gap-3 items-center">
            {COLUMNS.map(c => (
              <div key={c.key} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                <span className="text-[10px] text-[#888]">{tasksByCol[c.key]?.length || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Board / List ── */}
      {view === 'kanban' ? (
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4 lg:p-6">
          <div className="flex gap-4 h-full min-h-0" style={{ minWidth: 'max-content' }}>
            {COLUMNS.map(column => (
              <KanbanColumn
                key={column.key}
                column={column}
                tasks={tasksByCol[column.key] || []}
                projects={projects}
                members={members}
                checkCounts={checkCounts}
                commentCounts={commentCounts}
                onCardClick={t => setDetailTask(t)}
                onAddClick={status => {
                  setEditTask(null)
                  setDefaultStatus(status)
                  setModalOpen(true)
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-4 lg:px-6 py-4">
          <div className="bg-white border border-[#e8e8e4] rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e8e8e4]">
                  <th className="w-3 px-4 py-3" />
                  <th className="text-left py-3 pr-4 font-semibold text-[#888]">Tapşırıq</th>
                  <th className="text-left py-3 pr-4 font-semibold text-[#888]">Cavabdeh</th>
                  <th className="text-left py-3 pr-4 font-semibold text-[#888]">Status</th>
                  <th className="text-left py-3 pr-4 font-semibold text-[#888]">Deadline</th>
                  <th className="text-left py-3 pr-4 font-semibold text-[#888]">Checklist</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-xs text-[#bbb]">Tapşırıq yoxdur</td></tr>
                ) : filtered.map(task => (
                  <ListRow key={task.id} task={task} projects={projects} members={members}
                    checkCounts={checkCounts} commentCounts={commentCounts}
                    onClick={t => setDetailTask(t)}
                    onStatusChange={handleStatusChange} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Detail Panel ── */}
      {detailTask && (
        <DetailPanel
          task={detailTask}
          projects={projects}
          members={members}
          onClose={() => setDetailTask(null)}
          onEdit={t => { setEditTask(t); setModalOpen(true) }}
          onDelete={t => { setDeleteTask(t); setDetailTask(null) }}
          onStatusChange={handleStatusChange}
        />
      )}

      <TaskForm
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(null) }}
        onSave={handleSave}
        task={editTask}
        projects={projects}
        members={members}
        defaultStatus={defaultStatus}
      />
      <ConfirmDialog
        open={!!deleteTask}
        title="Tapşırığı sil"
        message={`"${deleteTask?.title}" tapşırığını silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTask(null)}
        danger
      />
    </div>
  )
}
