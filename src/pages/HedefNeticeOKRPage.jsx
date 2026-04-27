import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, StatCard, Skeleton } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconTarget } from '@tabler/icons-react'

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
const STATUSES = [
  { key: 'on_track',  label: 'Hədəfdə',    color: 'success' },
  { key: 'at_risk',   label: 'Risk var',    color: 'warning' },
  { key: 'behind',    label: 'Geridə',      color: 'danger'  },
  { key: 'completed', label: 'Tamamlandı',  color: 'info'    },
]

function OKRForm({ open, onClose, onSave, okr, currentUserId, isAdmin, members }) {
  const year = new Date().getFullYear()
  const [form, setForm] = useState({
    objective: '', quarter: 'Q1', year, status: 'on_track',
    progress: 0, key_results: ['', '', ''], employee_id: currentUserId
  })

  useEffect(() => {
    if (okr) setForm({
      objective: okr.objective || '',
      quarter: okr.quarter || 'Q1',
      year: okr.year || year,
      status: okr.status || 'on_track',
      progress: okr.progress || 0,
      key_results: okr.key_results?.length
        ? [...okr.key_results, '', ''].slice(0, 3)
        : ['', '', ''],
      employee_id: okr.employee_id || currentUserId
    })
    else setForm({
      objective: '', quarter: 'Q1', year, status: 'on_track',
      progress: 0, key_results: ['', '', ''],
      employee_id: currentUserId
    })
  }, [okr, open, currentUserId])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function setKR(i, v) {
    setForm(f => { const kr = [...f.key_results]; kr[i] = v; return { ...f, key_results: kr } })
  }

  return (
    <Modal open={open} onClose={onClose} title={okr ? 'OKR-i redaktə et' : 'Yeni Hədəf (OKR)'}>
      <div className="space-y-3">

        {/* Admin başqasının adından əlavə edə bilər */}
        {isAdmin && members.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">İşçi</label>
            <select value={form.employee_id} onChange={e => set('employee_id', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Hədəf (Objective) *</label>
          <textarea value={form.objective} onChange={e => set('objective', e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none"
            placeholder="Bu rüb nə əldə etmək istəyirəm?" autoFocus />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Rüb</label>
            <select value={form.quarter} onChange={e => set('quarter', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
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
          <label className="block text-xs font-medium text-[#555] mb-1">
            İrəliləyiş: <span className="font-bold text-[#0f172a]">{form.progress}%</span>
          </label>
          <input type="range" min="0" max="100" value={form.progress}
            onChange={e => set('progress', Number(e.target.value))} className="w-full" />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#555] mb-2">Əsas nəticələr (Key Results)</label>
          {form.key_results.map((kr, i) => (
            <input key={i} value={kr} onChange={e => setKR(i, e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] mb-2"
              placeholder={`Əsas nəticə ${i + 1}...`} />
          ))}
        </div>

        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto">
            {okr ? 'Yadda saxla' : 'Əlavə et'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function HedefNeticeOKRPage() {
  const { isAdmin, user } = useAuth()
  const { addToast } = useToast()
  const [okrs, setOkrs] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editOkr, setEditOkr] = useState(null)
  const [deleteOkr, setDeleteOkr] = useState(null)
  const [filterQ, setFilterQ] = useState('all')
  const year = new Date().getFullYear()

  useEffect(() => { if (user?.id) loadData() }, [user])

  async function loadData() {
    setLoading(true)
    // İşçi yalnız öz OKR-lərini görür
    let query = supabase.from('okrs')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
    if (!isAdmin) query = query.eq('employee_id', user.id)

    const [oRes, mRes] = await Promise.all([
      query,
      supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name')
    ])
    setOkrs(oRes.data || [])
    setMembers(mRes.data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.objective.trim()) { addToast('Hədəf daxil edin', 'error'); return }
    const data = {
      objective: form.objective.trim(),
      quarter: form.quarter,
      year: Number(form.year),
      status: form.status,
      progress: Number(form.progress),
      key_results: form.key_results.filter(kr => kr.trim()),
      // İşçi yalnız özü üçün əlavə edir, admin seçə bilir
      employee_id: isAdmin ? (form.employee_id || user.id) : user.id,
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

  const filtered = okrs.filter(o =>
    Number(o.year) === year && (filterQ === 'all' || o.quarter === filterQ)
  )
  const avgProgress = filtered.length
    ? Math.round(filtered.reduce((s, o) => s + Number(o.progress || 0), 0) / filtered.length)
    : 0

  if (loading) return <div className="p-4 lg:p-6"><Skeleton className="h-64" /></div>

  return (
    <div className="p-4 lg:p-6 fade-in">
      <PageHeader
        title={isAdmin ? 'Hədəf və Nəticələr (OKR)' : 'Mənim Hədəflərim (OKR)'}
        subtitle={`${year} · ${avgProgress}% ümumi irəliləyiş`}
        action={
          <Button onClick={() => { setEditOkr(null); setModalOpen(true) }} size="sm">
            <IconPlus size={14} /> Yeni OKR
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Ümumi OKR" value={filtered.length} />
        <StatCard label="Hədəfdə" value={filtered.filter(o => o.status === 'on_track').length} variant="success" />
        <StatCard label="Risk var" value={filtered.filter(o => o.status === 'at_risk').length} variant="warning" />
        <StatCard label="Orta irəliləyiş" value={`${avgProgress}%`} />
      </div>

      <div className="flex gap-1 mb-5 border-b border-[#e8e8e4]">
        {[{ key: 'all', label: 'Hamısı' }, ...QUARTERS.map(q => ({ key: q, label: q }))].map(q => (
          <button key={q.key} onClick={() => setFilterQ(q.key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              filterQ === q.key
                ? 'border-[#0f172a] text-[#0f172a]'
                : 'border-transparent text-[#888] hover:text-[#555]'
            }`}>
            {q.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={IconTarget}
          title="Bu dövr üçün OKR yoxdur"
          description={isAdmin ? 'Yeni hədəf əlavə edin' : 'Öz hədəflərinizi əlavə edin'}
          action={
            <Button onClick={() => setModalOpen(true)} size="sm">
              <IconPlus size={14} /> Yeni OKR əlavə et
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(okr => {
            const st = STATUSES.find(s => s.key === okr.status)
            const barColor = okr.status === 'completed' ? '#3b82f6'
              : okr.status === 'on_track' ? '#22c55e'
              : okr.status === 'at_risk' ? '#f59e0b'
              : '#ef4444'
            return (
              <Card key={okr.id} className="p-4 hover:border-[#0f172a] transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="default" size="sm">{okr.quarter} {okr.year}</Badge>
                    <Badge variant={st?.color} size="sm">{st?.label}</Badge>
                    {/* Admin baxışında kimin OKR-i olduğu göstərilir */}
                    {isAdmin && okr.profiles?.full_name && (
                      <span className="text-[10px] text-[#aaa]">{okr.profiles.full_name}</span>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditOkr(okr); setModalOpen(true) }}
                      className="text-[#aaa] hover:text-[#0f172a] p-1">
                      <IconEdit size={13} />
                    </button>
                    <button onClick={() => setDeleteOkr(okr)}
                      className="text-[#aaa] hover:text-red-500 p-1">
                      <IconTrash size={13} />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-[#0f172a] mb-3 leading-snug">{okr.objective}</h3>

                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#888]">İrəliləyiş</span>
                    <span className="font-bold text-[#0f172a]">{okr.progress}%</span>
                  </div>
                  <div className="h-2 bg-[#f0f0ec] rounded-full overflow-hidden">
                    <div className="h-2 rounded-full transition-all"
                      style={{ width: `${okr.progress}%`, background: barColor }} />
                  </div>
                </div>

                {okr.key_results?.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-[#f5f5f0]">
                    {okr.key_results.map((kr, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#555]">
                        <span className="text-[#bbb] flex-shrink-0 mt-0.5">▸</span>
                        <span className="leading-relaxed">{kr}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <OKRForm
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditOkr(null) }}
        onSave={handleSave}
        okr={editOkr}
        currentUserId={user?.id}
        isAdmin={isAdmin}
        members={members}
      />
      <ConfirmDialog
        open={!!deleteOkr}
        title="OKR-i sil"
        message={`"${deleteOkr?.objective?.slice(0, 50)}" silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOkr(null)}
        danger
      />
    </div>
  )
}
