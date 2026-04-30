import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PageHeader, Card, Button, Skeleton, StatCard } from '../components/ui'
import { getLocalYear, getLocalMonth } from '../lib/dateUtils'
import { IconDownload } from '@tabler/icons-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'

const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek']
const COLORS = ['#0f172a', '#3b82f6', '#16a34a', '#ca8a04', '#dc2626', '#7c3aed', '#ec4899', '#06b6d4']
const EDV = 0.18

function fmt(n) { return '₼' + Math.round(Number(n || 0)).toLocaleString() }

export default function HesabatlarPage() {
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [filterMonth, setFilterMonth] = useState(0)
  const [data, setData] = useState({
    combined: [], clientBreakdown: [], projectStatus: [],
    taskStats: [], expByCategory: [],
    totalIncome: 0, totalIncomeWithEdv: 0, totalEdvCollected: 0,
    totalExpense: 0, totalExpenseWithEdv: 0, totalEdvPaid: 0,
    totalProfit: 0, totalProfitWithEdv: 0, totalReceivable: 0,
    netEdv: 0
  })

  useEffect(() => { loadData() }, [year, filterMonth])

  async function loadData() {
    setLoading(true)
    const [incRes, expRes, projRes, taskRes, recRes] = await Promise.all([
      supabase.from('incomes').select('amount, payment_date, payment_method, edv_amount, amount_with_edv'),
      supabase.from('expenses').select('amount, expense_date, category, payment_method, edv_amount, amount_with_edv'),
      supabase.from('projects').select('id, name, status, contract_value, client_id, clients(name)'),
      supabase.from('tasks').select('status'),
      supabase.from('receivables').select('expected_amount, paid_amount, paid'),
    ])

    const incomes = incRes.data || []
    const expenses = expRes.data || []
    const projects = projRes.data || []
    const tasks = taskRes.data || []
    const receivables = recRes.data || []

    // Aylıq məlumatlar
    const combined = MONTHS.map((month, idx) => {
      if (filterMonth !== 0 && idx + 1 !== filterMonth) {
        return { month, income: 0, incomeWithEdv: 0, expense: 0, expenseWithEdv: 0, profit: 0, profitWithEdv: 0 }
      }
      const monthInc = incomes.filter(i => getLocalYear(i.payment_date) === year && getLocalMonth(i.payment_date) === idx + 1)
      const monthExp = expenses.filter(e => getLocalYear(e.expense_date) === year && getLocalMonth(e.expense_date) === idx + 1)

      const income = monthInc.reduce((s, i) => s + Number(i.amount || 0), 0)
      const incomeWithEdv = monthInc.reduce((s, i) => s + Number(i.amount_with_edv || i.amount || 0), 0)
      const expense = monthExp.reduce((s, e) => s + Number(e.amount || 0), 0)
      const expenseWithEdv = monthExp.reduce((s, e) => s + Number(e.amount_with_edv || e.amount || 0), 0)

      return {
        month,
        income: Math.round(income),
        incomeWithEdv: Math.round(incomeWithEdv),
        expense: Math.round(expense),
        expenseWithEdv: Math.round(expenseWithEdv),
        profit: Math.round(income - expense),
        profitWithEdv: Math.round(incomeWithEdv - expenseWithEdv),
      }
    })

    // Sifarişçi bölgüsü
    const clientMap = {}
    projects.forEach(p => {
      const name = p.clients?.name || 'Digər'
      clientMap[name] = (clientMap[name] || 0) + Number(p.contract_value || 0)
    })
    const clientBreakdown = Object.entries(clientMap)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value).slice(0, 6)

    // Layihə statusu
    const statusMap = { waiting: 'Gözləyir', active: 'İcrada', on_hold: 'Dayandırılıb', completed: 'Tamamlandı' }
    const statusCount = {}
    projects.forEach(p => { const s = statusMap[p.status] || p.status; statusCount[s] = (statusCount[s] || 0) + 1 })
    const projectStatus = Object.entries(statusCount).map(([name, count]) => ({ name, count }))

    // Tapşırıq statusu
    const taskMap = { not_started: 'Başlanmayıb', in_progress: 'İcrada', done: 'Tamamlandı', cancelled: 'Ləğv' }
    const taskCount = {}
    tasks.forEach(t => { const s = taskMap[t.status] || t.status; taskCount[s] = (taskCount[s] || 0) + 1 })
    const taskStats = Object.entries(taskCount).map(([name, count]) => ({ name, count }))

    // Xərc kateqoriyası
    const catMap = {}
    expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount || 0) })
    const expByCategory = Object.entries(catMap).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value)

    // Ümumi KPI
    const inPeriod = (dateStr) => {
      if (!dateStr) return false
      if (getLocalYear(dateStr) !== year) return false
      if (filterMonth && getLocalMonth(dateStr) !== filterMonth) return false
      return true
    }
    const filtInc = incomes.filter(i => inPeriod(i.payment_date))
    const filtExp = expenses.filter(e => inPeriod(e.expense_date))
    const totalIncome = filtInc.reduce((s, i) => s + Number(i.amount || 0), 0)
    const totalIncomeWithEdv = filtInc.reduce((s, i) => s + Number(i.amount_with_edv || i.amount || 0), 0)
    const totalEdvCollected = filtInc.filter(i => i.payment_method === 'transfer').reduce((s, i) => s + Number(i.edv_amount || 0), 0)

    const totalExpense = filtExp.reduce((s, e) => s + Number(e.amount || 0), 0)
    const totalExpenseWithEdv = filtExp.reduce((s, e) => s + Number(e.amount_with_edv || e.amount || 0), 0)
    const totalEdvPaid = filtExp.filter(e => e.payment_method === 'transfer').reduce((s, e) => s + Number(e.edv_amount || 0), 0)

    const totalReceivable = receivables.filter(r => !r.paid).reduce((s, r) => s + (Number(r.expected_amount || 0) - Number(r.paid_amount || 0)), 0)
    const netEdv = totalEdvCollected - totalEdvPaid

    setData({
      combined, clientBreakdown, projectStatus, taskStats, expByCategory,
      totalIncome, totalIncomeWithEdv, totalEdvCollected,
      totalExpense, totalExpenseWithEdv, totalEdvPaid,
      totalProfit: totalIncome - totalExpense,
      totalProfitWithEdv: totalIncomeWithEdv - totalExpenseWithEdv,
      totalReceivable, netEdv
    })
    setLoading(false)
  }

  function exportCSV() {
    const rows = data.combined.map(r => `${r.month},${r.income},${r.incomeWithEdv},${r.expense},${r.expenseWithEdv},${r.profit},${r.profitWithEdv}`)
    const csv = ['Ay,Gəlir(ƏDV xaric),Gəlir(ƏDV daxil),Xərc(ƏDV xaric),Xərc(ƏDV daxil),Mənfəət(ƏDV xaric),Mənfəət(ƏDV daxil)', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `hesabat-${year}.csv`; a.click()
  }

  if (loading) return <div className="p-4 lg:p-6 space-y-4"><Skeleton className="h-20" /><Skeleton className="h-64" /></div>

  return (
    <div className="p-4 lg:p-6 fade-in">
      <PageHeader
        title="Hesabatlar"
        subtitle="Maliyyə və əməliyyat analitikası"
        action={
          <div className="flex items-center gap-2">
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none focus:border-[#0f172a]">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}
              className="px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none focus:border-[#0f172a]">
              <option value={0}>Bütün aylar</option>
              {['Yan','Fev','Mar','Apr','May','İyn','İyl','Avq','Sen','Okt','Noy','Dek'].map((m,i) => (
                <option key={i+1} value={i+1}>{m}</option>
              ))}
            </select>
            <Button variant="secondary" size="sm" onClick={exportCSV}>
              <IconDownload size={13} /> CSV
            </Button>
          </div>
        }
      />

      {/* ƏDV xaric KPI */}
      <div className="mb-2">
        <div className="text-xs font-bold text-[#888] uppercase tracking-wide mb-2">ƏDV xaric</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard label="Ümumi gəlir" value={fmt(data.totalIncome)} variant="success" />
          <StatCard label="Ümumi xərc" value={fmt(data.totalExpense)} variant="danger" />
          <StatCard label="Mənfəət" value={fmt(data.totalProfit)} variant={data.totalProfit >= 0 ? 'success' : 'danger'} />
          <StatCard label="Gözlənilən alacaq" value={fmt(data.totalReceivable)} variant="danger" />
        </div>
      </div>

      {/* ƏDV daxil KPI */}
      <div className="mb-2">
        <div className="text-xs font-bold text-[#888] uppercase tracking-wide mb-2">ƏDV daxil</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard label="Ümumi gəlir" value={fmt(data.totalIncomeWithEdv)} variant="success" />
          <StatCard label="Ümumi xərc" value={fmt(data.totalExpenseWithEdv)} variant="danger" />
          <StatCard label="Mənfəət" value={fmt(data.totalProfitWithEdv)} variant={data.totalProfitWithEdv >= 0 ? 'success' : 'danger'} />
          <StatCard label={data.netEdv >= 0 ? 'ƏDV ödəniləcək' : 'ƏDV geri alınacaq'} value={fmt(Math.abs(data.netEdv))} variant={data.netEdv >= 0 ? 'warning' : 'success'} />
        </div>
      </div>

      {/* Gəlir vs Xərc — ƏDV xaric */}
      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-[#0f172a]">Gəlir vs Xərc — {year}</div>
          <div className="flex gap-3 text-[10px] text-[#888]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500 inline-block"></span>Gəlir (ƏDV xaric)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block"></span>Xərc (ƏDV xaric)</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.combined} barSize={14} barGap={2}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip formatter={(v, n) => [fmt(v), n === 'income' ? 'Gəlir' : 'Xərc']} contentStyle={{ fontSize: 11, border: '1px solid #e8e8e4', borderRadius: 6 }} />
            <Bar dataKey="income" fill="#16a34a" radius={[3, 3, 0, 0]} name="income" />
            <Bar dataKey="expense" fill="#dc2626" radius={[3, 3, 0, 0]} name="expense" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Gəlir vs Xərc — ƏDV daxil */}
      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-[#0f172a]">Gəlir vs Xərc — ƏDV daxil — {year}</div>
          <div className="flex gap-3 text-[10px] text-[#888]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block"></span>Gəlir (ƏDV daxil)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-orange-400 inline-block"></span>Xərc (ƏDV daxil)</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.combined} barSize={14} barGap={2}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip formatter={(v, n) => [fmt(v), n === 'incomeWithEdv' ? 'Gəlir (ƏDV daxil)' : 'Xərc (ƏDV daxil)']} contentStyle={{ fontSize: 11, border: '1px solid #e8e8e4', borderRadius: 6 }} />
            <Bar dataKey="incomeWithEdv" fill="#34d399" radius={[3, 3, 0, 0]} name="incomeWithEdv" />
            <Bar dataKey="expenseWithEdv" fill="#fb923c" radius={[3, 3, 0, 0]} name="expenseWithEdv" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Mənfəət trendi */}
      <Card className="p-4 mb-4">
        <div className="text-xs font-bold text-[#0f172a] mb-3">Mənfəət trendi — {year}</div>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={data.combined}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip formatter={(v, n) => [fmt(v), n === 'profit' ? 'ƏDV xaric' : 'ƏDV daxil']} contentStyle={{ fontSize: 11, border: '1px solid #e8e8e4', borderRadius: 6 }} />
            <Line type="monotone" dataKey="profit" stroke="#0f172a" strokeWidth={2} dot={{ r: 3 }} name="profit" />
            <Line type="monotone" dataKey="profitWithEdv" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 2 }} name="profitWithEdv" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 text-[10px] text-[#888] mt-1">
          <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-[#0f172a] inline-block"></span>ƏDV xaric</span>
          <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-blue-500 inline-block" style={{borderTop: '1px dashed'}}></span>ƏDV daxil</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Sifarişçi bölgüsü */}
        <Card className="p-4">
          <div className="text-xs font-bold text-[#0f172a] mb-3">Sifarişçi üzrə portfel</div>
          {data.clientBreakdown.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={data.clientBreakdown} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={50}>
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
          ) : <div className="h-24 flex items-center justify-center text-xs text-[#aaa]">Məlumat yoxdur</div>}
        </Card>

        {/* Xərc kateqoriyası */}
        <Card className="p-4">
          <div className="text-xs font-bold text-[#0f172a] mb-3">Xərc kateqoriyaları</div>
          {data.expByCategory?.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={data.expByCategory} layout="vertical" barSize={12}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip formatter={(v) => [fmt(v), 'Xərc']} contentStyle={{ fontSize: 11, border: '1px solid #e8e8e4', borderRadius: 6 }} />
                <Bar dataKey="value" fill="#0f172a" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-24 flex items-center justify-center text-xs text-[#aaa]">Məlumat yoxdur</div>}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-xs font-bold text-[#0f172a] mb-3">Layihə statusu</div>
          {data.projectStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={data.projectStatus} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ fontSize: 11, border: '1px solid #e8e8e4', borderRadius: 6 }} />
                <Bar dataKey="count" fill="#0f172a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-24 flex items-center justify-center text-xs text-[#aaa]">Layihə yoxdur</div>}
        </Card>

        <Card className="p-4">
          <div className="text-xs font-bold text-[#0f172a] mb-3">Tapşırıq statusu</div>
          {data.taskStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={data.taskStats} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ fontSize: 11, border: '1px solid #e8e8e4', borderRadius: 6 }} />
                <Bar dataKey="count" fill="#1e3a5f" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-24 flex items-center justify-center text-xs text-[#aaa]">Tapşırıq yoxdur</div>}
        </Card>
      </div>
    </div>
  )
}
