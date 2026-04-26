import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Badge, Card, Button, Skeleton } from '../components/ui'
import { IconAlertCircle, IconCheck, IconClock, IconSpeakerphone, IconCalendar, IconUmbrella, IconChevronRight, IconTrendingUp, IconStar } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'

const CAREER_LEVELS = [
  { key: 'L1', label: 'Principal / Founding Partner', az: 'Baş Ortaq', color: '#0a0a0a', text: '#f5f5f0', next: null, std_years: null },
  { key: 'L2', label: 'Senior Associate', az: 'Baş Əməkdaş', color: '#1a2744', text: '#dce8ff', next: 'L1', std_years: null },
  { key: 'L3', label: 'Project Architect', az: 'Layihə Memarı', color: '#1a3d2e', text: '#d0f0e0', next: 'L2', std_years: 5 },
  { key: 'L4', label: 'Architect', az: 'Memar', color: '#2d3a00', text: '#eaf0b0', next: 'L3', std_years: 4 },
  { key: 'L5', label: 'Junior Architect', az: 'Kiçik Memar', color: '#3a1f00', text: '#f5ddb0', next: 'L4', std_years: 3 },
  { key: 'L6', label: 'Architectural Assistant', az: 'Memar Köməkçisi', color: '#2a1540', text: '#e8d0ff', next: 'L5', std_years: 2 },
  { key: 'BD-1', label: 'Head of Business Development', az: 'BD Rəhbəri', color: '#1a3040', text: '#c0e0f8', next: null, std_years: null },
  { key: 'BD-2', label: 'Junior BD Manager', az: 'BD Menecer', color: '#0f2030', text: '#a8d0f0', next: 'BD-1', std_years: 3 },
]

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

