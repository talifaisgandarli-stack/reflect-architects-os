import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Card, Button, Skeleton, StatCard, Modal, Badge } from '../components/ui'
import { IconEdit, IconCheck, IconHistory, IconPlus } from '@tabler/icons-react'

function fmt(n) { return '₼' + Number(n || 0).toFixed(2) }
function fmtN(n) { return '₼' + Math.round(Number(n || 0)).toLocaleString() }

// 2026 Azərbaycan vergi sistemi — Özəl sektor
function calcFromNet(net) {
  const targetNet = Number(net)
  if (!targetNet || targetNet <= 0) return null

  // Binary search ilə gross tap
  let lo = targetNet, hi = targetNet * 3
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2
    const n = calcFromGross(mid)
    if (!n) break
    if (Math.abs(n.net - targetNet) < 0.001) { lo = mid; hi = mid; break }
    if (n.net < targetNet) lo = mid
    else hi = mid
  }
  return calcFromGross((lo + hi) / 2)
}

function calcFromGross(gross) {
  const g = Number(gross) || 0
  if (g <= 0) return null

  // Gəlir vergisi
  let income_tax
  if (g <= 2500) income_tax = Math.max(0, (g - 200) * 0.03)
  else if (g <= 8000) income_tax = 75 + (g - 2500) * 0.10
  else income_tax = 625 + (g - 8000) * 0.14

  // DSMF işçi
  let dsmf_e
  if (g <= 200) dsmf_e = g * 0.03
  else if (g <= 8000) dsmf_e = 6 + (g - 200) * 0.10
  else dsmf_e = 786 + (g - 8000) * 0.10

  const unempl_e = g * 0.005
  const medical_e = g <= 2500 ? g * 0.02 : 50 + (g - 2500) * 0.005
  const net = g - income_tax - dsmf_e - unempl_e - medical_e

  // DSMF işəgötürən
  let dsmf_er
  if (g <= 200) dsmf_er = g * 0.22
  else if (g <= 8000) dsmf_er = 44 + (g - 200) * 0.15
  else dsmf_er = 44 + 7800 * 0.15 + (g - 8000) * 0.15

  const unempl_er = g * 0.005
  const medical_er = g <= 2500 ? g * 0.02 : 50 + (g - 2500) * 0.005
  const employer_total = dsmf_er + unempl_er + medical_er
  const total_cost = g + employer_total

  return {
    gross: Math.round(g * 100) / 100,
    income_tax: Math.round(income_tax * 100) / 100,
    dsmf_e: Math.round(dsmf_e * 100) / 100,
    unempl_e: Math.round(unempl_e * 100) / 100,
    medical_e: Math.round(medical_e * 100) / 100,
    net: Math.round(net * 100) / 100,
    dsmf_er: Math.round(dsmf_er * 100) / 100,
    unempl_er: Math.round(unempl_er * 100) / 100,
    medical_er: Math.round(medical_er * 100) / 100,
    employer_total: Math.round(employer_total * 100) / 100,
    total_cost: Math.round(total_cost * 100) / 100,
  }
}

