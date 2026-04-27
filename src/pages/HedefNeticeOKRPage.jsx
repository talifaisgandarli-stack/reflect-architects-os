import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { Badge, Button, Modal, ConfirmDialog, Skeleton } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconTarget, IconBuilding, IconUser, IconChevronRight } from '@tabler/icons-react'

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
const STATUSES = [
  { key: 'on_track',  label: 'Hədəfdə',   dot: '#22c55e', bg: '#f0fdf4', text: '#166534' },
  { key: 'at_risk',   label: 'Risk var',   dot: '#f59e0b', bg: '#fffbeb', text: '#92400e' },
  { key: 'behind',    label: 'Geridə',     dot: '#ef4444', bg: '#fef2f2', text: '#991b1b' },
  { key: 'completed', label: 'Tamamlandı', dot: '#3b82f6', bg: '#eff6ff', text: '#1e40af' },
]

function st(key) { return STATUSES.find(s => s.key === key) || STATUSES[0] }

// ── Form ─────────────────────────────────────────────────────────────────────
function OKRForm({ open, onClose, onSave, okr, currentUserId, isAdmin, members }) {
  const year = new Date().getFullYear()
  const [form, setForm] = useState({
    objective: '', quarter: 'Q1', year, status: 'on_track',
    progress: 0, key_results: ['', '', ''],
    scope: 'personal', employee_id: currentUserId
  })

  useEffect(() => {
    if (okr) setForm({
      objective: okr.objective || '', quarter: okr.quarter || 'Q1',
      year: okr.year || year, status: okr.status || 'on_track',
      progress: okr.progress || 0,
      key_results: okr.key_results?.length ? [...okr.key_results, '', ''].slice(0, 3) : ['', '', ''],
      scope: okr.employee_id ? 'personal' : 'company',
      employee_id: okr.employee_id || currentUserId
    })
    else setForm({
      objective: '', quarter: 'Q1', year, status: 'on_track',
      progress: 0, key_results: ['', '', ''],
      scope: 'personal', employee_id: currentUserId
    })
  }, [okr, open, currentUserId])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setKR = (i, v) => setForm(f => { const kr = [...f.key_results]; kr[i] = v; return { ...f, key_results: kr } })

  return (
    <Modal open={open} onClose={onClose} title={okr ? 'OKR redaktə et' : 'Yeni OKR'}>
      <div className="space-y-3">
        {isAdmin && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'company', icon: <IconBuilding size={13} />, label: 'Şirkət OKR-i' },
              { key: 'personal', icon: <IconUser size={13} />, label: 'Şəxsi OKR' },
            ].map(opt => (
              <button key={opt.key} type="button" onClick={() => set('scope', opt.key)}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                  form.scope === opt.key
                    ? 'bg-[#0f172a] text-white border-[#0f172a]'
                    : 'bg-white text-[#555] border-[#e8e8e4] hover:border-[#0f172a]'
                }`}>
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        )}

        {isAdmin && form.scope === 'personal' && (
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">İşçi</label>
            <select value={form.employee_id} onChange={e => set('employee_id', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Hədəf *</label>
          <textarea value={form.objective} onChange={e => set('objective', e.target.value)} rows={2} autoFocus
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none"
            placeholder={isAdmin && form.scope === 'company' ? 'Şirkətin bu rüb əsas hədəfi...' : 'Bu rüb nə əldə etmək istəyirəm?'} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Rüb</label>
            <select value={form.quarter} onChange={e => set('quarter', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {QUARTERS.map(q => <option key={q}>{q}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">İl</label>
            <input type="number" value={form.year} onChange={e => set('year', Number(e.target.value))}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs font-medium text-[#555]">İrəliləyiş</label>
            <span className="text-xs font-bold text-[#0f172a]">{form.progress}%</span>
          </div>
          <input type="range" min="0" max="100" value={form.progress}
            onChange={e => set('progress', Number(e.target.value))} className="w-full" />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#555] mb-1.5">Key Results</label>
          {form.key_results.map((kr, i) => (
            <input key={i} value={kr} onChange={e => setKR(i, e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] mb-2"
              placeholder={`Əsas nəticə ${i + 1}`} />
          ))}
        </div>

        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto">{okr ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── OKR Card ──────────────────────────────────────────────────────────────────
function OKRCard({ okr, onEdit, onDelete }) {
  const s = st(okr.status)
  const barW = `${okr.progress || 0}%`

  return (
    <div className="group relative bg-white border border-[#ebebeb] rounded-2xl p-5 hover:border-[#0f172a] hover:shadow-sm transition-all duration-200">
      {/* Status stripe */}
      <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full" style={{ background: s.dot }} />

      <div className="pl-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-[#aaa] tracking-wider">{okr.quarter} {okr.year}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.text }}>
              {s.label}
            </span>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={() => onEdit(okr)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#f5f5f0] text-[#bbb] hover:text-[#0f172a] transition-colors">
              <IconEdit size={12} />
            </button>
            <button onClick={() => onDelete(okr)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-50 text-[#bbb] hover:text-red-500 transition-colors">
              <IconTrash size={12} />
            </button>
          </div>
        </div>

        {/* Objective */}
        <p className="text-sm font-semibold text-[#0f172a] leading-snug mb-4">{okr.objective}</p>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] text-[#aaa] uppercase tracking-wider">İrəliləyiş</span>
            <span className="text-xs font-bold" style={{ color: s.dot }}>{okr.progress || 0}%</span>
          </div>
          <div className="h-1 bg-[#f0f0ec] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: barW, background: s.dot }} />
          </div>
        </div>

        {/* Key Results */}
        {okr.key_results?.length > 0 && (
          <div className="space-y-1.5">
            {okr.key_results.map((kr, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: s.dot }} />
                <span className="text-[11px] text-[#666] leading-relaxed">{kr}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Person Row (sol panel) ────────────────────────────────────────────────────
function PersonRow({ member, okrCount, avgProgress, selected, onClick }) {
  const initials = member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
        selected
          ? 'bg-[#0f172a] text-white'
          : 'hover:bg-[#f5f5f0] text-[#0f172a]'
      }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
        selected ? 'bg-white/20 text-white' : 'bg-[#0f172a] text-white'
      }`}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-semibold truncate ${selected ? 'text-white' : 'text-[#0f172a]'}`}>
          {member.full_name}
        </div>
        <div className={`text-[10px] ${selected ? 'text-white/60' : 'text-[#aaa]'}`}>
          {okrCount} OKR · {avgProgress}%
        </div>
      </div>
      <IconChevronRight size={12} className={selected ? 'text-white/50' : 'text-[#ccc]'} />
    </button>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HedefNeticeOKRPage() {
  const { isAdmin, user } = useAuth()
  const { addToast } = useToast()
  const [okrs,       setOkrs]       = useState([])
  const [members,    setMembers]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editOkr,    setEditOkr]    = useState(null)
  const [deleteOkr,  setDeleteOkr]  = useState(null)
  const [filterQ,    setFilterQ]    = useState('all')
  const [activeTab,  setActiveTab]  = useState('company')
  const [selectedId, setSelectedId] = useState(null) // personal tab-da seçilmiş işçi
  const year = new Date().getFullYear()

  useEffect(() => { if (user?.id) loadData() }, [user])

  async function loadData() {
    setLoading(true)
    let query = supabase.from('okrs').select('*, profiles(full_name)').order('created_at', { ascending: false })
    if (!isAdmin) query = query.eq('employee_id', user.id)
    const [oRes, mRes] = await Promise.all([
      query,
      supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name')
    ])
    setOkrs(oRes.data || [])
    const ms = mRes.data || []
    setMembers(ms)
    // Default seçilmiş işçi: özü
    if (!selectedId && ms.length > 0) {
      setSelectedId(isAdmin ? ms[0].id : user.id)
    }
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.objective.trim()) { addToast('Hədəf daxil edin', 'error'); return }
    const data = {
      objective: form.objective.trim(), quarter: form.quarter,
      year: Number(form.year), status: form.status,
      progress: Number(form.progress),
      key_results: form.key_results.filter(kr => kr.trim()),
      employee_id: isAdmin
        ? (form.scope === 'company' ? null : (form.employee_id || user.id))
        : user.id,
    }
    if (editOkr) {
      const { error } = await supabase.from('okrs').update(data).eq('id', editOkr.id)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('OKR yeniləndi', 'success')
    } else {
      const { error } = await supabase.from('okrs').insert(data)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('OKR əlavə edildi', 'success')
    }
    setModalOpen(false); setEditOkr(null)
    await loadData()
  }

  async function handleDelete() {
    const { error } = await supabase.from('okrs').delete().eq('id', deleteOkr.id)
    if (error) { addToast('Xəta: ' + error.message, 'error'); return }
    addToast('Silindi', 'success')
    setDeleteOkr(null)
    await loadData()
  }

  const byYear = okrs.filter(o => Number(o.year) === year && (filterQ === 'all' || o.quarter === filterQ))
  const companyOkrs  = byYear.filter(o => !o.employee_id)
  const personalOkrs = byYear.filter(o =>  !!o.employee_id)

  // İşçi üçün seçilmiş person-un OKR-ləri
  const visibleOkrs = isAdmin
    ? (activeTab === 'company'
        ? companyOkrs
        : personalOkrs.filter(o => o.employee_id === selectedId))
    : personalOkrs

  const avgProgress = visibleOkrs.length
    ? Math.round(visibleOkrs.reduce((s, o) => s + Number(o.progress || 0), 0) / visibleOkrs.length)
    : 0

  // Hər işçi üçün stat
  function memberStats(memberId) {
    const ms = personalOkrs.filter(o => o.employee_id === memberId)
    const avg = ms.length ? Math.round(ms.reduce((s, o) => s + Number(o.progress || 0), 0) / ms.length) : 0
    return { count: ms.length, avg }
  }

  if (loading) return <div className="p-4 lg:p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-4 lg:p-6 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-bold text-[#0f172a]">
            {isAdmin ? 'Hədəf və Nəticələr' : 'Mənim Hədəflərim'}
          </h1>
          <p className="text-xs text-[#888] mt-0.5">
            {year} · {visibleOkrs.length} OKR · {avgProgress}% irəliləyiş
          </p>
        </div>
        <Button onClick={() => { setEditOkr(null); setModalOpen(true) }} size="sm">
          <IconPlus size={14} /> Yeni OKR
        </Button>
      </div>

      {/* Admin tab-ları */}
      {isAdmin && (
        <div className="flex gap-1 mb-5 p-1 bg-[#f5f5f0] rounded-xl w-fit">
          <button onClick={() => setActiveTab('company')}
            className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'company' ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#888]'
            }`}>
            <IconBuilding size={12} /> Şirkət
            <span className="text-[10px] text-[#aaa]">{companyOkrs.length}</span>
          </button>
          <button onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'personal' ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#888]'
            }`}>
            <IconUser size={12} /> Şəxsi
            <span className="text-[10px] text-[#aaa]">{personalOkrs.length}</span>
          </button>
        </div>
      )}

      {/* Rüb filter */}
      <div className="flex gap-1 mb-5 border-b border-[#e8e8e4]">
        {[{ key: 'all', label: 'Hamısı' }, ...QUARTERS.map(q => ({ key: q, label: q }))].map(q => (
          <button key={q.key} onClick={() => setFilterQ(q.key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              filterQ === q.key ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#888] hover:text-[#555]'
            }`}>
            {q.label}
          </button>
        ))}
      </div>

      {/* Personal tab: 2-col layout — sol işçilər, sağ OKR-lər */}
      {isAdmin && activeTab === 'personal' ? (
        <div className="grid grid-cols-[220px_1fr] gap-5">

          {/* Sol panel — işçilər */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider px-3 mb-2">
              Əməkdaşlar
            </div>
            {members.map(m => {
              const { count, avg } = memberStats(m.id)
              return (
                <PersonRow
                  key={m.id}
                  member={m}
                  okrCount={count}
                  avgProgress={avg}
                  selected={selectedId === m.id}
                  onClick={() => setSelectedId(m.id)}
                />
              )
            })}
          </div>

          {/* Sağ panel — seçilmiş işçinin OKR-ləri */}
          <div>
            {selectedId && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-bold text-[#0f172a]">
                      {members.find(m => m.id === selectedId)?.full_name}
                    </div>
                    <div className="text-xs text-[#888] mt-0.5">
                      {visibleOkrs.length} OKR · {avgProgress}% orta irəliləyiş
                    </div>
                  </div>
                  {/* Status mini summary */}
                  <div className="flex gap-2">
                    {STATUSES.map(s => {
                      const cnt = visibleOkrs.filter(o => o.status === s.key).length
                      if (!cnt) return null
                      return (
                        <div key={s.key} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full"
                          style={{ background: s.bg, color: s.text }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                          {cnt} {s.label}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {visibleOkrs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-[#e8e8e4] rounded-2xl">
                    <IconTarget size={28} className="text-[#ddd] mb-3" />
                    <div className="text-xs font-medium text-[#aaa]">Bu əməkdaş üçün OKR yoxdur</div>
                    <button onClick={() => setModalOpen(true)}
                      className="mt-3 text-xs text-[#0f172a] font-medium underline underline-offset-2">
                      OKR əlavə et
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {visibleOkrs.map(okr => (
                      <OKRCard key={okr.id} okr={okr}
                        onEdit={o => { setEditOkr(o); setModalOpen(true) }}
                        onDelete={setDeleteOkr} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      ) : (
        /* Şirkət tab + işçi öz görünüşü */
        <>
          {visibleOkrs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <IconTarget size={36} className="text-[#ddd] mb-3" />
              <div className="text-sm font-medium text-[#aaa] mb-1">
                {isAdmin ? 'Şirkət OKR-i yoxdur' : 'Hədəfləriniz yoxdur'}
              </div>
              <div className="text-xs text-[#bbb] mb-4">Yeni hədəf əlavə edin</div>
              <Button onClick={() => setModalOpen(true)} size="sm">
                <IconPlus size={14} /> Yeni OKR
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {visibleOkrs.map(okr => (
                <OKRCard key={okr.id} okr={okr}
                  onEdit={o => { setEditOkr(o); setModalOpen(true) }}
                  onDelete={setDeleteOkr} />
              ))}
            </div>
          )}
        </>
      )}

      <OKRForm open={modalOpen}
        onClose={() => { setModalOpen(false); setEditOkr(null) }}
        onSave={handleSave} okr={editOkr}
        currentUserId={user?.id} isAdmin={isAdmin} members={members} />
      <ConfirmDialog open={!!deleteOkr} title="OKR-i sil"
        message={`"${deleteOkr?.objective?.slice(0, 60)}" silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteOkr(null)} danger />
    </div>
  )
}