function CareerCard({ profile, lastReview }) {
  const cl = CAREER_LEVELS.find(l => l.key === profile?.career_level)
  const nextCl = cl?.next ? CAREER_LEVELS.find(l => l.key === cl.next) : null

  // İşə başlamadan neçə il keçib
  const yearsAtCompany = profile?.joining_date
    ? Math.floor((new Date() - new Date(profile.joining_date)) / (365.25 * 86400000))
    : null

  if (!cl) return null

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <IconTrendingUp size={14} className="text-[#888]" />
        <span className="text-xs font-bold text-[#0f172a]">Karyera Yolum</span>
      </div>

      {/* Cari səviyyə */}
      <div className="rounded-xl px-3 py-2.5 mb-3" style={{ background: cl.color }}>
        <div className="text-[10px] font-bold tracking-wider mb-0.5" style={{ color: cl.text, opacity: 0.7 }}>{cl.key}</div>
        <div className="text-sm font-bold" style={{ color: cl.text }}>{cl.label}</div>
        <div className="text-[11px]" style={{ color: cl.text, opacity: 0.75 }}>{cl.az}</div>
      </div>

      {/* Son performans */}
      {lastReview && (
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs text-[#888]">Son performans skoru</span>
          <div className="flex items-center gap-1">
            <IconStar size={12} className="text-yellow-500" />
            <span className="text-xs font-bold text-[#0f172a]">{lastReview.total_score?.toFixed(1)}/5.0</span>
            <span className="text-[10px] text-[#aaa]">({lastReview.review_year})</span>
          </div>
        </div>
      )}

      {/* Promotion eligible */}
      {profile?.promotion_eligible && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-3 text-xs text-yellow-800 font-medium">
          🚀 Erkən yüksəliş hüququnuz var!
        </div>
      )}

      {/* Növbəti səviyyə */}
      {nextCl && (
        <div className="border border-[#e8e8e4] rounded-xl px-3 py-2.5">
          <div className="text-[10px] text-[#888] mb-1">Növbəti hədəf</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#0f172a]">{nextCl.key} — {nextCl.label}</div>
              <div className="text-[10px] text-[#888]">{nextCl.az}</div>
            </div>
            {cl.std_years && (
              <div className="text-right">
                <div className="text-xs font-bold text-[#0f172a]">{cl.std_years} il</div>
                <div className="text-[10px] text-[#aaa]">standart</div>
              </div>
            )}
          </div>
          {yearsAtCompany !== null && cl.std_years && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-[#aaa] mb-1">
                <span>{yearsAtCompany} il işləyirəm</span>
                <span>{cl.std_years} il lazımdır</span>
              </div>
              <div className="h-1.5 bg-[#f0f0ec] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (yearsAtCompany / cl.std_years) * 100)}%`,
                    background: cl.color
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Erkən yüksəliş meyarı */}
      <div className="mt-3 text-[10px] text-[#aaa] text-center">
        Erkən yüksəliş: 2 ardıcıl il 4.5+/5.0 performans tələb olunur
      </div>
    </Card>
  )
}

export default function EmployeeDashboardPage() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    overdueTasks: [], todayTasks: [], upcomingTasks: [],
    completedThisWeek: 0, notices: [], nextEvent: null,
    myLeaves: [], myProjects: [], lastReview: null
  })

  useEffect(() => { if (user?.id) loadData() }, [user])

  async function loadData() {
    setLoading(true)
    const today = new Date(); today.setHours(0,0,0,0)
    const todayStr = today.toISOString().split('T')[0]
    const weekAgo = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0]
    const in7days = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0]

    const [tasksRes, noticesRes, eventsRes, leavesRes, projectsRes, reviewsRes] = await Promise.all([
      supabase.from('tasks').select('*, projects(name)').eq('assignee_id', user.id).neq('status', 'cancelled'),
      supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(3),
      supabase.from('events').select('*').gte('start_date', todayStr).order('start_date').limit(1),
      supabase.from('leave_requests').select('*').eq('member_id', user.id).order('created_at', { ascending: false }).limit(3),
      supabase.from('projects').select('id, name, status, deadline, phases').neq('status', 'completed'),
      supabase.from('performance_reviews').select('*').eq('employee_id', user.id).order('review_year', { ascending: false }).limit(1),
    ])

    const tasks = tasksRes.data || []
    const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date).setHours(0,0,0,0) < today)
    const todayTasks = tasks.filter(t => t.status !== 'done' && t.due_date === todayStr)
    const upcomingTasks = tasks.filter(t => {
      if (t.status === 'done' || !t.due_date) return false
      const d = new Date(t.due_date); d.setHours(0,0,0,0)
      return d > today && t.due_date <= in7days
    })
    const completedThisWeek = tasks.filter(t => t.status === 'done' && t.updated_at >= weekAgo).length

    setData({
      overdueTasks, todayTasks, upcomingTasks, completedThisWeek,
      notices: noticesRes.data || [],
      nextEvent: (eventsRes.data || [])[0] || null,
      myLeaves: leavesRes.data || [],
      myProjects: projectsRes.data || [],
      lastReview: (reviewsRes.data || [])[0] || null
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

      {/* KPI */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`rounded-xl p-3 border ${data.overdueTasks.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-[#e8e8e4]'}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <IconAlertCircle size={14} className={data.overdueTasks.length > 0 ? 'text-red-500' : 'text-[#aaa]'} />
            <span className="text-[10px] text-[#888]">Gecikmiş</span>
          </div>
          <div className={`text-2xl font-bold ${data.overdueTasks.length > 0 ? 'text-red-600' : 'text-[#0f172a]'}`}>{data.overdueTasks.length}</div>
        </div>
        <div className={`rounded-xl p-3 border ${data.todayTasks.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-[#e8e8e4]'}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <IconClock size={14} className={data.todayTasks.length > 0 ? 'text-amber-500' : 'text-[#aaa]'} />
            <span className="text-[10px] text-[#888]">Bu gün</span>
          </div>
          <div className={`text-2xl font-bold ${data.todayTasks.length > 0 ? 'text-amber-600' : 'text-[#0f172a]'}`}>{data.todayTasks.length}</div>
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
            <button onClick={() => navigate('/tapshiriqlar')} className="text-[10px] text-blue-500 hover:underline">Hamısı →</button>
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
            <button onClick={() => navigate('/tapshiriqlar')} className="text-[10px] text-blue-500 hover:underline">Hamısı →</button>
          </div>
          {data.todayTasks.map(t => <TaskCard key={t.id} task={t} />)}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Karyera Yolum */}
        <CareerCard profile={profile} lastReview={data.lastReview} />

        <div className="space-y-4">
          {/* Son elanlar */}
          <Card>
            <div className="px-4 py-3 border-b border-[#e8e8e4] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconSpeakerphone size={14} className="text-[#888]" />
                <span className="text-xs font-bold text-[#0f172a]">Son elanlar</span>
              </div>
              <button onClick={() => navigate('/elanlar-lovhesi')} className="text-[10px] text-blue-500">Hamısı →</button>
            </div>
            {data.notices.length > 0 ? data.notices.map(n => (
              <div key={n.id} className="px-4 py-3 border-b border-[#f5f5f0] last:border-0">
                <div className="text-xs font-medium text-[#0f172a]">{n.title}</div>
                <div className="text-[10px] text-[#888] mt-0.5 line-clamp-1">{n.content}</div>
              </div>
            )) : <div className="px-4 py-4 text-center text-xs text-[#aaa]">Yeni elan yoxdur</div>}
          </Card>

          {/* Növbəti hadisə + Məzuniyyət */}
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
            ) : <div className="text-xs text-[#aaa]">Yaxın hadisə yoxdur</div>}
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <IconUmbrella size={14} className="text-[#888]" />
                <span className="text-xs font-bold text-[#0f172a]">Məzuniyyət sorğularım</span>
              </div>
              <button onClick={() => navigate('/mezuniyyet-cedveli')} className="text-[10px] text-blue-500">Yeni →</button>
            </div>
            {data.myLeaves.length > 0 ? data.myLeaves.slice(0, 2).map(l => (
              <div key={l.id} className="flex items-center justify-between py-1.5 border-b border-[#f5f5f0] last:border-0">
                <div className="text-[10px] text-[#555]">
                  {new Date(l.start_date).toLocaleDateString('az-AZ')} — {new Date(l.end_date).toLocaleDateString('az-AZ')}
                </div>
                <Badge variant={l.status === 'approved' ? 'success' : l.status === 'rejected' ? 'danger' : 'warning'} size="sm">
                  {l.status === 'approved' ? 'Təsdiqləndi' : l.status === 'rejected' ? 'Rədd edildi' : 'Gözləyir'}
                </Badge>
              </div>
            )) : <div className="text-xs text-[#aaa]">Sorğu yoxdur</div>}
          </Card>
        </div>
      </div>
    </div>
  )
}
