import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { StatCard, Badge, Card, Skeleton } from '../components/ui'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import { IconAlertTriangle, IconArrowUp, IconArrowDown } from '@tabler/icons-react'

const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek']
const COLORS = ['#0f172a', '#3b82f6', '#16a34a', '#ca8a04', '#dc2626', '#7c3aed']

export default function DashboardPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPortfolio: 0, totalIncome: 0, totalDebt: 0, balance: 0,
    activeProjects: 0, overdueTasksCount: 0,
    monthlyIncome: [], clientBreakdown: [], projectStatus: [], agingDebt: [],
    deadlines: [], overdueReceivables: []
  })

  useEffect(() => { loadDashboard() }, [])

  async function loadDashboard() {
    try {
      const [projectsRes, incomesRes, debtsRes] = await Promise.all([
        supabase.from('projects').select('id, name, contract_value, status, deadline, client_id, clients(name)'),
        supabase.from('incomes').select('amount, payment_date, project_id'),
        supabase.from('receivables').select('expected_amount, paid_amount, expected_date, paid'),
      ])

      const projects = projectsRes.data || []
      const incomes = incomesRes.data || []
      const debts = debtsRes.data || []

      const totalPortfolio = projects.reduce((s, p) => s + (p.contract_value || 0), 0)
      const totalIncome = incomes.reduce((s, i) => s + (i.amount || 0), 0)
      const totalDebt = debts.filter(d => !d.paid).reduce((s, d) => s + ((d.expected_amount || 0) - (d.paid_amount || 0)), 0)
      const activeProjects = projects.filter(p => p.status === 'active').length

      // Monthly income for current year
      const currentYear = new Date().getFullYear()
      const monthlyIncome = MONTHS.map((month, idx) => {
        const total = incomes
          .filter(i => {
            const d = new Date(i.payment_date)
            return d.getFullYear() === currentYear && d.getMonth() === idx
          })
          .reduce((s, i) => s + (i.amount || 0), 0)
        return { month, amount: total }
      })

      // Client breakdown
      const clientMap = {}
      projects.forEach(p => {
        const name = p.clients?.name || 'Digər'
        clientMap[name] = (clientMap[name] || 0) + (p.contract_value || 0)
      })
      const clientBreakdown = Object.entries(clientMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)

      // Project status
      const statusMap = { active: 'İcrada', waiting: 'Gözləyir', completed: 'Tamamlandı' }
      const statusCount = {}
      projects.forEach(p => {
        const s = statusMap[p.status] || p.status
        statusCount[s] = (statusCount[s] || 0) + 1
      })
      const projectStatus = Object.entries(statusCount).map(([name, count]) => ({ name, count }))

      // Aging receivables
      const today = new Date()
      const aging = { '0–30 gün': 0, '31–60 gün': 0, '60+ gün': 0 }
      const overdueReceivables = []
      debts.filter(d => !d.paid).forEach(d => {
        const days = Math.floor((today - new Date(d.expected_date)) / 86400000)
        if (days <= 30) aging['0–30 gün'] += (d.expected_amount - d.paid_amount)
        else if (days <= 60) aging['31–60 gün'] += (d.expected_amount - d.paid_amount)
        else {
          aging['60+ gün'] += (d.expected_amount - d.paid_amount)
          overdueReceivables.push({ ...d, days })
        }
      })
      const agingDebt = Object.entries(aging).map(([name, amount]) => ({ name, amount }))

      // Upcoming deadlines
      const deadlines = projects
        .filter(p => p.deadline && p.status !== 'completed')
        .map(p => ({ ...p, daysLeft: Math.floor((new Date(p.deadline) - today) / 86400000) }))
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 5)

      setStats({
        totalPortfolio, totalIncome, totalDebt, balance: 51543,
        activeProjects, overdueTasksCount: 5,
        monthlyIncome, clientBreakdown, projectStatus, agingDebt,
        deadlines, overdueReceivables
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n) => '₼' + Math.round(n).toLocaleString()

  if (loading) return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-48" />)}
      </div>
    </div>
  )

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Sabahınız xeyir' : today.getHours() < 17 ? 'Günortanız xeyir' : 'Axşamınız xeyir'

  return (
    <div className="p-6 space-y-5 fade-in">

      {/* Greeting */}
      <div>
        <h1 className="text-lg font-bold text-[#0f172a]">
          {greeting}, {profile?.full_name?.split(' ')[0] || 'Nicat'}
        </h1>
        <p className="text-xs text-[#888] mt-0.5">
          {today.toLocaleDateString('az-AZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {stats.overdueTasksCount > 0 && ` · ${stats.overdueTasksCount} vaxtı keçmiş tapşırıq`}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Layihə portfeli" value={fmt(stats.totalPortfolio)} sub={`${stats.activeProjects} aktiv layihə`} />
        <StatCard label="Daxilolmalar" value={fmt(stats.totalIncome)} sub="Ödənilmiş" variant="success" />
        <StatCard label="Debitor borclar" value={fmt(stats.totalDebt)} sub="Gözlənilən alacaqlar" variant="danger" />
        <StatCard label="Şirkət balansı" value={fmt(stats.balance)} sub="Bank + nağd" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Monthly income bar chart */}
        <Card className="p-4">
          <div className="text-xs font-bold text-[#0f172a] mb-3">Aylıq daxilolmalar — {new Date().getFullYear()}</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats.monthlyIncome} barSize={20}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v) => [fmt(v), 'Daxilolma']}
                contentStyle={{ fontSize: 11, border: '1px solid #e8e8e4', borderRadius: 6 }}
              />
              <Bar dataKey="amount" fill="#0f172a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Client breakdown donut */}
        <Card className="p-4">
          <div className="text-xs font-bold text-[#0f172a] mb-3">Sifarişçi üzrə bölgü</div>
          {stats.clientBreakdown.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={stats.clientBreakdown} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55}>
                    {stats.clientBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {stats.clientBreakdown.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-[#555] truncate flex-1">{item.name}</span>
                    <span className="font-medium text-[#0f172a]">
                      {stats.totalPortfolio > 0 ? Math.round(item.value / stats.totalPortfolio * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-xs text-[#aaa]">
              Layihə əlavə edildikdən sonra görünəcək
            </div>
          )}
        </Card>
      </div>

      {/* Aging + Project status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Aging debt chart */}
        <Card className="p-4">
          <div className="text-xs font-bold text-[#0f172a] mb-3">Debitor yaşlandırma</div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={stats.agingDebt} barSize={32} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip formatter={(v) => [fmt(v), 'Məbləğ']} contentStyle={{ fontSize: 11, border: '1px solid #e8e8e4', borderRadius: 6 }} />
              <Bar dataKey="amount" radius={[0, 3, 3, 0]}>
                {stats.agingDebt.map((entry, i) => (
                  <Cell key={i} fill={entry.name === '60+ gün' ? '#dc2626' : entry.name === '31–60 gün' ? '#ca8a04' : '#0f172a'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Project status */}
        <Card className="p-4">
          <div className="text-xs font-bold text-[#0f172a] mb-3">Layihə statusu</div>
          {stats.projectStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={stats.projectStatus} barSize={32}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ fontSize: 11, border: '1px solid #e8e8e4', borderRadius: 6 }} />
                <Bar dataKey="count" fill="#0f172a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-24 flex items-center justify-center text-xs text-[#aaa]">
              Layihə əlavə edildikdən sonra görünəcək
            </div>
          )}
        </Card>
      </div>

      {/* Bottom tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Upcoming deadlines */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-[#0f172a]">Yaxınlaşan deadlinlər</div>
            <a href="/layiheler" className="text-[10px] text-blue-500 hover:underline">Hamısı →</a>
          </div>
          {stats.deadlines.length > 0 ? (
            <div className="space-y-2">
              {stats.deadlines.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-1.5 border-b border-[#f5f5f0] last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[#0f172a] truncate">{p.name}</div>
                    <div className="text-[10px] text-[#aaa]">{p.clients?.name}</div>
                  </div>
                  <Badge variant={p.daysLeft < 0 ? 'danger' : p.daysLeft <= 3 ? 'warning' : 'default'} size="sm">
                    {p.daysLeft < 0 ? `${Math.abs(p.daysLeft)} gün keçmiş` : p.daysLeft === 0 ? 'Bu gün' : `${p.daysLeft} gün`}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[#aaa]">Yaxınlaşan deadline yoxdur</div>
          )}
        </Card>

        {/* Overdue receivables */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-[#0f172a]">Gecikmiş alacaqlar</div>
            <a href="/debitor-borclar" className="text-[10px] text-blue-500 hover:underline">Hamısı →</a>
          </div>
          {stats.overdueReceivables.length > 0 ? (
            <div className="space-y-2">
              {stats.overdueReceivables.slice(0, 4).map((r, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-[#f5f5f0] last:border-0">
                  <div className="flex-1">
                    <div className="text-xs font-medium text-[#0f172a]">Alacaq</div>
                    <div className="text-[10px] text-[#aaa]">{r.days} gün gecikmiş</div>
                  </div>
                  <div className="text-xs font-bold text-red-600">{fmt(r.expected_amount - r.paid_amount)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[#aaa]">
              <div className="text-green-600 font-medium mb-1">Gecikmiş alacaq yoxdur</div>
              Bütün ödənişlər vaxtındadır
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
