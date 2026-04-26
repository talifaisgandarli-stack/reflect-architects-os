import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Card, Button, Skeleton, StatCard, Modal, Badge } from '../components/ui'
import { IconEdit, IconCheck } from '@tabler/icons-react'

function fmt(n) { return '₼' + Number(n || 0).toFixed(2) }
function fmtN(n) { return '₼' + Math.round(Number(n || 0)).toLocaleString() }

// Azərbaycan 2026 - Özəl sektor vergi hesablaması
function calcSalary(gross) {
  const g = Number(gross) || 0
  if (g <= 0) return null

  // Gəlir vergisi
  let income_tax
  if (g <= 2500) income_tax = Math.max(0, (g - 200) * 0.03)
  else if (g <= 8000) income_tax = 75 + (g - 2500) * 0.10
  else income_tax = 625 + (g - 8000) * 0.14

  // DSMF işçi
  let dsmf_employee
  if (g <= 200) dsmf_employee = g * 0.03
  else if (g <= 8000) dsmf_employee = 6 + (g - 200) * 0.10
  else dsmf_employee = 786 + (g - 8000) * 0.10

  // İşsizlik işçi
  const unemployment_employee = g * 0.005

  // Tibbi sığorta işçi
  const medical_employee = g <= 2500 ? g * 0.02 : 50 + (g - 2500) * 0.005

  // Net maaş
  const net = g - income_tax - dsmf_employee - unemployment_employee - medical_employee

  // DSMF işəgötürən
  let dsmf_employer
  if (g <= 200) dsmf_employer = g * 0.22
  else if (g <= 8000) dsmf_employer = 44 + (g - 200) * 0.15
  else dsmf_employer = 44 + 7800 * 0.15 + (g - 8000) * 0.15

  // İşsizlik işəgötürən
  const unemployment_employer = g * 0.005

  // Tibbi sığorta işəgötürən
  const medical_employer = g <= 2500 ? g * 0.02 : 50 + (g - 2500) * 0.005

  const total_employer_contributions = dsmf_employer + unemployment_employer + medical_employer
  const total_cost = g + total_employer_contributions

  return {
    gross: g,
    income_tax: Math.round(income_tax * 100) / 100,
    dsmf_employee: Math.round(dsmf_employee * 100) / 100,
    unemployment_employee: Math.round(unemployment_employee * 100) / 100,
    medical_employee: Math.round(medical_employee * 100) / 100,
    net: Math.round(net * 100) / 100,
    dsmf_employer: Math.round(dsmf_employer * 100) / 100,
    unemployment_employer: Math.round(unemployment_employer * 100) / 100,
    medical_employer: Math.round(medical_employer * 100) / 100,
    total_employer_contributions: Math.round(total_employer_contributions * 100) / 100,
    total_cost: Math.round(total_cost * 100) / 100,
  }
}

