import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Skeleton } from '../components/ui'
import { useNavigate } from 'react-router-dom'

const CAREER_LEVELS = [
  { key: 'RA-1', label: 'Founding Partner', az: 'CEO & Chief Architect', color: '#0a0a0a', text: '#f5f5f0', next: null, std_years: null },
  { key: 'RA-2', label: 'Partner', az: 'Ortaq', color: '#1c1c1c', text: '#e8e8e0', next: 'RA-1', std_years: null },
  { key: 'L2',   label: 'Senior Associate', az: 'Baş Əməkdaş', color: '#1a2744', text: '#dce8ff', next: 'RA-2', std_years: null },
  { key: 'L3',   label: 'Project Architect', az: 'Layihə Memarı', color: '#1a3d2e', text: '#d0f0e0', next: 'L2', std_years: 5 },
  { key: 'L4',   label: 'Architect', az: 'Memar', color: '#2d3a00', text: '#eaf0b0', next: 'L3', std_years: 4 },
  { key: 'L5',   label: 'Junior Architect', az: 'Kiçik Memar', color: '#3a1f00', text: '#f5ddb0', next: 'L4', std_years: 3 },
  { key: 'L6',   label: 'Architectural Assistant', az: 'Memar Köməkçisi', color: '#2a1540', text: '#e8d0ff', next: 'L5', std_years: 2 },
  { key: 'BD-1', label: 'Head of BD', az: 'BD Rəhbəri', color: '#1a3040', text: '#c0e0f8', next: null, std_years: null },
  { key: 'BD-2', label: 'Junior BD Manager', az: 'BD Menecer', color: '#0f2030', text: '#a8d0f0', next: 'BD-1', std_years: 3 },
]

function daysLeft(due) {
  if (!due) return null
  const t = new Date(); t.setHours(0,0,0,0)
  const d = new Date(due); d.setHours(0,0,0,0)
  return Math.floor((d - t) / 86400000)
}

