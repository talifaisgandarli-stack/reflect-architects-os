import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Card, Button, StatCard, Skeleton, Badge } from '../components/ui'
import { IconWallet, IconDownload } from '@tabler/icons-react'

function fmt(n) { return '₼' + Number(n || 0).toLocaleString() }

export default function EmekHaqqiPage() {
  const { isAdmin, user } = useAuth()
  const { addToast } = useToast()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [overheads, setOverheads] = useState({})

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    let query = supabase.from('profiles').select('*, roles(title_az)').eq('is_active', true).order('full_name')
    if (!isAdmin && user?.id) query = query.eq('id', user.id)
    const { data } = await query
    setMembers(data || [])
    setLoading(false)
  }

  const totalSalary = members.reduce((s, m) => s + Number(m.monthly_salary || 0), 0)
  const OH_PERCENT = 0.22 // 22% overhead (DSMF + işsizlik + s.s)
  const totalOverhead = totalSalary * OH_PERCENT
  const totalPayroll = totalSalary + totalOverhead

  async function updateSalary(id, salary) {
    await supabase.from('profiles').update({ monthly_salary: Number(salary) }).eq('id', id)
    addToast('Maaş yeniləndi', 'success')
    await loadData()
  }

  function exportCSV() {
    const rows = members.map(m => `${m.full_name},${m.roles?.title_az || ''},${m.monthly_salary || 0},${Math.round(Number(m.monthly_salary || 0) * OH_PERCENT)}`)
    const csv = ['Ad,Vəzifə,Maaş,Overhead', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `maas-${month}.csv`; a.click()
  }

  if (loading) return <div className="p-4 lg:p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-4 lg:p-6 fade-in">
      <PageHeader
        title="Əmək haqqı"
        subtitle="Aylıq maaş hesablaması · Yalnız Founding Architect görür"
        action={
          <div className="flex gap-2">
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="px-3 py-1.5 border border-[#e8e8e4] rounded-lg text-xs focus:outline-none focus:border-[#0f172a]" />
            <Button variant="secondary" size="sm" onClick={exportCSV}>
              <IconDownload size={13} /> CSV
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <StatCard label="Ümumi maaş fondu" value={fmt(totalSalary)} variant="danger" />
        <StatCard label="Overhead (22%)" value={fmt(Math.round(totalOverhead))} variant="warning" sub="DSMF + işsizlik + s.s" />
        <StatCard label="Ümumi xərc" value={fmt(Math.round(totalPayroll))} variant="danger" />
      </div>

      <Card>
        <div className="px-4 py-3 border-b border-[#e8e8e4] flex items-center justify-between">
          <div className="text-xs font-bold text-[#0f172a]">Komanda — {new Date(month + '-01').toLocaleDateString('az-AZ', { month: 'long', year: 'numeric' })}</div>
          <div className="text-xs text-[#aaa]">Maaşı dəyişmək üçün klikləyin</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#e8e8e4]">
                <th className="text-left px-4 py-3 font-medium text-[#888]">İşçi</th>
                <th className="text-left px-4 py-3 font-medium text-[#888]">Vəzifə</th>
                <th className="text-right px-4 py-3 font-medium text-[#888]">Maaş (₼)</th>
                <th className="text-right px-4 py-3 font-medium text-[#888]">Overhead</th>
                <th className="text-right px-4 py-3 font-medium text-[#888]">Cəmi</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => {
                const salary = Number(m.monthly_salary || 0)
                const overhead = Math.round(salary * OH_PERCENT)
                const total = salary + overhead
                return (
                  <tr key={m.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#0f172a] rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                          {m.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium text-[#0f172a]">{m.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#555]">{m.roles?.title_az || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <EditableSalary value={salary} onSave={v => updateSalary(m.id, v)} />
                    </td>
                    <td className="px-4 py-3 text-right text-[#888]">{fmt(overhead)}</td>
                    <td className="px-4 py-3 text-right font-bold text-[#0f172a]">{fmt(total)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#f5f5f0]">
                <td colSpan={2} className="px-4 py-3 text-xs font-bold text-[#0f172a]">Cəmi</td>
                <td className="px-4 py-3 text-right text-xs font-bold text-[#0f172a]">{fmt(totalSalary)}</td>
                <td className="px-4 py-3 text-right text-xs font-bold text-[#888]">{fmt(Math.round(totalOverhead))}</td>
                <td className="px-4 py-3 text-right text-xs font-bold text-red-700">{fmt(Math.round(totalPayroll))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  )
}

function EditableSalary({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)

  if (editing) return (
    <input type="number" value={val} onChange={e => setVal(e.target.value)} autoFocus
      onBlur={() => { onSave(val); setEditing(false) }}
      onKeyDown={e => { if (e.key === 'Enter') { onSave(val); setEditing(false) } if (e.key === 'Escape') setEditing(false) }}
      className="w-24 px-2 py-1 border border-[#0f172a] rounded text-xs text-right focus:outline-none" />
  )

  return (
    <button onClick={() => { setVal(value); setEditing(true) }}
      className="font-medium text-[#0f172a] hover:text-blue-600 hover:underline transition-colors">
      {value > 0 ? `₼${Number(value).toLocaleString()}` : <span className="text-[#aaa]">Daxil et</span>}
    </button>
  )
}
