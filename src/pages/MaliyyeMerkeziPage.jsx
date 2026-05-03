import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { Skeleton } from '../components/ui'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from 'recharts'
import {
  IconTrendingUp, IconTrendingDown, IconAlertTriangle,
  IconCheck, IconClock,
} from '@tabler/icons-react'

// ─── Constants ───────────────────────────────────────────────────────────────
const TABS = [
  { key: 'cockpit',   label: 'Cash Cockpit' },
  { key: 'pl',        label: 'P&L' },
  { key: 'outsource', label: 'Outsource' },
  { key: 'xercler',   label: 'Xərclər' },
  { key: 'debitor',   label: 'Debitor' },
  { key: 'forecast',  label: 'Forecast' },
]

const AZ_MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek']

const PIPELINE_CONFIDENCE = {
  'Lead': 0.10, 'Təklif': 0.30, 'Müzakirə': 0.50,
  'İmzalanıb': 0.75, 'İcrada': 0.95, 'Bitib': 1.0,
  'Arxiv': 0, 'İtirildi': 0,
  // legacy
  'lead': 0.10, 'proposal': 0.30, 'in_progress': 0.95, 'completed': 1.0, 'archived': 0,
}

function fmt(n) { return Number(n || 0).toLocaleString('az-AZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }
function fmtK(n) { const v = Number(n || 0); return v >= 1000 ? `₼${(v/1000).toFixed(1)}K` : `₼${fmt(v)}` }

function monthKey(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
}
function monthLabel(key) {
  if (!key) return ''
  const [y, m] = key.split('-')
  return `${AZ_MONTHS[parseInt(m)-1]} ${y.slice(2)}`
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function Stat({ label, value, sub, color = '#0f172a', icon }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e8e8e4] p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-[#aaa] font-medium uppercase tracking-wider mb-1">{label}</p>
          <p className="text-xl font-bold" style={{ color }}>{value}</p>
          {sub && <p className="text-[10px] text-[#aaa] mt-0.5">{sub}</p>}
        </div>
        {icon && <div className="text-[#e8e8e4]">{icon}</div>}
      </div>
    </div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#e8e8e4] rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-[#0f172a] mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#555]">{p.name}:</span>
          <span className="font-bold text-[#0f172a]">₼{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── CashCockpit Tab ──────────────────────────────────────────────────────────
function CashCockpitTab({ incomes, expenses }) {
  const monthsSet = new Set()
  incomes.forEach(i => { const k = monthKey(i.payment_date || i.created_at); if (k) monthsSet.add(k) })
  expenses.forEach(e => { const k = monthKey(e.expense_date || e.created_at); if (k) monthsSet.add(k) })
  const months = [...monthsSet].sort().slice(-12)

  const chartData = months.map(m => ({
    month: monthLabel(m),
    Gəlir: incomes.filter(i => monthKey(i.payment_date || i.created_at) === m).reduce((s, i) => s + Number(i.amount||0), 0),
    Xərc:  expenses.filter(e => monthKey(e.expense_date || e.created_at) === m).reduce((s, e) => s + Number(e.amount||0), 0),
  })).map(d => ({ ...d, Net: d.Gəlir - d.Xərc }))

  const totalIncome  = incomes.reduce((s, i) => s + Number(i.amount||0), 0)
  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount||0), 0)
  const netBalance   = totalIncome - totalExpense
  const avgMonthlyExpense = chartData.length ? chartData.reduce((s, d) => s + d.Xərc, 0) / chartData.length : 0

  const transferIncome = incomes.filter(i => i.payment_method === 'transfer').reduce((s, i) => s + Number(i.amount||0), 0)
  const cashIncome     = incomes.filter(i => i.payment_method === 'cash').reduce((s, i) => s + Number(i.amount||0), 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Ümumi gəlir" value={`₼${fmt(totalIncome)}`} color="#22c55e" icon={<IconTrendingUp size={22}/>} />
        <Stat label="Ümumi xərc"  value={`₼${fmt(totalExpense)}`} color="#ef4444" icon={<IconTrendingDown size={22}/>} />
        <Stat label="Net balans"   value={`₼${fmt(netBalance)}`}
          color={netBalance >= 0 ? '#22c55e' : '#ef4444'} sub={`Aylıq orta xərc: ₼${fmt(avgMonthlyExpense)}`} />
        <Stat label="Köçürmə / Nağd" value={`₼${fmt(transferIncome)}`} sub={`Nağd: ₼${fmt(cashIncome)}`} color="#4F6BFB" />
      </div>

      {chartData.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#e8e8e4] p-5">
          <h3 className="text-sm font-bold text-[#0f172a] mb-4">Aylıq Gəlir / Xərc</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="Gəlir" fill="#22c55e" radius={[4,4,0,0]} maxBarSize={32} />
              <Bar dataKey="Xərc"  fill="#ef4444" radius={[4,4,0,0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e8e8e4] p-10 text-center text-xs text-[#bbb]">
          Məlumat yoxdur
        </div>
      )}
    </div>
  )
}

// ─── P&L Tab ─────────────────────────────────────────────────────────────────
function PLTab({ incomes, expenses, projects, clients }) {
  const months = useMemo(() => {
    const s = new Set()
    incomes.forEach(i => { const k = monthKey(i.payment_date||i.created_at); if(k) s.add(k) })
    expenses.forEach(e => { const k = monthKey(e.expense_date||e.created_at); if(k) s.add(k) })
    return [...s].sort().slice(-12)
  }, [incomes, expenses])

  const data = months.map(m => {
    const rev  = incomes.filter(i => monthKey(i.payment_date||i.created_at)===m).reduce((s,i)=>s+Number(i.amount||0),0)
    const cost = expenses.filter(e => monthKey(e.expense_date||e.created_at)===m).reduce((s,e)=>s+Number(e.amount||0),0)
    return { month: monthLabel(m), Gəlir: rev, Xərc: cost, Net: rev - cost }
  })

  const totalRev  = data.reduce((s,d)=>s+d.Gəlir,0)
  const totalCost = data.reduce((s,d)=>s+d.Xərc,0)
  const totalNet  = totalRev - totalCost
  const margin    = totalRev > 0 ? ((totalNet/totalRev)*100).toFixed(1) : 0

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Gəlir (cəmi)"   value={`₼${fmt(totalRev)}`}  color="#22c55e" />
        <Stat label="Xərc (cəmi)"    value={`₼${fmt(totalCost)}`} color="#ef4444" />
        <Stat label="Net gəlir"       value={`₼${fmt(totalNet)}`}  color={totalNet>=0?'#22c55e':'#ef4444'} />
        <Stat label="Margin"          value={`${margin}%`}          color={Number(margin)>=30?'#22c55e':Number(margin)>=15?'#f59e0b':'#ef4444'} sub="(Net / Gəlir)" />
      </div>

      {data.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e8e8e4] p-5">
          <h3 className="text-sm font-bold text-[#0f172a] mb-4">Aylıq P&L</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f0" vertical={false} />
              <XAxis dataKey="month" tick={{fontSize:10,fill:'#aaa'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize:10,fill:'#aaa'}} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{fontSize:11,paddingTop:8}} />
              <Bar dataKey="Gəlir" fill="#4F6BFB" radius={[4,4,0,0]} maxBarSize={32} />
              <Bar dataKey="Xərc"  fill="#f59e0b" radius={[4,4,0,0]} maxBarSize={32} />
              <Bar dataKey="Net"   fill="#22c55e"  radius={[4,4,0,0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly table */}
      <div className="bg-white rounded-2xl border border-[#e8e8e4] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#e8e8e4] bg-[#fafaf8]">
              <th className="text-left py-3 px-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Ay</th>
              <th className="text-right py-3 px-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Gəlir</th>
              <th className="text-right py-3 px-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Xərc</th>
              <th className="text-right py-3 px-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Net</th>
              <th className="text-right py-3 px-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Margin</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-[#bbb]">Məlumat yoxdur</td></tr>
            ) : [...data].reverse().map((d, i) => {
              const mg = d.Gəlir > 0 ? ((d.Net/d.Gəlir)*100).toFixed(1) : 0
              return (
                <tr key={i} className="border-b border-[#f5f5f0]">
                  <td className="py-3 px-4 font-medium text-[#0f172a]">{d.month}</td>
                  <td className="py-3 px-4 text-right text-[#22c55e] font-medium">₼{fmt(d.Gəlir)}</td>
                  <td className="py-3 px-4 text-right text-[#ef4444]">₼{fmt(d.Xərc)}</td>
                  <td className="py-3 px-4 text-right font-bold" style={{color:d.Net>=0?'#22c55e':'#ef4444'}}>₼{fmt(d.Net)}</td>
                  <td className="py-3 px-4 text-right" style={{color:Number(mg)>=30?'#22c55e':Number(mg)>=15?'#f59e0b':'#aaa'}}>{mg}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Outsource Tab ────────────────────────────────────────────────────────────
function OutsourceTab({ outsourceWorks, projects }) {
  const [filter, setFilter] = useState('all')
  const statuses = [
    { key: 'all',          label: 'Hamısı' },
    { key: 'not_started',  label: 'Başlanmayıb' },
    { key: 'in_progress',  label: 'Davam edir' },
    { key: 'completed',    label: 'Tamamlandı' },
    { key: 'overdue',      label: 'Gecikmiş' },
  ]
  const statusColor = { not_started: '#94a3b8', in_progress: '#3b82f6', completed: '#22c55e', overdue: '#ef4444' }
  const statusLabel = { not_started: 'Başlanmayıb', in_progress: 'Davam edir', completed: 'Tamamlandı', overdue: 'Gecikmiş' }
  const filtered = outsourceWorks.filter(o => filter === 'all' || o.work_status === filter)
  const totalContract = outsourceWorks.reduce((s,o) => s + Number(o.contract_amount||0), 0)
  const totalPaid     = outsourceWorks.reduce((s,o) => s + Number(o.total_paid||0), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Stat label="Cəmi müqavilə"   value={`₼${fmt(totalContract)}`} color="#0f172a" />
        <Stat label="Ödənilmiş"       value={`₼${fmt(totalPaid)}`}     color="#22c55e" />
        <Stat label="Qalan"           value={`₼${fmt(totalContract-totalPaid)}`} color="#f59e0b" />
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {statuses.map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filter===s.key?'bg-[#0f172a] text-white border-[#0f172a]':'border-[#e8e8e4] text-[#555] hover:border-[#0f172a]'}`}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-[#e8e8e4] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#e8e8e4] bg-[#fafaf8]">
              <th className="text-left py-3 px-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Ad</th>
              <th className="text-left py-3 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider hidden md:table-cell">Layihə</th>
              <th className="text-left py-3 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Status</th>
              <th className="text-left py-3 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider hidden lg:table-cell">Deadline</th>
              <th className="text-right py-3 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider hidden md:table-cell">Müqavilə</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-[#bbb]">Outsource işi yoxdur</td></tr>
            ) : filtered.map(o => {
              const project = projects.find(p => p.id === o.project_id)
              const sc = statusColor[o.work_status] || '#aaa'
              const sl = statusLabel[o.work_status] || o.work_status
              const overdue = o.planned_deadline && new Date(o.planned_deadline) < new Date() && o.work_status !== 'completed'
              return (
                <tr key={o.id} className="border-b border-[#f5f5f0]">
                  <td className="py-3 px-4">
                    <div className="font-medium text-[#0f172a]">{o.name}</div>
                    {o.work_type && <div className="text-[9px] text-[#aaa]">{o.work_type}</div>}
                  </td>
                  <td className="py-3 pr-4 hidden md:table-cell text-[#555]">{project?.name || '—'}</td>
                  <td className="py-3 pr-4">
                    <span className="text-[9px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: sc+'20', color: sc }}>{sl}</span>
                  </td>
                  <td className="py-3 pr-4 hidden lg:table-cell">
                    {o.planned_deadline ? (
                      <span className={`text-[10px] ${overdue?'text-[#ef4444] font-medium':'text-[#aaa]'}`}>
                        {new Date(o.planned_deadline).toLocaleDateString('az-AZ')}
                      </span>
                    ) : <span className="text-[#ddd]">—</span>}
                  </td>
                  <td className="py-3 pr-4 text-right hidden md:table-cell font-medium text-[#0f172a]">
                    {o.contract_amount > 0 ? `₼${fmt(o.contract_amount)}` : <span className="text-[#ddd]">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Xərclər Tab ─────────────────────────────────────────────────────────────
function XerclerTab({ expenses, projects }) {
  const categories = [...new Set(expenses.map(e => e.category))].filter(Boolean)
  const [cat, setCat] = useState('all')
  const filtered = expenses.filter(e => cat === 'all' || e.category === cat)
  const byCategory = categories.map(c => ({
    name: c,
    total: expenses.filter(e => e.category === c).reduce((s,e) => s+Number(e.amount||0), 0)
  })).sort((a,b) => b.total - a.total)
  const totalExpense = expenses.reduce((s,e) => s+Number(e.amount||0), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Cəmi xərc" value={`₼${fmt(totalExpense)}`} color="#ef4444" />
        {byCategory.slice(0,3).map(c => (
          <Stat key={c.name} label={c.name} value={`₼${fmt(c.total)}`}
            sub={`${totalExpense>0?((c.total/totalExpense)*100).toFixed(0):0}%`} />
        ))}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setCat('all')}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${cat==='all'?'bg-[#0f172a] text-white border-[#0f172a]':'border-[#e8e8e4] text-[#555] hover:border-[#0f172a]'}`}>
          Hamısı
        </button>
        {categories.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${cat===c?'bg-[#0f172a] text-white border-[#0f172a]':'border-[#e8e8e4] text-[#555] hover:border-[#0f172a]'}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-[#e8e8e4] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#e8e8e4] bg-[#fafaf8]">
              <th className="text-left py-3 px-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Ad</th>
              <th className="text-left py-3 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider hidden md:table-cell">Kateqoriya</th>
              <th className="text-left py-3 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider hidden lg:table-cell">Tarix</th>
              <th className="text-right py-3 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Məbləğ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="py-8 text-center text-[#bbb]">Xərc yoxdur</td></tr>
            ) : filtered.slice(0, 50).map(e => (
              <tr key={e.id} className="border-b border-[#f5f5f0]">
                <td className="py-3 px-4 font-medium text-[#0f172a]">{e.name}</td>
                <td className="py-3 pr-4 hidden md:table-cell text-[#555]">{e.category}</td>
                <td className="py-3 pr-4 hidden lg:table-cell text-[#aaa]">
                  {e.expense_date ? new Date(e.expense_date).toLocaleDateString('az-AZ') : '—'}
                </td>
                <td className="py-3 pr-4 text-right font-medium text-[#ef4444]">₼{fmt(e.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Debitor Tab ──────────────────────────────────────────────────────────────
function DebitorTab({ receivables, projects, clients }) {
  const [filter, setFilter] = useState('pending')
  const totalExpected = receivables.reduce((s,r) => s+Number(r.expected_amount||0), 0)
  const totalPaid     = receivables.filter(r=>r.paid).reduce((s,r) => s+Number(r.expected_amount||0), 0)
  const totalPending  = receivables.filter(r=>!r.paid).reduce((s,r) => s+Number(r.expected_amount||0), 0)
  const overdue       = receivables.filter(r => !r.paid && r.expected_date && new Date(r.expected_date) < new Date())
  const filtered = filter === 'pending'
    ? receivables.filter(r => !r.paid)
    : filter === 'paid' ? receivables.filter(r => r.paid) : receivables

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Gözlənilən" value={`₼${fmt(totalExpected)}`} color="#0f172a" />
        <Stat label="Alındı"     value={`₼${fmt(totalPaid)}`}     color="#22c55e" />
        <Stat label="Gözlənir"   value={`₼${fmt(totalPending)}`}  color="#f59e0b" />
        <Stat label="Gecikmiş"   value={overdue.length + ' əməliyyat'} color={overdue.length>0?'#ef4444':'#aaa'}
          sub={overdue.length>0 ? `₼${fmt(overdue.reduce((s,r)=>s+Number(r.expected_amount||0),0))}` : undefined} />
      </div>
      <div className="flex gap-1.5">
        {[{k:'all',l:'Hamısı'},{k:'pending',l:'Gözlənir'},{k:'paid',l:'Alındı'}].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filter===f.k?'bg-[#0f172a] text-white border-[#0f172a]':'border-[#e8e8e4] text-[#555] hover:border-[#0f172a]'}`}>
            {f.l}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-[#e8e8e4] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#e8e8e4] bg-[#fafaf8]">
              <th className="text-left py-3 px-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Ad</th>
              <th className="text-left py-3 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider hidden md:table-cell">Müştəri / Layihə</th>
              <th className="text-left py-3 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Tarix</th>
              <th className="text-left py-3 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Status</th>
              <th className="text-right py-3 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Məbləğ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-[#bbb]">Alacaq yoxdur</td></tr>
            ) : filtered.map(r => {
              const client  = clients.find(c => c.id === r.client_id)
              const project = projects.find(p => p.id === r.project_id)
              const isOverdue = !r.paid && r.expected_date && new Date(r.expected_date) < new Date()
              return (
                <tr key={r.id} className={`border-b border-[#f5f5f0] ${isOverdue?'bg-red-50/30':''}`}>
                  <td className="py-3 px-4 font-medium text-[#0f172a]">{r.name}</td>
                  <td className="py-3 pr-4 hidden md:table-cell text-[#555] text-[10px]">
                    {client?.name || project?.name || '—'}
                  </td>
                  <td className="py-3 pr-4">
                    {r.expected_date ? (
                      <span className={`text-[10px] ${isOverdue?'text-[#ef4444] font-medium':'text-[#aaa]'}`}>
                        {new Date(r.expected_date).toLocaleDateString('az-AZ')}
                      </span>
                    ) : <span className="text-[#ddd]">—</span>}
                  </td>
                  <td className="py-3 pr-4">
                    {r.paid
                      ? <span className="flex items-center gap-1 text-[9px] text-[#22c55e] font-medium"><IconCheck size={10}/>Alındı</span>
                      : isOverdue
                        ? <span className="flex items-center gap-1 text-[9px] text-[#ef4444] font-medium"><IconAlertTriangle size={10}/>Gecikmiş</span>
                        : <span className="flex items-center gap-1 text-[9px] text-[#f59e0b]"><IconClock size={10}/>Gözlənir</span>
                    }
                  </td>
                  <td className="py-3 pr-4 text-right font-bold text-[#0f172a]">₼{fmt(r.expected_amount)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Forecast Tab ─────────────────────────────────────────────────────────────
function ForecastTab({ clients, incomes, expenses }) {
  const stageClients = clients.filter(c => {
    const stage = c.pipeline_stage || c.status || 'Lead'
    const conf = PIPELINE_CONFIDENCE[stage] || 0
    return conf > 0 && c.expected_value > 0
  })
  const weighted = stageClients.reduce((s, c) => {
    const stage = c.pipeline_stage || c.status || 'Lead'
    const conf = PIPELINE_CONFIDENCE[stage] || 0
    return s + Number(c.expected_value||0) * conf
  }, 0)
  const totalPipeline = stageClients.reduce((s,c) => s+Number(c.expected_value||0), 0)

  const avgMonthlyExpense = (() => {
    const months = new Set(expenses.map(e => monthKey(e.expense_date||e.created_at)).filter(Boolean))
    if (!months.size) return 0
    return expenses.reduce((s,e)=>s+Number(e.amount||0),0) / months.size
  })()

  const STAGE_META = [
    { key: 'Lead',       label: 'Potensial',  color: '#94a3b8', conf: 10 },
    { key: 'Təklif',     label: 'Təklif',     color: '#3b82f6', conf: 30 },
    { key: 'Müzakirə',   label: 'Müzakirə',   color: '#f59e0b', conf: 50 },
    { key: 'İmzalanıb',  label: 'İmzalanıb',  color: '#8b5cf6', conf: 75 },
    { key: 'İcrada',     label: 'İcrada',     color: '#0ea5e9', conf: 95 },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Stat label="Weighted Pipeline" value={`₼${fmt(weighted)}`} color="#4F6BFB"
          sub="Confidence-weighted cəmi" />
        <Stat label="Ümumi Pipeline"    value={`₼${fmt(totalPipeline)}`} color="#0f172a"
          sub={`${stageClients.length} müştəri`} />
        <Stat label="Aylıq orta xərc"  value={`₼${fmt(avgMonthlyExpense)}`} color="#ef4444"
          sub="Son aylar üzrə" />
      </div>

      {/* Pipeline by stage */}
      <div className="bg-white rounded-2xl border border-[#e8e8e4] p-5">
        <h3 className="text-sm font-bold text-[#0f172a] mb-4">Pipeline Mərhələ Analizi</h3>
        <div className="space-y-2.5">
          {STAGE_META.map(s => {
            const stageCl = clients.filter(c => (c.pipeline_stage||c.status||'Lead') === s.key || (c.pipeline_stage||c.status||'lead') === s.key.toLowerCase())
            const total   = stageCl.reduce((sum,c)=>sum+Number(c.expected_value||0),0)
            const wt      = total * (s.conf/100)
            const maxTotal = Math.max(...STAGE_META.map(sm => clients.filter(c=>(c.pipeline_stage||c.status||'Lead')===sm.key).reduce((x,c)=>x+Number(c.expected_value||0),0)), 1)
            return (
              <div key={s.key} className="flex items-center gap-3">
                <div className="w-24 flex-shrink-0">
                  <span className="text-[10px] font-medium" style={{color: s.color}}>{s.label}</span>
                  <span className="text-[9px] text-[#aaa] ml-1">{s.conf}%</span>
                </div>
                <div className="flex-1 bg-[#f5f5f0] rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(total/maxTotal)*100}%`, background: s.color }} />
                </div>
                <div className="text-right flex-shrink-0 w-32">
                  <span className="text-xs font-bold text-[#0f172a]">₼{fmt(wt)}</span>
                  <span className="text-[9px] text-[#aaa] ml-1">/ ₼{fmt(total)}</span>
                </div>
                <div className="text-[9px] text-[#aaa] w-16 text-right">{stageCl.length} müştəri</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Client list */}
      <div className="bg-white rounded-2xl border border-[#e8e8e4] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#e8e8e4] bg-[#fafaf8]">
          <h3 className="text-xs font-bold text-[#0f172a]">Aktiv Pipeline Müştəriləri</h3>
        </div>
        {stageClients.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#bbb]">
            Pipeline-da gözlənilən dəyəri olan müştəri yoxdur.<br/>
            Müştərilər səhifəsindən "Gözlənilən dəyər" əlavə edin.
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#e8e8e4]">
                <th className="text-left py-2.5 px-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Müştəri</th>
                <th className="text-left py-2.5 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Mərhələ</th>
                <th className="text-right py-2.5 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Gözlənilən</th>
                <th className="text-right py-2.5 pr-4 font-semibold text-[#888] text-[10px] uppercase tracking-wider">Weighted</th>
              </tr>
            </thead>
            <tbody>
              {stageClients.map(c => {
                const stage = c.pipeline_stage || c.status || 'Lead'
                const conf  = PIPELINE_CONFIDENCE[stage] || 0
                const wt    = Number(c.expected_value||0) * conf
                return (
                  <tr key={c.id} className="border-b border-[#f5f5f0]">
                    <td className="py-2.5 px-4 font-medium text-[#0f172a]">{c.name}</td>
                    <td className="py-2.5 pr-4 text-[#555]">{stage}</td>
                    <td className="py-2.5 pr-4 text-right text-[#0f172a]">₼{fmt(c.expected_value)}</td>
                    <td className="py-2.5 pr-4 text-right font-bold text-[#4F6BFB]">₼{fmt(wt)}</td>
                  </tr>
                )
              })}
              <tr className="bg-[#fafaf8] font-bold">
                <td colSpan={2} className="py-2.5 px-4 text-[#0f172a]">Cəmi</td>
                <td className="py-2.5 pr-4 text-right text-[#0f172a]">₼{fmt(totalPipeline)}</td>
                <td className="py-2.5 pr-4 text-right text-[#4F6BFB]">₼{fmt(weighted)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MaliyyeMerkeziPage() {
  const [activeTab, setActiveTab] = useState('cockpit')
  const [loading,   setLoading]   = useState(true)
  const [incomes,         setIncomes]         = useState([])
  const [expenses,        setExpenses]        = useState([])
  const [receivables,     setReceivables]     = useState([])
  const [outsourceWorks,  setOutsourceWorks]  = useState([])
  const [projects,        setProjects]        = useState([])
  const [clients,         setClients]         = useState([])

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [
      { data: inc }, { data: exp }, { data: rec },
      { data: ow }, { data: proj }, { data: cl }
    ] = await Promise.all([
      supabase.from('incomes').select('*').order('payment_date', { ascending: false }),
      supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
      supabase.from('receivables').select('*').order('expected_date', { ascending: true }),
      supabase.from('outsource_works').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id,name,client_id,contract_value,status,phase').order('created_at', { ascending: false }),
      supabase.from('clients').select('id,name,expected_value,pipeline_stage,status,confidence_pct').order('created_at', { ascending: false }),
    ])
    setIncomes(inc || [])
    setExpenses(exp || [])
    setReceivables(rec || [])
    setOutsourceWorks(ow || [])
    setProjects(proj || [])
    setClients(cl || [])
    setLoading(false)
  }

  const totalIncome  = incomes.reduce((s,i)=>s+Number(i.amount||0),0)
  const totalExpense = expenses.reduce((s,e)=>s+Number(e.amount||0),0)
  const pendingDebt  = receivables.filter(r=>!r.paid).reduce((s,r)=>s+Number(r.expected_amount||0),0)

  return (
    <div className="flex flex-col h-full bg-[#f9f9f7]">
      {/* Header */}
      <div className="px-4 lg:px-6 py-4 border-b border-[#e8e8e4] bg-white">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-[#0f172a]">Maliyyə Mərkəzi</h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-[10px] text-[#22c55e] font-medium">↑ ₼{fmt(totalIncome)} gəlir</span>
              <span className="text-[10px] text-[#ef4444] font-medium">↓ ₼{fmt(totalExpense)} xərc</span>
              {pendingDebt > 0 && <span className="text-[10px] text-[#f59e0b] font-medium">⏳ ₼{fmt(pendingDebt)} alacaq</span>}
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeTab===t.key?'bg-[#0f172a] text-white':'text-[#555] hover:bg-[#f5f5f0]'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 lg:px-6 py-5">
        {loading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i=><Skeleton key={i} className="h-20 rounded-2xl"/>)}</div>
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : (
          <>
            {activeTab === 'cockpit'   && <CashCockpitTab incomes={incomes} expenses={expenses} />}
            {activeTab === 'pl'        && <PLTab incomes={incomes} expenses={expenses} projects={projects} clients={clients} />}
            {activeTab === 'outsource' && <OutsourceTab outsourceWorks={outsourceWorks} projects={projects} />}
            {activeTab === 'xercler'   && <XerclerTab expenses={expenses} projects={projects} />}
            {activeTab === 'debitor'   && <DebitorTab receivables={receivables} projects={projects} clients={clients} />}
            {activeTab === 'forecast'  && <ForecastTab clients={clients} incomes={incomes} expenses={expenses} />}
          </>
        )}
      </div>
    </div>
  )
}