export default function EmployeeDashboardPage() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    overdueTasks: [], todayTasks: [], upcomingTasks: [],
    completedThisWeek: 0, allTasks: [],
    notices: [], nextEvent: null,
    myLeaves: [], lastReview: null
  })

  useEffect(() => { if (user?.id) loadData() }, [user])

  async function loadData() {
    setLoading(true)
    const today    = new Date(); today.setHours(0,0,0,0)
    const todayStr = today.toISOString().split('T')[0]
    const weekAgo  = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0]
    const in7days  = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0]

    const [tRes, nRes, eRes, lRes, rRes] = await Promise.all([
      supabase.from('tasks').select('*, projects(name)').eq('assignee_id', user.id).neq('status', 'cancelled'),
      supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(4),
      supabase.from('events').select('*').gte('start_date', todayStr).order('start_date').limit(3),
      supabase.from('leave_requests').select('*').eq('member_id', user.id).order('created_at', { ascending: false }).limit(3),
      supabase.from('performance_reviews').select('*').eq('employee_id', user.id).order('review_year', { ascending: false }).limit(1),
    ])

    const tasks = tRes.data || []
    setData({
      allTasks: tasks,
      overdueTasks:     tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date).setHours(0,0,0,0) < today),
      todayTasks:       tasks.filter(t => t.status !== 'done' && t.due_date === todayStr),
      upcomingTasks:    tasks.filter(t => { if (t.status === 'done' || !t.due_date) return false; const d = new Date(t.due_date); d.setHours(0,0,0,0); return d > today && t.due_date <= in7days }),
      completedThisWeek:tasks.filter(t => t.status === 'done' && t.updated_at >= weekAgo).length,
      notices:          nRes.data || [],
      nextEvent:        (eRes.data || [])[0] || null,
      upcomingEvents:   eRes.data || [],
      myLeaves:         lRes.data || [],
      lastReview:       (rRes.data || [])[0] || null,
    })
    setLoading(false)
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Əməkdaş'
  const cl        = CAREER_LEVELS.find(l => l.key === profile?.career_level)
  const nextCl    = cl?.next ? CAREER_LEVELS.find(l => l.key === cl.next) : null
  const yearsAt   = profile?.joining_date ? Math.floor((new Date() - new Date(profile.joining_date)) / (365.25 * 86400000)) : null
  const now       = new Date()
  const hour      = now.getHours()
  const greeting  = firstName
  const dayFmt    = now.toLocaleDateString('az-AZ', { weekday: 'long', day: 'numeric', month: 'long' })

  const donePct = data.allTasks.length
    ? Math.round(data.allTasks.filter(t => t.status === 'done').length / data.allTasks.filter(t => t.status !== 'cancelled').length * 100)
    : 0

  if (loading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-32" />
      <div className="grid grid-cols-3 gap-3">{[0,1,2].map(i => <Skeleton key={i} className="h-24" />)}</div>
      <Skeleton className="h-64" />
    </div>
  )

  return (
    <div className="min-h-full bg-[#fafaf8] fade-in">

      {/* ── Hero Header ── */}
      <div className="bg-[#0f172a] px-6 pt-8 pb-10 relative overflow-hidden">
        {/* Arxitektura grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* RA brend nişanı */}
        <div className="absolute top-6 right-6 w-10 h-10 border border-white/20 rounded-xl flex items-center justify-center">
          <span className="text-white/40 text-[10px] font-black tracking-widest">RA</span>
        </div>

        <div className="relative">
          {/* Karyera səviyyəsi pill */}
          {cl && (
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full" style={{ background: cl.text }} />
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: cl.text, opacity: 0.7 }}>
                {cl.key} · {cl.az}
              </span>
            </div>
          )}

          <h1 className="text-2xl font-bold text-white mb-0.5">{firstName},</h1>
          <h1 className="text-2xl font-bold text-white/90 mb-3">xoş gördük.</h1>
          <p className="text-sm text-white/40 capitalize">{dayFmt}</p>

          {/* Promotion badge */}
          {profile?.promotion_eligible && (
            <div className="mt-4 inline-flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-3 py-1.5">
              <span className="text-yellow-400 text-xs">🚀</span>
              <span className="text-yellow-300 text-[11px] font-semibold">Erkən yüksəliş hüququnuz var</span>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Bar ── */}
      <div className="grid grid-cols-4 border-b border-[#e8e8e4] bg-white">
        {[
          {
            label: 'Gecikmiş',
            value: data.overdueTasks.length,
            accent: data.overdueTasks.length > 0 ? '#ef4444' : '#94a3b8',
            bg: data.overdueTasks.length > 0 ? '#fef2f2' : 'white',
            onClick: () => navigate('/tapshiriqlar'),
          },
          {
            label: 'Bu gün',
            value: data.todayTasks.length,
            accent: data.todayTasks.length > 0 ? '#f59e0b' : '#94a3b8',
            bg: data.todayTasks.length > 0 ? '#fffbeb' : 'white',
            onClick: () => navigate('/tapshiriqlar'),
          },
          {
            label: 'Bu həftə',
            value: data.upcomingTasks.length,
            accent: '#3b82f6',
            bg: 'white',
            onClick: () => navigate('/tapshiriqlar'),
          },
          {
            label: 'Tamamlandı',
            value: data.completedThisWeek,
            accent: '#22c55e',
            bg: 'white',
            onClick: () => navigate('/tapshiriqlar'),
          },
        ].map((stat, i) => (
          <button key={i} onClick={stat.onClick}
            className="flex flex-col items-center justify-center py-4 border-r border-[#f0f0ec] last:border-0 hover:bg-[#fafaf8] transition-colors"
            style={{ background: stat.bg }}>
            <div className="text-2xl font-black" style={{ color: stat.accent }}>{stat.value}</div>
            <div className="text-[10px] text-[#888] mt-0.5 font-medium">{stat.label}</div>
          </button>
        ))}
      </div>

      {/* ── Main Content ── */}
      <div className="p-5 space-y-4">

        {/* Gecikmiş + bu gün tapşırıqlar */}
        {(data.overdueTasks.length > 0 || data.todayTasks.length > 0) && (
          <div className="bg-white rounded-2xl border border-[#e8e8e4] overflow-hidden">
            {data.overdueTasks.length > 0 && (
              <>
                <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-xs font-bold text-red-700">Gecikmiş tapşırıqlar</span>
                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">{data.overdueTasks.length}</span>
                  </div>
                  <button onClick={() => navigate('/tapshiriqlar')} className="text-[10px] text-red-500 font-medium">Hamısı →</button>
                </div>
                {data.overdueTasks.slice(0, 3).map(t => {
                  const d = daysLeft(t.due_date)
                  return (
                    <div key={t.id} onClick={() => navigate('/tapshiriqlar')}
                      className="flex items-center gap-3 px-4 py-3 border-b border-[#fef2f2] last:border-0 hover:bg-red-50/50 cursor-pointer group">
                      <div className="w-1 h-8 rounded-full bg-red-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[#0f172a] truncate">{t.title}</div>
                        {t.projects?.name && <div className="text-[10px] text-[#aaa]">{t.projects.name}</div>}
                      </div>
                      <span className="text-[10px] font-bold text-red-500 flex-shrink-0">{Math.abs(d)}g keçib</span>
                    </div>
                  )
                })}
              </>
            )}
            {data.todayTasks.length > 0 && (
              <>
                <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-amber-700">Bu günün tapşırıqları</span>
                    <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">{data.todayTasks.length}</span>
                  </div>
                  <button onClick={() => navigate('/tapshiriqlar')} className="text-[10px] text-amber-600 font-medium">Hamısı →</button>
                </div>
                {data.todayTasks.slice(0, 3).map(t => (
                  <div key={t.id} onClick={() => navigate('/tapshiriqlar')}
                    className="flex items-center gap-3 px-4 py-3 border-b border-[#fffbeb] last:border-0 hover:bg-amber-50/50 cursor-pointer">
                    <div className="w-1 h-8 rounded-full bg-amber-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#0f172a] truncate">{t.title}</div>
                      {t.projects?.name && <div className="text-[10px] text-[#aaa]">{t.projects.name}</div>}
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 flex-shrink-0">Bu gün</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── 3 sütun ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Karyera */}
          {cl && (
            <div className="rounded-2xl overflow-hidden border border-[#e8e8e4]">
              <div className="p-4" style={{ background: cl.color }}>
                <div className="text-[9px] font-black tracking-widest mb-2" style={{ color: cl.text, opacity: 0.5 }}>KARYERAm</div>
                <div className="text-base font-bold leading-tight" style={{ color: cl.text }}>{cl.label}</div>
                <div className="text-[11px] mt-0.5" style={{ color: cl.text, opacity: 0.65 }}>{cl.az}</div>

                {data.lastReview && (
                  <div className="mt-3 flex items-center gap-1.5">
                    <div className="text-[10px] font-bold" style={{ color: cl.text, opacity: 0.5 }}>Son performans:</div>
                    <div className="text-[11px] font-black" style={{ color: cl.text }}>
                      {data.lastReview.total_score?.toFixed(1)} / 5.0
                    </div>
                  </div>
                )}
              </div>

              {nextCl && (
                <div className="bg-white p-3.5 border-t border-[#f0f0ec]">
                  <div className="text-[9px] font-bold text-[#aaa] uppercase tracking-wider mb-2">Növbəti hədəf</div>
                  <div className="text-xs font-bold text-[#0f172a]">{nextCl.label}</div>
                  {cl.std_years && yearsAt !== null && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-[#aaa] mb-1">
                        <span>{yearsAt} il</span>
                        <span>{cl.std_years} il lazım</span>
                      </div>
                      <div className="h-1 bg-[#f0f0ec] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: Math.min(100, yearsAt / cl.std_years * 100) + '%', background: cl.color }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => navigate('/karyera-strukturu')}
                className="w-full py-2.5 text-center text-[10px] font-bold text-[#0f172a]/50 hover:text-[#0f172a] transition-colors border-t border-[#f0f0ec] bg-white">
                Tam karyera yolu →
              </button>
            </div>
          )}

          {/* Elanlar */}
          <div className="bg-white rounded-2xl border border-[#e8e8e4] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#f0f0ec] flex items-center justify-between">
              <span className="text-xs font-bold text-[#0f172a]">Elanlar</span>
              <button onClick={() => navigate('/elanlar-lovhesi')} className="text-[10px] text-[#888] hover:text-[#0f172a]">Hamısı →</button>
            </div>
            {data.notices.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-[#bbb]">Yeni elan yoxdur</div>
            ) : data.notices.map(n => (
              <div key={n.id} className="px-4 py-3 border-b border-[#f8f8f5] last:border-0 hover:bg-[#fafaf8] cursor-pointer transition-colors"
                onClick={() => navigate('/elanlar-lovhesi')}>
                <div className="flex items-start gap-2">
                  <span className="text-base flex-shrink-0 mt-0.5">{n.icon || '📢'}</span>
                  <div>
                    <div className="text-xs font-semibold text-[#0f172a] leading-snug">{n.title}</div>
                    {n.content && <div className="text-[10px] text-[#888] mt-0.5 line-clamp-1 leading-relaxed">{n.content}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sağ panel: hadisələr + məzuniyyət */}
          <div className="space-y-3">

            {/* Hadisələr */}
            <div className="bg-white rounded-2xl border border-[#e8e8e4] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#f0f0ec] flex items-center justify-between">
                <span className="text-xs font-bold text-[#0f172a]">Yaxın hadisələr</span>
                <button onClick={() => navigate('/hadiseler')} className="text-[10px] text-[#888] hover:text-[#0f172a]">Hamısı →</button>
              </div>
              {!data.nextEvent ? (
                <div className="px-4 py-4 text-xs text-[#bbb] text-center">Yaxın hadisə yoxdur</div>
              ) : (
                <div className="px-4 py-3">
                  <div className="text-xs font-semibold text-[#0f172a]">{data.nextEvent.title}</div>
                  <div className="text-[10px] text-[#888] mt-0.5">
                    {new Date(data.nextEvent.start_date).toLocaleDateString('az-AZ', { day: 'numeric', month: 'long' })}
                    {(() => { const d = daysLeft(data.nextEvent.start_date); return d === 0 ? ' · Bu gün' : d === 1 ? ' · Sabah' : d > 0 ? ` · ${d} gün` : '' })()}
                  </div>
                </div>
              )}
            </div>

            {/* Məzuniyyət */}
            <div className="bg-white rounded-2xl border border-[#e8e8e4] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#f0f0ec] flex items-center justify-between">
                <span className="text-xs font-bold text-[#0f172a]">Məzuniyyət</span>
                <button onClick={() => navigate('/mezuniyyet-cedveli')} className="text-[10px] text-[#0f172a] font-semibold hover:opacity-70">+ Sorğu</button>
              </div>
              {data.myLeaves.length === 0 ? (
                <div className="px-4 py-4 text-xs text-[#bbb] text-center">Aktiv sorğu yoxdur</div>
              ) : data.myLeaves.slice(0, 2).map(l => {
                const status = l.status === 'approved' ? { label: 'Təsdiqləndi', color: '#22c55e', bg: '#f0fdf4' }
                  : l.status === 'rejected' ? { label: 'Rədd edildi', color: '#ef4444', bg: '#fef2f2' }
                  : { label: 'Gözləyir', color: '#f59e0b', bg: '#fffbeb' }
                return (
                  <div key={l.id} className="px-4 py-2.5 border-b border-[#f8f8f5] last:border-0 flex items-center justify-between">
                    <div className="text-[10px] text-[#555]">
                      {new Date(l.start_date).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' })}
                      {' – '}
                      {new Date(l.end_date).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' })}
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Tapşırıq progress */}
            <div className="bg-[#0f172a] rounded-2xl p-4">
              <div className="text-[9px] font-black tracking-widest text-white/40 mb-3">ÜMUMİ PROGRESS</div>
              <div className="flex items-end justify-between mb-2">
                <div className="text-3xl font-black text-white">{donePct}<span className="text-lg text-white/50">%</span></div>
                <div className="text-[10px] text-white/40 text-right">
                  <div>{data.allTasks.filter(t => t.status === 'done').length} tamamlandı</div>
                  <div>{data.allTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled').length} açıq</div>
                </div>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: donePct + '%' }} />
              </div>
            </div>

          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { label: 'Tapşırıqlar', to: '/tapshiriqlar', emoji: '✅' },
            { label: 'Performans',  to: '/performans',   emoji: '⭐' },
            { label: 'Karyera',     to: '/karyera-strukturu', emoji: '📈' },
            { label: 'Hadisələr',   to: '/hadiseler',   emoji: '📅' },
            { label: 'Məzuniyyət',  to: '/mezuniyyet', emoji: '🏖' },
            { label: 'Sənəd Arxivi',to: '/sened-arxivi', emoji: '📁' },
          ].map(link => (
            <button key={link.to} onClick={() => navigate(link.to)}
              className="bg-white border border-[#e8e8e4] rounded-xl py-3 px-2 flex flex-col items-center gap-1.5 hover:border-[#0f172a] hover:shadow-sm transition-all group">
              <span className="text-xl">{link.emoji}</span>
              <span className="text-[10px] font-semibold text-[#555] group-hover:text-[#0f172a] text-center leading-tight">{link.label}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
