import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PageHeader, Card, Button, Skeleton, StatCard } from '../components/ui'
import { IconDownload, IconChartBar } from '@tabler/icons-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'

const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek']
const COLORS = ['#0f172a', '#3b82f6', '#16a34a', '#ca8a04', '#dc2626', '#7c3aed', '#ec4899', '#06b6d4']

function fmt(n) { return '₼' + Math.round(Number(n || 0)).toLocaleString() }

export default function HesabatlarPage() {
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [data, setData] = useState({
    monthlyIncome: [], monthlyExpense: [], clientBreakdown: [],
    projectStatus: [], taskStats: [], totalIncome: 0, totalExpense: 0,
    totalProfit: 0, totalReceivable: 0
  })

  useEffect(() => { loadData() }, [year])

  async function loadData() {
    setLoading(true)
    const [incRes, expRes, projRes, taskRes, recRes, clientRes] = await Promise.all([
      supabase.from('incomes').select('amount, payment_date'),
      supabase.from('expenses').select('amount, expense_date, category'),
      supabase.from('projects').select('id, name, status, contract_value, client_id, clients(name)'),
      supabase.from('tasks').select('status'),
      supabase.from('receivables').select('expected_amount, paid_amount, paid'),
      supabase.from('clients').select('id, name'),
    ])

    const incomes = incRes.data || []
    const expenses = expRes.data || []
    const projects = projRes.data || []
    const tasks = taskRes.data || []
    const receivables = recRes.data || []

    // Monthly income
    const monthlyIncome = MONTHS.map((month, idx) => {
      const total = incomes
        .filter(i => {
          if (!i.payment_date) return false
          const d = new Date(i.payment_date)
          return d.getFullYear() === year && d.getMonth() === idx
        })
        .reduce((s, i) => s + Number(i.amount || 0), 0)
      return { month, income: Math.round(total) }
    })

    // Monthly expense
    const monthlyExpense = MONTHS.map((month, idx) => {
      const total = expenses
        .filter(e => {
          if (!e.expense_date) return false
          const d = new Date(e.expense_date)
          return d.getFullYear() === year && d.getMonth() === idx
        })
        .reduce((s, e) => s + Number(e.amount || 0), 0)
      return { month, expense: Math.round(total) }
    })

    // Combined
    const combined = MONTHS.map((month, idx) => ({
      month,
      income: monthlyIncome[idx].income,
      expense: monthlyExpense[idx].expense,
      profit: monthlyIncome[idx].income - monthlyExpense[idx].expense
    }))

    // Client breakdown
    const clientMap = {}
    projects.forEach(p => {
      const name = p.clients?.name || 'Digər'
      clientMap[name] = (clientMap[name] || 0) + Number(p.contract_value || 0)
    })
    const clientBreakdown = Object.entries(clientMap)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)

    // Project status
    const statusMap = { waiting: 'Gözləyir', active: 'İcrada', on_hold: 'Dayandırılıb', completed: 'Tamamlandı' }
    const statusCount = {}
    projects.forEach(p => {
      const s = statusMap[p.status] || p.status
      statusCount[s] = (statusCount[s] || 0) + 1
    })
    const projectStatus = Object.entries(statusCount).map(([name, count]) => ({ name, count }))

    // Task stats
    const taskMap = { not_started: 'Başlanmayıb', in_progress: 'İcrada', done: 'Tamamlandı', cancelled: 'Ləğv' }
    const taskCount = {}
    tasks.forEach(t => {
      const s = taskMap[t.status] || t.status
      taskCount[s] = (taskCount[s] || 0) + 1
    })
    const taskStats = Object.entries(taskCount).map(([name, count]) => ({ name, count }))

    // Expense by category
    const catMap = {}
    expenses.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount || 0)
    })
    const expByCategory = Object.entries(catMap)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)

    const totalIncome = incomes.reduce((s, i) => s + Number(i.amount || 0), 0)
    const totalExpense = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
    const totalReceivable = receivables.filter(r => !r.paid).reduce((s, r) => s + (Number(r.expected_amount || 0) - Number(r.paid_amount || 0)), 0)

    setData({
      monthlyIncome, monthlyExpense, combined, clientBreakdown,
      projectStatus, taskStats, expByCategory,
      totalIncome, totalExpense,
      totalProfit: totalIncome - totalExpense,
      totalReceivable
    })
    setLoading(false)
  }

  function exportCSV() {
    const rows = data.combined.map(r => `${r.month},${r.income},${r.expense},${r.profit}`)
    const csv = ['Ay,Gəlir,Xərc,Mənfəət', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hesabat-${year}.csv`
    a.click()
  }

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-20" /><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 fade-in">
      <PageHeader
        title="Hesabatlar"
        subtitle="Maliyyə və əməliyyat analitikası"
        action={
          <div className="flex items-center gap-2">
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none focus:border-[#0f172a]">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <Button variant="secondary" size="sm" onClick={exportCSV}>
              <IconDownload size={13} /> CSV
            </Button>
          </div>
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Ümumi gəlir" value={fmt(data.totalIncome)} variant="success" sub={`${year}`} />
        <StatCard label="Ümumi xərc" value={fmt(data.totalExpense)} variant="danger" sub={`${year}`} />
        <StatCard label="Mənfəət" value={fmt(data.totalProfit)} variant={data.totalProfit >= 0 ? 'success' : 'danger'} />
        <StatCard label="Gözlənilən alacaq" value={fmt(data.totalReceivable)} variant="danger" />
      </div>

      {/* Gəlir vs Xərc */}
      <Card className="p-4 mb-4">
        <div className="text-xs font-bold text-[#0f172a] mb-4">Gəlir vs Xərc — {year}</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.combined} barSize={16} barGap={4}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(v, n) => [fmt(v), n === 'income' ? 'Gəlir' : n === 'expense' ? 'Xərc' : 'Mənfəət']}
              contentStyle={{ fontSize: 11, border: '1px solid #e8e8e4', borderRadius: 6 }}
            />
            <Bar dataKey="income" fill="#16a34a" radius={[3, 3, 0, 0]} name="income" />
            <Bar dataKey="expense" fill="#dc2626" radius={[3, 3, 0, 0]} name="expense" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Mənfəət trendi */}
      <Card className="p-4 mb-4">
        <div className="text-xs font-bold text-[#0f172a] mb-4">Mənfəət trendi — {year}</div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data.combined}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip formatter={(v) => [fmt(v), 'Mənfəət']} contentStyle={{ fontSize: 11, border: '1px solid #e8e8e4', borderRadius: 6 }} />
            <Line type="monotone" dataKey="profit" stroke="#0f172a" strokeWidth={2} dot={{ r: 3, fill: '#0f172a' }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Sifarişçi bölgüsü */}
        <Card className="p-4">
          <div className="text-xs font-bold text-[#0f172a] mb-4">Sifarişçi üzrə portfel bölgüsü</div>
          {data.clientBreakdown.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={data.clientBreakdown} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55}>
                    {data.clientBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {data.clientBreakdown.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-[#555] truncate flex-1">{item.name}</span>
                    <span className="font-medium text-[#0f172a]">{fmt(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-xs text-[#aaa]">Məlumat yoxdur</div>
          )}
        </Card>

        {/* Xərc kateqoriyası */}
        <Card className="p-4">
          <div className="text-xs font-bold text-[#0f172a] mb-4">Xərc kateqoriyaları üzrə</div>
          {data.expByCategory?.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={data.expByCategory} layout="vertical" barSize={14}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip formatter={(v) => [fmt(v), 'Xərc']} contentStyle={{ fontSize: 11, border: '1px solid #e8e8e4', borderRadius: 6 }} />
                <Bar dataKey="value" fill="#0f172a" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-24 flex items-center justify-center text-xs text-[#aaa]">Məlumat yoxdur</div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Layihə statusu */}
        <Card className="p-4">
          <div className="text-xs font-bold text-[#0f172a] mb-4">Layihə statusu</div>
          {data.projectStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={data.projectStatus} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ fontSize: 11, border: '1px solid #e8e8e4', borderRadius: 6 }} />
                <Bar dataKey="count" fill="#0f172a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-24 flex items-center justify-center text-xs text-[#aaa]">Layihə yoxdur</div>
          )}
        </Card>

        {/* Tapşırıq statusu */}
        <Card className="p-4">
          <div className="text-xs font-bold text-[#0f172a] mb-4">Tapşırıq statusu</div>
          {data.taskStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={data.taskStats} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ fontSize: 11, border: '1px solid #e8e8e4', borderRadius: 6 }} />
                <Bar dataKey="count" fill="#1e3a5f" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-24 flex items-center justify-center text-xs text-[#aaa]">Tapşırıq yoxdur</div>
          )}
        </Card>
      </div>
    </div>
  )
}