function SalaryModal({ open, onClose, onSave, member }) {
  const [net, setNet] = useState('')
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0])
  const [reason, setReason] = useState('')
  const calc = calcFromNet(net)

  useEffect(() => {
    if (member) setNet(member.monthly_salary ? String(member.monthly_salary) : '')
  }, [member, open])

  return (
    <Modal open={open} onClose={onClose} title={`Maaş dəyiş — ${member?.full_name}`} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Net maaş (₼)</label>
            <input type="number" value={net} onChange={e => setNet(e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
              placeholder="0" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Tarixdən etibarlı</label>
            <input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Səbəb (isteğe bağlı)</label>
          <input value={reason} onChange={e => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="İllik artım, vəzifə yüksəlişi..." />
        </div>

        {calc && (
          <>
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <div className="text-xs text-[#888] mb-0.5">GROSS MAAŞ (avtomatik)</div>
              <div className="text-2xl font-bold text-[#0f172a]">{fmt(calc.gross)} AZN</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <div className="text-xs font-bold text-red-700 mb-2">👤 İşçi kesimlər</div>
                <div className="space-y-1 text-xs">
                  {[
                    ['Gəlir vergisi', calc.income_tax],
                    ['DSMF', calc.dsmf_e],
                    ['İşsizlik', calc.unempl_e],
                    ['Tibbi', calc.medical_e],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-[#555]">{label}</span>
                      <span className="font-medium text-red-600">{fmt(val)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-red-200 pt-1 mt-1">
                    <span className="font-bold text-[#0f172a]">Cəmi:</span>
                    <span className="font-bold text-red-600">{fmt(calc.gross - calc.net)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <div className="text-xs font-bold text-amber-700 mb-2">🏢 Şirkət öhdəlikləri</div>
                <div className="space-y-1 text-xs">
                  {[
                    ['DSMF', calc.dsmf_er],
                    ['İşsizlik', calc.unempl_er],
                    ['Tibbi', calc.medical_er],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-[#555]">{label}</span>
                      <span className="font-medium text-amber-700">{fmt(val)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-amber-200 pt-1 mt-1">
                    <span className="font-bold text-[#0f172a]">Cəmi:</span>
                    <span className="font-bold text-amber-700">{fmt(calc.employer_total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#0f172a] rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs text-white/70">Şirkətə ümumi xərc</span>
              <span className="text-lg font-bold text-white">{fmt(calc.total_cost)} AZN</span>
            </div>
          </>
        )}

        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(Number(net), calc?.gross, effectiveDate, reason)} disabled={!calc} className="ml-auto">
            <IconCheck size={13} /> Yadda saxla
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function HistoryModal({ open, onClose, member, history }) {
  return (
    <Modal open={open} onClose={onClose} title={`Maaş tarixi — ${member?.full_name}`}>
      {history.length === 0 ? (
        <div className="text-center text-xs text-[#aaa] py-8">Maaş tarixi yoxdur</div>
      ) : (
        <div className="space-y-2">
          {history.map((h, i) => (
            <div key={h.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${i === 0 ? 'bg-green-50 border border-green-200' : 'bg-[#f5f5f0]'}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#0f172a]">{fmt(h.net_salary)} net</span>
                  <span className="text-xs text-[#888]">→ {fmt(h.gross_salary)} gross</span>
                  {i === 0 && <Badge variant="success" size="sm">Cari</Badge>}
                </div>
                {h.reason && <div className="text-xs text-[#888] mt-0.5">{h.reason}</div>}
              </div>
              <div className="text-xs text-[#aaa]">{new Date(h.effective_date).toLocaleDateString('az-AZ')}</div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

export default function EmekHaqqiPage() {
  const { addToast } = useToast()
  const { isAdmin, user } = useAuth()
  const [members, setMembers] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [salaryModal, setSalaryModal] = useState(null)
  const [historyModal, setHistoryModal] = useState(null)

  useEffect(() => { if (user?.id) loadData() }, [user])

  async function loadData() {
    setLoading(true)
    let query = supabase.from('profiles').select('*, roles(title_az)').eq('is_active', true).order('full_name')
    if (!isAdmin) query = query.eq('id', user.id)
    const [mRes, hRes] = await Promise.all([
      query,
      supabase.from('salary_history').select('*').order('effective_date', { ascending: false })
    ])
    setMembers(mRes.data || [])
    setHistory(hRes.data || [])
    setLoading(false)
  }

  async function saveSalary(net, gross, effectiveDate, reason) {
    const { error: histErr } = await supabase.from('salary_history').insert({
      employee_id: salaryModal.id,
      net_salary: net,
      gross_salary: gross,
      effective_date: effectiveDate,
      reason: reason || null
    })
    if (histErr) { addToast('Xəta: ' + histErr.message, 'error'); return }

    const { error } = await supabase.from('profiles').update({ monthly_salary: net }).eq('id', salaryModal.id)
    if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin', 'error'); return }

    addToast('Maaş yeniləndi', 'success')
    setSalaryModal(null)
    await loadData()
  }

  const memberHistory = (m) => history.filter(h => h.employee_id === m.id)

  const totalNet = members.reduce((s, m) => s + Number(m.monthly_salary || 0), 0)
  const totalGross = members.reduce((s, m) => {
    const c = calcFromNet(m.monthly_salary)
    return s + (c?.gross || 0)
  }, 0)
  const totalCost = members.reduce((s, m) => {
    const c = calcFromNet(m.monthly_salary)
    return s + (c?.total_cost || 0)
  }, 0)
  const totalEmployer = members.reduce((s, m) => {
    const c = calcFromNet(m.monthly_salary)
    return s + (c?.employer_total || 0)
  }, 0)

  if (loading) return <div className="p-4 lg:p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-4 lg:p-6 fade-in">
      <PageHeader title="Əmək haqqı" subtitle="Azərbaycan 2026 · Net → Gross avtomatik" />

      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatCard label="Ümumi Net" value={fmtN(totalNet)} />
          <StatCard label="Ümumi Gross" value={fmtN(totalGross)} />
          <StatCard label="Şirkət öhdəlikləri" value={fmtN(totalEmployer)} />
          <StatCard label="Ümumi xərc" value={fmtN(totalCost)} variant="danger" />
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#e8e8e4]">
                <th className="text-left px-4 py-3 font-medium text-[#888]">İşçi</th>
                <th className="text-left px-4 py-3 font-medium text-[#888]">Vəzifə</th>
                <th className="text-right px-4 py-3 font-medium text-[#888]">Net</th>
                <th className="text-right px-4 py-3 font-medium text-[#888]">Gross</th>
                <th className="text-right px-4 py-3 font-medium text-[#888]">Gəlir v.</th>
                <th className="text-right px-4 py-3 font-medium text-[#888]">DSMF</th>
                <th className="text-right px-4 py-3 font-medium text-[#888]">İşsizlik</th>
                <th className="text-right px-4 py-3 font-medium text-[#888]">Tibbi</th>
                {isAdmin && <>
                  <th className="text-right px-4 py-3 font-medium text-[#888]">Şirkət öhdəlik</th>
                  <th className="text-right px-4 py-3 font-medium text-[#888] bg-amber-50">Ümumi xərc</th>
                </>}
                {isAdmin && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {members.map(m => {
                const c = calcFromNet(m.monthly_salary)
                const mHistory = memberHistory(m)
                const initials = m.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <tr key={m.id} className="border-b border-[#f5f5f0] hover:bg-[#fafaf8]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#0f172a] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[9px] font-bold">{initials}</span>
                        </div>
                        <div>
                          <div className="font-medium text-[#0f172a]">{m.full_name}</div>
                          {m.career_level && <div className="text-[10px] text-[#aaa]">{m.career_level}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#555]">{m.roles?.title_az || '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">{c ? fmt(c.net) : '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-[#0f172a]">{c ? fmt(c.gross) : '—'}</td>
                    <td className="px-4 py-3 text-right text-red-500">{c ? fmt(c.income_tax) : '—'}</td>
                    <td className="px-4 py-3 text-right text-red-500">{c ? fmt(c.dsmf_e) : '—'}</td>
                    <td className="px-4 py-3 text-right text-red-500">{c ? fmt(c.unempl_e) : '—'}</td>
                    <td className="px-4 py-3 text-right text-red-500">{c ? fmt(c.medical_e) : '—'}</td>
                    {isAdmin && <>
                      <td className="px-4 py-3 text-right text-amber-600">{c ? fmt(c.employer_total) : '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#0f172a] bg-amber-50">{c ? fmt(c.total_cost) : '—'}</td>
                    </>}
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => setSalaryModal(m)} className="text-[#aaa] hover:text-[#0f172a] p-1" title="Maaş dəyiş"><IconEdit size={12} /></button>
                          {mHistory.length > 0 && (
                            <button onClick={() => setHistoryModal(m)} className="text-[#aaa] hover:text-blue-500 p-1" title="Maaş tarixi"><IconHistory size={12} /></button>
                          )}
                        </div>
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
                  <td className="px-4 py-2 text-right text-xs text-green-600">{fmtN(totalNet)}</td>
                  <td className="px-4 py-2 text-right text-xs text-[#0f172a]">{fmtN(totalGross)}</td>
                  <td className="px-4 py-2 text-right text-xs text-red-500">
                    {fmtN(members.reduce((s,m)=>{ const c=calcFromNet(m.monthly_salary); return s+(c?.income_tax||0) },0))}
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-red-500">
                    {fmtN(members.reduce((s,m)=>{ const c=calcFromNet(m.monthly_salary); return s+(c?.dsmf_e||0) },0))}
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-red-500">
                    {fmtN(members.reduce((s,m)=>{ const c=calcFromNet(m.monthly_salary); return s+(c?.unempl_e||0) },0))}
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-red-500">
                    {fmtN(members.reduce((s,m)=>{ const c=calcFromNet(m.monthly_salary); return s+(c?.medical_e||0) },0))}
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-amber-600">{fmtN(totalEmployer)}</td>
                  <td className="px-4 py-2 text-right text-xs text-[#0f172a] bg-amber-50">{fmtN(totalCost)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      <SalaryModal open={!!salaryModal} onClose={() => setSalaryModal(null)} onSave={saveSalary} member={salaryModal} />
      <HistoryModal open={!!historyModal} onClose={() => setHistoryModal(null)} member={historyModal} history={historyModal ? memberHistory(historyModal) : []} />
    </div>
  )
}
