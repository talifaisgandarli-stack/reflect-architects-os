import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Badge, Card, Skeleton } from '../components/ui'
import { IconAlertCircle, IconCheck, IconClock, IconSpeakerphone, IconCalendar, IconUmbrella, IconChevronRight } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

function TaskCard({ task }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const due = task.due_date ? new Date(task.due_date) : null
  if (due) due.setHours(0,0,0,0)
  const days = due ? Math.floor((due - today) / 86400000) : null
  const overdue = days !== null && days < 0

  return (
    <div className={`flex items-start gap-3 px-4 py-3 border-b border-[#f5f5f0] last:border-0 ${overdue ? 'bg-red-50/40' : ''}`}>
      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${overdue ? 'bg-red-500' : days === 0 ? 'bg-yellow-500' : 'bg-[#0f172a]'}`} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-[#0f172a] truncate">{task.title}</div>
        {task.projects?.name && <div className="text-[10px] text-[#aaa] mt-0.5">{task.projects.name}</div>}
      </div>
      {days !== null && (
        <span className={`text-[10px] font-medium flex-shrink-0 ${overdue ? 'text-red-500' : days === 0 ? 'text-yellow-600' : 'text-[#888]'}`}>
          {overdue ? `${Math.abs(days)}g keçmiş` : days === 0 ? 'Bu gün' : `${days}g`}
        </span>
      )}
    </div>
  )
}

export default function EmployeeDashboardPage() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    overdueTasks: [], todayTasks: [], upcomingTasks: [],
    completedThisWeek: 0, notices: [], nextEvent: null,
    myLeaves: [], myProjects: []
  })

  useEffect(() => { if (user?.id) loadData() }, [user])

  async function loadData() {
    setLoading(true)
    const today = new Date(); today.setHours(0,0,0,0)
    const todayStr = today.toISOString().split('T')[0]
    const weekAgo = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0]
    const in7days = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0]

    const [tasksRes, noticesRes, eventsRes, leavesRes, projectsRes] = await Promise.all([
      supabase.from('tasks').select('*, projects(name)').eq('assignee_id', user.id).neq('status', 'cancelled'),
      supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(3),
      supabase.from('events').select('*').gte('start_date', todayStr).order('start_date').limit(1),
      supabase.from('leave_requests').select('*').eq('member_id', user.id).order('created_at', { ascending: false }).limit(3),
      supabase.from('projects').select('id, name, status, deadline, phases').neq('status', 'completed'),
    ])

    const tasks = tasksRes.data || []
    const overdueTasks = tasks.filter(t => {
      if (t.status === 'done') return false
      if (!t.due_date) return false
      const d = new Date(t.due_date); d.setHours(0,0,0,0)
      return d < today
    })
    const todayTasks = tasks.filter(t => {
      if (t.status === 'done') return false
      return t.due_date === todayStr
    })
    const upcomingTasks = tasks.filter(t => {
      if (t.status === 'done') return false
      if (!t.due_date) return false
      const d = new Date(t.due_date); d.setHours(0,0,0,0)
      return d > today && t.due_date <= in7days
    })
    const completedThisWeek = tasks.filter(t => t.status === 'done' && t.updated_at >= weekAgo).length

    setData({
      overdueTasks,
      todayTasks,
      upcomingTasks,
      completedThisWeek,
      notices: noticesRes.data || [],
      nextEvent: (eventsRes.data || [])[0] || null,
      myLeaves: leavesRes.data || [],
      myProjects: projectsRes.data || []
    })
    setLoading(false)
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Əməkdaş'
  const todayFmt = new Date().toLocaleDateString('az-AZ', { weekday: 'long', day: 'numeric', month: 'long' })

  if (loading) return (
    <div className="p-4 lg:p-6 space-y-4">
      <Skeleton className="h-16" />
      <div className="grid grid-cols-3 gap-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      <Skeleton className="h-48" />
    </div>
  )

  return (
    <div className="p-4 lg:p-6 fade-in space-y-4">

      {/* Welcome */}
      <div>
        <h1 className="text-lg font-bold text-[#0f172a]">Salam, {firstName}! 👋</h1>
        <p className="text-xs text-[#888] mt-0.5 capitalize">{todayFmt}</p>
      </div>

      {/* KPI kartlar */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`rounded-xl p-3 border ${data.overdueTasks.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-[#e8e8e4]'}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <IconAlertCircle size={14} className={data.overdueTasks.length > 0 ? 'text-red-500' : 'text-[#aaa]'} />
            <span className="text-[10px] text-[#888]">Gecikmiş</span>
          </div>
          <div className={`text-2xl font-bold ${data.overdueTasks.length > 0 ? 'text-red-600' : 'text-[#0f172a]'}`}>
            {data.overdueTasks.length}
          </div>
        </div>
        <div className={`rounded-xl p-3 border ${data.todayTasks.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-[#e8e8e4]'}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <IconClock size={14} className={data.todayTasks.length > 0 ? 'text-amber-500' : 'text-[#aaa]'} />
            <span className="text-[10px] text-[#888]">Bu gün</span>
          </div>
          <div className={`text-2xl font-bold ${data.todayTasks.length > 0 ? 'text-amber-600' : 'text-[#0f172a]'}`}>
            {data.todayTasks.length}
          </div>
        </div>
        <div className="rounded-xl p-3 border bg-green-50 border-green-200">
          <div className="flex items-center gap-1.5 mb-1">
            <IconCheck size={14} className="text-green-500" />
            <span className="text-[10px] text-[#888]">Bu həftə</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{data.completedThisWeek}</div>
        </div>
      </div>

      {/* Gecikmiş tapşırıqlar */}
      {data.overdueTasks.length > 0 && (
        <Card>
          <div className="px-4 py-3 border-b border-[#e8e8e4] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs font-bold text-[#0f172a]">Gecikmiş tapşırıqlar</span>
            </div>
            <button onClick={() => navigate('/tapshiriqlar')} className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5">
              Hamısı <IconChevronRight size={10} />
            </button>
          </div>
          {data.overdueTasks.slice(0, 4).map(t => <TaskCard key={t.id} task={t} />)}
        </Card>
      )}

      {/* Bu günün tapşırıqları */}
      {data.todayTasks.length > 0 && (
        <Card>
          <div className="px-4 py-3 border-b border-[#e8e8e4] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-[#0f172a]">Bu günün tapşırıqları</span>
            </div>
            <button onClick={() => navigate('/tapshiriqlar')} className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5">
              Hamısı <IconChevronRight size={10} />
            </button>
          </div>
          {data.todayTasks.map(t => <TaskCard key={t.id} task={t} />)}
        </Card>
      )}

      {/* Yaxınlaşan tapşırıqlar */}
      {data.upcomingTasks.length > 0 && (
        <Card>
          <div className="px-4 py-3 border-b border-[#e8e8e4]">
            <span className="text-xs font-bold text-[#0f172a]">Bu həftənin tapşırıqları</span>
          </div>
          {data.upcomingTasks.slice(0, 3).map(t => <TaskCard key={t.id} task={t} />)}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Son elanlar */}
        <Card>
          <div className="px-4 py-3 border-b border-[#e8e8e4] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconSpeakerphone size={14} className="text-[#888]" />
              <span className="text-xs font-bold text-[#0f172a]">Son elanlar</span>
            </div>
            <button onClick={() => navigate('/elanlar-lovhesi')} className="text-[10px] text-blue-500 hover:underline">Hamısı →</button>
          </div>
          {data.notices.length > 0 ? (
            data.notices.map(n => (
              <div key={n.id} className="px-4 py-3 border-b border-[#f5f5f0] last:border-0">
                <div className="flex items-start gap-2">
                  {n.priority === 'urgent' && <span className="text-red-500 text-[10px] font-bold mt-0.5">TƏCİLİ</span>}
                  <div>
                    <div className="text-xs font-medium text-[#0f172a]">{n.title}</div>
                    <div className="text-[10px] text-[#888] mt-0.5 line-clamp-1">{n.content}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-xs text-[#aaa]">Yeni elan yoxdur</div>
          )}
        </Card>

        <div className="space-y-4">
          {/* Növbəti hadisə */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <IconCalendar size={14} className="text-[#888]" />
              <span className="text-xs font-bold text-[#0f172a]">Növbəti hadisə</span>
            </div>
            {data.nextEvent ? (
              <div>
                <div className="text-xs font-medium text-[#0f172a]">{data.nextEvent.title}</div>
                <div className="text-[10px] text-[#888] mt-0.5">
                  {new Date(data.nextEvent.start_date).toLocaleDateString('az-AZ', { day: 'numeric', month: 'long' })}
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#aaa]">Yaxın hadisə yoxdur</div>
            )}
          </Card>

          {/* Məzuniyyət statusu */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <IconUmbrella size={14} className="text-[#888]" />
                <span className="text-xs font-bold text-[#0f172a]">Məzuniyyət sorğularım</span>
              </div>
              <button onClick={() => navigate('/mezuniyyet-cedveli')} className="text-[10px] text-blue-500 hover:underline">Yeni →</button>
            </div>
            {data.myLeaves.length > 0 ? (
              data.myLeaves.slice(0, 2).map(l => (
                <div key={l.id} className="flex items-center justify-between py-1.5 border-b border-[#f5f5f0] last:border-0">
                  <div className="text-[10px] text-[#555]">
                    {new Date(l.start_date).toLocaleDateString('az-AZ')} — {new Date(l.end_date).toLocaleDateString('az-AZ')}
                  </div>
                  <Badge variant={l.status === 'approved' ? 'success' : l.status === 'rejected' ? 'danger' : 'warning'} size="sm">
                    {l.status === 'approved' ? 'Təsdiqləndi' : l.status === 'rejected' ? 'Rədd edildi' : 'Gözləyir'}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-xs text-[#aaa]">Sorğu yoxdur</div>
            )}
          </Card>
        </div>
      </div>

      {/* Mənim layihələrim */}
      {data.myProjects.length > 0 && (
        <Card>
          <div className="px-4 py-3 border-b border-[#e8e8e4]">
            <span className="text-xs font-bold text-[#0f172a]">Aktiv layihələr</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
            {data.myProjects.slice(0, 4).map(p => {
              const daysLeft = p.deadline ? Math.floor((new Date(p.deadline) - new Date()) / 86400000) : null
              return (
                <div key={p.id} className="px-4 py-3 border-b border-r border-[#f5f5f0]">
                  <div className="text-xs font-medium text-[#0f172a] truncate">{p.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {Array.isArray(p.phases) && p.phases.slice(0, 2).map(ph => (
                      <span key={ph} className="text-[9px] bg-[#f5f5f0] text-[#555] px-1.5 py-0.5 rounded">{ph}</span>
                    ))}
                    {daysLeft !== null && (
                      <span className={`text-[10px] ml-auto ${daysLeft < 0 ? 'text-red-500' : daysLeft <= 7 ? 'text-yellow-600' : 'text-[#aaa]'}`}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}g keçmiş` : `${daysLeft}g`}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
