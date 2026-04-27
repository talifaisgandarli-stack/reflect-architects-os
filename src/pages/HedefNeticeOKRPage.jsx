import { useState } from 'react'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, StatCard } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconTarget, IconCheck } from '@tabler/icons-react'

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
const STATUSES = [
  { key: 'on_track', label: 'Hədəfdə', color: 'success' },
  { key: 'at_risk', label: 'Risk var', color: 'warning' },
  { key: 'behind', label: 'Geridə', color: 'danger' },
  { key: 'completed', label: 'Tamamlandı', color: 'info' },
]

function OKRForm({ open, onClose, onSave, okr }) {
  const year = new Date().getFullYear()
  const [form, setForm] = useState({ objective: '', quarter: 'Q1', year: year, status: 'on_track', progress: 0, key_results: ['', '', ''] })

  useState(() => {
    if (okr) setForm({ objective: okr.objective || '', quarter: okr.quarter || 'Q1', year: okr.year || year, status: okr.status || 'on_track', progress: okr.progress || 0, key_results: okr.key_results?.length ? [...okr.key_results, '', ''].slice(0, 3) : ['', '', ''] })
    else setForm({ objective: '', quarter: 'Q1', year, status: 'on_track', progress: 0, key_results: ['', '', ''] })
  }, [okr, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function setKR(i, v) { setForm(f => { const kr = [...f.key_results]; kr[i] = v; return { ...f, key_results: kr } }) }

  return (
    <Modal open={open} onClose={onClose} title={okr ? 'OKR-i redaktə et' : 'Yeni Hədəf (OKR)'}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Hədəf (Objective) *</label>
          <textarea value={form.objective} onChange={e => set('objective', e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none"
            placeholder="Bu rüb nə əldə etmək istəyirik?" />
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
            <input type="number" value={form.year} onChange={e => set('year', e.target.value)}
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
          <label className="block text-xs font-medium text-[#555] mb-1">İrəliləyiş: {form.progress}%</label>
          <input type="range" min="0" max="100" value={form.progress} onChange={e => set('progress', Number(e.target.value))}
            className="w-full" />
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
          <Button onClick={() => onSave(form)} className="ml-auto">{okr ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function HedefNeticeOKRPage() {
  const { isAdmin, user } = useAuth()
  const { addToast } = useToast()
  const [okrs, setOkrs] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editOkr, setEditOkr] = useState(null)
  const [deleteOkr, setDeleteOkr] = useState(null)
  const [filterQ, setFilterQ] = useState('all')
  const year = new Date().getFullYear()

  function handleSave(form) {
    if (!form.objective.trim()) { addToast('Hədəf daxil edin', 'error'); return }
    const data = { ...form, key_results: form.key_results.filter(kr => kr.trim()), employee_id: user?.id }
    if (editOkr) {
      setOkrs(prev => prev.map(o => o.id === editOkr.id ? { ...o, ...data } : o))
      addToast('Yeniləndi', 'success')
    } else {
      setOkrs(prev => [...prev, { id: Date.now().toString(), ...data }])
      addToast('OKR əlavə edildi', 'success')
    }
    setModalOpen(false); setEditOkr(null)
  }

  function handleDelete() {
    setOkrs(prev => prev.filter(o => o.id !== deleteOkr.id))
    addToast('Silindi', 'success')
    setDeleteOkr(null)
  }

  const filtered = okrs.filter(o => o.year === year && (filterQ === 'all' || o.quarter === filterQ) && (isAdmin || o.employee_id === user?.id))
  const avgProgress = filtered.length ? Math.round(filtered.reduce((s, o) => s + Number(o.progress || 0), 0) / filtered.length) : 0

  return (
    <div className="p-4 lg:p-6 fade-in">
      <PageHeader
        title="Hədəf və Nəticələr (OKR)"
        subtitle={`${year} · ${avgProgress}% ümumi irəliləyiş`}
        action={<Button onClick={() => { setEditOkr(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni OKR</Button>}
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
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${filterQ === q.key ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#888] hover:text-[#555]'}`}>
            {q.label}
          </button>
        ))}
      </div>

      {okrs.length === 0 ? (
        <EmptyState icon={IconTarget} title="Hələ OKR yoxdur"
          description="Şirkətin rüblük hədəflərini və əsas nəticələrini müəyyənləşdirin"
          action={<Button onClick={() => setModalOpen(true)} size="sm"><IconPlus size={14} /> İlk OKR-i əlavə et</Button>} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(okr => {
            const st = STATUSES.find(s => s.key === okr.status)
            return (
              <Card key={okr.id} className="p-4 hover:border-[#0f172a] transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" size="sm">{okr.quarter} {okr.year}</Badge>
                    <Badge variant={st?.color} size="sm">{st?.label}</Badge>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditOkr(okr); setModalOpen(true) }} className="text-[#aaa] hover:text-[#0f172a] p-1"><IconEdit size={13} /></button>
                    <button onClick={() => setDeleteOkr(okr)} className="text-[#aaa] hover:text-red-500 p-1"><IconTrash size={13} /></button>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-[#0f172a] mb-3">{okr.objective}</h3>
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#888]">İrəliləyiş</span>
                    <span className="font-medium text-[#0f172a]">{okr.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-[#f0f0ec] rounded-full">
                    <div className={`h-1.5 rounded-full transition-all ${okr.status === 'completed' ? 'bg-blue-500' : okr.status === 'on_track' ? 'bg-green-500' : okr.status === 'at_risk' ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${okr.progress}%` }} />
                  </div>
                </div>
                {okr.key_results?.length > 0 && (
                  <div className="space-y-1">
                    {okr.key_results.map((kr, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#555]">
                        <span className="text-[#aaa] flex-shrink-0 mt-0.5">▸</span>
                        <span>{kr}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <OKRForm open={modalOpen} onClose={() => { setModalOpen(false); setEditOkr(null) }} onSave={handleSave} okr={editOkr} />
      <ConfirmDialog open={!!deleteOkr} title="OKR-i sil" message={`"${deleteOkr?.objective?.slice(0, 50)}..." silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteOkr(null)} danger />
    </div>
  )
}