function SalaryModal({ open, onClose, onSave, member }) {
  const [gross, setGross] = useState('')
  const calc = calcSalary(gross)

  useEffect(() => {
    if (member) setGross(member.monthly_salary || '')
  }, [member, open])

  return (
    <Modal open={open} onClose={onClose} title={`Maaş — ${member?.full_name}`} size="lg">
      <div className="space-y-4">
        {/* Gross daxil et */}
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Gross maaş (₼)</label>
          <input
            type="number"
            value={gross}
            onChange={e => setGross(e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="0"
            autoFocus
          />
        </div>

        {calc && (
          <>
            {/* Net maaş - böyük */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="text-xs text-[#888] mb-1">NET MAAŞ</div>
              <div className="text-3xl font-bold text-green-700">{fmt(calc.net)} AZN</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* İşçi kesintilər */}
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <div className="text-xs font-bold text-red-700 mb-2">👤 İşçi kesintilər</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#555]">Vergiyə cəlb olunan:</span>
                    <span className="font-medium">{fmt(calc.gross)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#555]">Gəlir vergisi:</span>
                    <span className="font-medium text-red-600">{fmt(calc.income_tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#555]">DSMF:</span>
                    <span className="font-medium text-red-600">{fmt(calc.dsmf_employee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#555]">İşsizlik:</span>
                    <span className="font-medium text-red-600">{fmt(calc.unemployment_employee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#555]">Tibbi sığorta:</span>
                    <span className="font-medium text-red-600">{fmt(calc.medical_employee)}</span>
                  </div>
                  <div className="flex justify-between border-t border-red-200 pt-1.5 mt-1">
                    <span className="font-bold text-[#0f172a]">Cəmi kesinti:</span>
                    <span className="font-bold text-red-600">{fmt(calc.gross - calc.net)}</span>
                  </div>
                </div>
              </div>

              {/* Şirkət öhdəlikləri */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <div className="text-xs font-bold text-amber-700 mb-2">🏢 Şirkət öhdəlikləri</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#555]">DSMF:</span>
                    <span className="font-medium text-amber-700">{fmt(calc.dsmf_employer)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#555]">İşsizlik:</span>
                    <span className="font-medium text-amber-700">{fmt(calc.unemployment_employer)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#555]">Tibbi sığorta:</span>
                    <span className="font-medium text-amber-700">{fmt(calc.medical_employer)}</span>
                  </div>
                  <div className="flex justify-between border-t border-amber-200 pt-1.5 mt-1">
                    <span className="font-bold text-[#0f172a]">Cəmi öhdəlik:</span>
                    <span className="font-bold text-amber-700">{fmt(calc.total_employer_contributions)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Şirkətə ümumi xərc */}
            <div className="bg-[#0f172a] rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs text-white/70">Şirkətə ümumi xərc</span>
              <span className="text-lg font-bold text-white">{fmt(calc.total_cost)} AZN</span>
            </div>
          </>
        )}

        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(Number(gross))} disabled={!calc} className="ml-auto">
            <IconCheck size={13} /> Yadda saxla
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function EmekHaqqiPage() {
  const { addToast } = useToast()
  const { isAdmin, user } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [salaryModal, setSalaryModal] = useState(null)

  useEffect(() => { loadData() }, [user])

  async function loadData() {
    if (!user?.id) return
    setLoading(true)
    let query = supabase.from('profiles').select('*, roles(title_az)').eq('is_active', true).order('full_name')
    if (!isAdmin) query = query.eq('id', user.id)
    const { data } = await query
    setMembers(data || [])
    setLoading(false)
  }

  async function saveSalary(gross) {
    const { error } = await supabase.from('profiles')
      .update({ monthly_salary: gross })
      .eq('id', salaryModal.id)
    if (error) { addToast('Xəta: ' + error.message, 'error'); return }
    addToast('Maaş yeniləndi', 'success')
    setSalaryModal(null)
    await loadData()
  }

  const totalGross = members.reduce((s, m) => s + Number(m.monthly_salary || 0), 0)
  const totalNet = members.reduce((s, m) => {
    const c = calcSalary(m.monthly_salary)
    return s + (c?.net || 0)
  }, 0)
  const totalCost = members.reduce((s, m) => {
    const c = calcSalary(m.monthly_salary)
    return s + (c?.total_cost || 0)
  }, 0)
  const totalEmployerContrib = members.reduce((s, m) => {
    const c = calcSalary(m.monthly_salary)
    return s + (c?.total_employer_contributions || 0)
  }, 0)

  if (loading) return <div className="p-4 lg:p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-4 lg:p-6 fade-in">
      <PageHeader title="Əmək haqqı" subtitle="Azərbaycan 2026 vergi sistemi — Özəl sektor" />

      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatCard label="Ümumi Gross" value={fmtN(totalGross)} />
          <StatCard label="Ümumi Net" value={fmtN(totalNet)} variant="success" />
          <StatCard label="Şirkət öhdəlikləri" value={fmtN(totalEmployerContrib)} />
          <StatCard label="Şirkətə ümumi xərc" value={fmtN(totalCost)} variant="danger" />
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#e8e8e4]">
                <th className="text-left px-4 py-3 font-medium text-[#888]">İşçi</th>
                <th className="text-left px-4 py-3 font-medium text-[#888]">Vəzifə</th>
                <th className="text-right px-4 py-3 font-medium text-[#888]">Gross</th>
                <th className="text-right px-4 py-3 font-medium text-[#888]">Gəlir vergisi</th>
                <th className="text-right px-4 py-3 font-medium text-[#888]">DSMF</th>
                <th className="text-right px-4 py-3 font-medium text-[#888]">İşsizlik</th>
                <th className="text-right px-4 py-3 font-medium text-[#888]">Tibbi</th>
                <th className="text-right px-4 py-3 font-medium text-[#888] bg-green-50">Net</th>
                {isAdmin && <>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">Şirkət DSMF</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888] bg-amber-50">Ümumi xərc</th>
                </>}
                {isAdmin && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {members.map(m => {
                const c = calcSalary(m.monthly_salary)
                const initials = m.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <tr key={m.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#0f172a] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[9px] font-bold">{initials}</span>
                        </div>
                        <span className="font-medium text-[#0f172a]">{m.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#555]">{m.roles?.title_az || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-[#0f172a]">
                      {c ? fmt(c.gross) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-red-500">{c ? fmt(c.income_tax) : '—'}</td>
                    <td className="px-4 py-3 text-right text-red-500">{c ? fmt(c.dsmf_employee) : '—'}</td>
                    <td className="px-4 py-3 text-right text-red-500">{c ? fmt(c.unemployment_employee) : '—'}</td>
                    <td className="px-4 py-3 text-right text-red-500">{c ? fmt(c.medical_employee) : '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600 bg-green-50">
                      {c ? fmt(c.net) : '—'}
                    </td>
                    {isAdmin && <>
                      <td className="px-4 py-3 text-right text-amber-600">
                        {c ? fmt(c.total_employer_contributions) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#0f172a] bg-amber-50">
                        {c ? fmt(c.total_cost) : '—'}
                      </td>
                    </>}
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <button onClick={() => setSalaryModal(m)}
                          className="text-[#aaa] hover:text-[#0f172a] p-1" title="Maaş dəyiş">
                          <IconEdit size={12} />
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
            {isAdmin && members.length > 0 && (
              <tfoot>
                <tr className="bg-[#f5f5f0] font-bold">
                  <td colSpan={2} className="px-4 py-2 text-xs text-[#555]">Cəmi</td>
                  <td className="px-4 py-2 text-right text-xs text-[#0f172a]">{fmtN(totalGross)}</td>
                  <td className="px-4 py-2 text-right text-xs text-red-500">
                    {fmtN(members.reduce((s,m) => { const c=calcSalary(m.monthly_salary); return s+(c?.income_tax||0) }, 0))}
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-red-500">
                    {fmtN(members.reduce((s,m) => { const c=calcSalary(m.monthly_salary); return s+(c?.dsmf_employee||0) }, 0))}
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-red-500">
                    {fmtN(members.reduce((s,m) => { const c=calcSalary(m.monthly_salary); return s+(c?.unemployment_employee||0) }, 0))}
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-red-500">
                    {fmtN(members.reduce((s,m) => { const c=calcSalary(m.monthly_salary); return s+(c?.medical_employee||0) }, 0))}
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-green-600 bg-green-50">{fmtN(totalNet)}</td>
                  <td className="px-4 py-2 text-right text-xs text-amber-600">{fmtN(totalEmployerContrib)}</td>
                  <td className="px-4 py-2 text-right text-xs text-[#0f172a] bg-amber-50">{fmtN(totalCost)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      <SalaryModal
        open={!!salaryModal}
        onClose={() => setSalaryModal(null)}
        onSave={saveSalary}
        member={salaryModal}
      />
    </div>
  )
}
