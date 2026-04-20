import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton } from '../components/ui'
import { IconCheckbox, IconPlus, IconEdit, IconTrash, IconAlertCircle } from '@tabler/icons-react'

const STATUSES = [
  { key: 'not_started', label: 'Başlanmayıb', color: 'default' },
  { key: 'in_progress', label: 'İcrada', color: 'info' },
  { key: 'done', label: 'Tamamlandı', color: 'success' },
  { key: 'cancelled', label: 'Ləğv edildi', color: 'danger' },
]

const PRIORITIES = [
  { key: 'high', label: 'Yüksək', color: 'danger' },
  { key: 'medium', label: 'Orta', color: 'warning' },
  { key: 'low', label: 'Aşağı', color: 'default' },
]

function TaskForm({ open, onClose, onSave, task, projects, members }) {
  const [form, setForm] = useState({
    title: '', description: '', project_id: '', assignee_id: '',
    status: 'not_started', priority: 'medium', due_date: ''
  })

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '', description: task.description || '',
        project_id: task.project_id || '', assignee_id: task.assignee_id || '',
        status: task.status || 'not_started', priority: task.priority || 'medium',
        due_date: task.due_date || ''
      })
    } else {
      setForm({ title: '', description: '', project_id: '', assignee_id: '', status: 'not_started', priority: 'medium', due_date: '' })
    }
  }, [task, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Tapşırığı redaktə et' : 'Yeni tapşırıq'}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Tapşırıq adı *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="Tapşırığın adı" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Layihə</label>
            <select value={form.project_id} onChange={e => set('project_id', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="">Layihə seçin</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Cavabdeh</label>
            <select value={form.assignee_id} onChange={e => set('assignee_id', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              <option value="">Seçin</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
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
            <label className="block text-xs font-medium text-[#555] mb-1">Prioritet</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Deadline</label>
            <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Təsvir</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
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

function TaskRow({ task, members, onEdit, onDelete, onToggle }) {
  const days = task.due_date ? Math.floor((new Date(task.due_date) - new Date()) / 86400000) : null
  const st = STATUSES.find(s => s.key === task.status)
  const pr = PRIORITIES.find(p => p.key === task.priority)
  const overdue = days !== null && days < 0 && task.status !== 'done'
  const assignee = members.find(m => m.id === task.assignee_id)

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-[#f5f5f0] last:border-0 hover:bg-[#fafaf8] group ${overdue ? 'bg-red-50/30' : ''}`}>
      <button onClick={() => onToggle(task)} className="flex-shrink-0">
        <div className={`w-4 h-4 rounded border-2 transition-colors flex items-center justify-center ${task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-[#ddd] hover:border-[#0f172a]'}`}>
          {task.status === 'done' && <span className="text-white text-[8px] font-bold">✓</span>}
        </div>
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-medium ${task.status === 'done' ? 'line-through text-[#aaa]' : 'text-[#0f172a]'}`}>{task.title}</div>
        <div className="flex items-center gap-2 mt-0.5">
          {assignee && <span className="text-[10px] text-[#aaa]">{assignee.full_name}</span>}
          {overdue && <span className="text-[10px] text-red-500 flex items-center gap-0.5"><IconAlertCircle size={10} />{Math.abs(days)}g keçmiş</span>}
        </div>
      </div>
      <Badge variant={st?.color} size="sm">{st?.label}</Badge>
      <Badge variant={pr?.color} size="sm">{pr?.label}</Badge>
      {task.due_date && !overdue && (
        <span className={`text-[10px] ${days <= 3 ? 'text-yellow-600 font-medium' : 'text-[#aaa]'}`}>
          {days === 0 ? 'Bu gün' : `${days}g`}
        </span>
      )}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(task)} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={12} /></button>
        <button onClick={() => onDelete(task)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={12} /></button>
      </div>
    </div>
  )
}

export default function TapshiriqlarPage() {
  const { addToast } = useToast()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [deleteTask, setDeleteTask] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [tRes, pRes, mRes] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name').order('name'),
      supabase.from('profiles').select('id, full_name').order('full_name'),
    ])
    setTasks(tRes.data || [])
    setProjects(pRes.data || [])
    setMembers(mRes.data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.title.trim()) { addToast('Tapşırıq adı daxil edin', 'error'); return }
    const data = {
      title: form.title.trim(),
      description: form.description || null,
      project_id: form.project_id || null,
      assignee_id: form.assignee_id || null,
      status: form.status,
      priority: form.priority,
      due_date: form.due_date || null
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
    setModalOpen(false)
    setEditTask(null)
    await loadData()
  }

  async function handleDelete() {
    const { error } = await supabase.from('tasks').delete().eq('id', deleteTask.id)
    if (error) { addToast('Xəta', 'error'); return }
    addToast('Tapşırıq silindi', 'success')
    setDeleteTask(null)
    await loadData()
  }

  async function toggleStatus(task) {
    const next = task.status === 'done' ? 'not_started' : task.status === 'not_started' ? 'in_progress' : 'done'
    await supabase.from('tasks').update({ status: next }).eq('id', task.id)
    await loadData()
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  const grouped = {}
  projects.forEach(p => {
    const pts = filtered.filter(t => t.project_id === p.id)
    if (pts.length > 0) grouped[p.id] = { name: p.name, tasks: pts }
  })
  const noProject = filtered.filter(t => !t.project_id)

  if (loading) return <div className="p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 fade-in">
      <PageHeader
        title="Tapşırıqlar"
        subtitle={`${tasks.length} tapşırıq · ${tasks.filter(t => t.status === 'done').length} tamamlandı`}
        action={
          <Button onClick={() => { setEditTask(null); setModalOpen(true) }} size="sm">
            <IconPlus size={14} /> Yeni tapşırıq
          </Button>
        }
      />

      <div className="flex gap-1 mb-4 border-b border-[#e8e8e4]">
        {[{ key: 'all', label: 'Hamısı' }, ...STATUSES].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              filter === s.key ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#888] hover:text-[#555]'
            }`}>
            {s.label}
            <span className="ml-1 text-[10px] text-[#aaa]">
              {s.key === 'all' ? tasks.length : tasks.filter(t => t.status === s.key).length}
            </span>
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={IconCheckbox}
          title="Hələ tapşırıq yoxdur"
          description="İlk tapşırığı əlavə edin"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> Tapşırıq əlavə et</Button>}
        />
      ) : (
        <div className="space-y-4">
          {Object.values(grouped).map(group => (
            <Card key={group.name}>
              <div className="px-4 py-3 border-b border-[#f0f0ec]">
                <span className="text-xs font-bold text-[#0f172a]">{group.name}</span>
                <span className="ml-2 text-[10px] text-[#aaa]">{group.tasks.length} tapşırıq</span>
              </div>
              {group.tasks.map(task => (
                <TaskRow key={task.id} task={task} members={members}
                  onEdit={t => { setEditTask(t); setModalOpen(true) }}
                  onDelete={setDeleteTask} onToggle={toggleStatus} />
              ))}
            </Card>
          ))}
          {noProject.length > 0 && (
            <Card>
              <div className="px-4 py-3 border-b border-[#f0f0ec]">
                <span className="text-xs font-bold text-[#888]">Layihəsiz tapşırıqlar</span>
                <span className="ml-2 text-[10px] text-[#aaa]">{noProject.length}</span>
              </div>
              {noProject.map(task => (
                <TaskRow key={task.id} task={task} members={members}
                  onEdit={t => { setEditTask(t); setModalOpen(true) }}
                  onDelete={setDeleteTask} onToggle={toggleStatus} />
              ))}
            </Card>
          )}
        </div>
      )}

      <TaskForm open={modalOpen} onClose={() => { setModalOpen(false); setEditTask(null) }}
        onSave={handleSave} task={editTask} projects={projects} members={members} />
      <ConfirmDialog open={!!deleteTask} title="Tapşırığı sil"
        message={`"${deleteTask?.title}" tapşırığını silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteTask(null)} danger />
    </div>
  )
}
