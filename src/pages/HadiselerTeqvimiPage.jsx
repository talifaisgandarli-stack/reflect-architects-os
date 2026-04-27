import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { Button, Modal, ConfirmDialog, Skeleton } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconChevronLeft, IconChevronRight, IconFilter, IconUser } from '@tabler/icons-react'

const EVENT_TYPES = [
  { key: 'meeting',  label: 'Görüş',       emoji: '🤝', bg: '#e8f0fe', text: '#1a56db', dot: '#1a56db' },
  { key: 'deadline', label: 'Deadline',     emoji: '🔴', bg: '#fde8e8', text: '#c81e1e', dot: '#c81e1e' },
  { key: 'holiday',  label: 'Bayram/Tətil', emoji: '🎉', bg: '#e8f5e9', text: '#1b5e20', dot: '#2e7d32' },
  { key: 'birthday', label: 'Ad günü',      emoji: '🎂', bg: '#fff8e1', text: '#e65100', dot: '#f57c00' },
  { key: 'event',    label: 'Tədbir',       emoji: '📅', bg: '#f3e8ff', text: '#6b21a8', dot: '#7c3aed' },
  { key: 'other',    label: 'Digər',        emoji: '📌', bg: '#f5f5f0', text: '#555',   dot: '#999'    },
]

const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','İyun','İyul','Avqust','Sentyabr','Oktyabr','Noyabr','Dekabr']
const DAYS   = ['B.e','Ç.a','Çər','C.a','Cüm','Şən','Baz']

function typeOf(key) { return EVENT_TYPES.find(t => t.key === key) || EVENT_TYPES[5] }

// ── Form ─────────────────────────────────────────────────────
function EventForm({ open, onClose, onSave, event, members }) {
  const [form, setForm] = useState({
    title: '', event_type: 'meeting',
    start_date: '', end_date: '', notes: '', tagged_profiles: []
  })

  useEffect(() => {
    if (event) setForm({
      title: event.title || '', event_type: event.event_type || 'meeting',
      start_date: event.start_date || '', end_date: event.end_date || '',
      notes: event.notes || '', tagged_profiles: event.tagged_profiles || []
    })
    else setForm({
      title: '', event_type: 'meeting',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '', notes: '', tagged_profiles: []
    })
  }, [event, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function toggleMember(id) {
    setForm(f => ({
      ...f,
      tagged_profiles: f.tagged_profiles.includes(id)
        ? f.tagged_profiles.filter(x => x !== id)
        : [...f.tagged_profiles, id]
    }))
  }

  const t = typeOf(form.event_type)

  return (
    <Modal open={open} onClose={onClose} title={event ? 'Hadisəni redaktə et' : 'Yeni hadisə'}>
      <div className="space-y-3">
        {/* Növ seçimi */}
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1.5">Növ</label>
          <div className="grid grid-cols-3 gap-1.5">
            {EVENT_TYPES.map(tp => (
              <button key={tp.key} type="button" onClick={() => set('event_type', tp.key)}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-medium transition-all"
                style={form.event_type === tp.key
                  ? { background: tp.bg, borderColor: tp.dot, color: tp.text }
                  : { background: 'white', borderColor: '#e8e8e4', color: '#555' }}>
                <span>{tp.emoji}</span>
                <span>{tp.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Hadisə adı *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} autoFocus
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="Hadisənin adı" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Başlama tarixi *</label>
            <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Bitmə tarixi</label>
            <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Qeyd</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none"
            placeholder="Əlavə məlumat..." />
        </div>

        {/* Tag işçilər */}
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1.5">
            İşçiləri tag et <span className="text-[#aaa] font-normal">(isteğe bağlı)</span>
          </label>
          <div className="flex flex-wrap gap-1.5 p-2.5 border border-[#e8e8e4] rounded-lg max-h-28 overflow-y-auto">
            {members.map(m => (
              <button key={m.id} type="button" onClick={() => toggleMember(m.id)}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                  form.tagged_profiles.includes(m.id)
                    ? 'bg-[#0f172a] text-white border-[#0f172a]'
                    : 'border-[#e8e8e4] text-[#555] hover:border-[#0f172a] bg-white'
                }`}>
                <IconUser size={10} />
                {m.full_name.split(' ')[0]}
              </button>
            ))}
          </div>
          {form.tagged_profiles.length > 0 && (
            <div className="text-[10px] text-[#888] mt-1">
              {form.tagged_profiles.length} nəfər tag olunub
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto">
            {event ? 'Yadda saxla' : 'Əlavə et'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Event pill in calendar ───────────────────────────────────
function EventPill({ event, onClick }) {
  const t = typeOf(event.event_type)
  return (
    <div onClick={e => { e.stopPropagation(); onClick(event) }}
      className="text-[9px] px-1.5 py-0.5 rounded-md truncate mb-0.5 cursor-pointer font-medium leading-tight"
      style={{ background: t.bg, color: t.text }}>
      {t.emoji} {event.title}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────
export default function HadiselerTeqvimiPage() {
  const { addToast } = useToast()
  const { isAdmin, user } = useAuth()
  const today = new Date()
  const [events,     setEvents]     = useState([])
  const [members,    setMembers]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editEvent,  setEditEvent]  = useState(null)
  const [deleteEvent,setDeleteEvent]= useState(null)
  const [viewYear,   setViewYear]   = useState(today.getFullYear())
  const [viewMonth,  setViewMonth]  = useState(today.getMonth())
  const [filterType, setFilterType] = useState('all')
  const [filterUser, setFilterUser] = useState('all') // 'all' | 'mine' | profileId

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [eRes, mRes] = await Promise.all([
      supabase.from('events').select('*').order('start_date'),
      supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name')
    ])
    setEvents(eRes.data || [])
    setMembers(mRes.data || [])
    setLoading(false)
  }

  async function handleSave(form) {
    if (!form.title.trim() || !form.start_date) { addToast('Ad və tarix daxil edin', 'error'); return }
    const data = {
      title: form.title.trim(),
      event_type: form.event_type,
      start_date: form.start_date,
      end_date: form.end_date || form.start_date,
      notes: form.notes || null,
      tagged_profiles: form.tagged_profiles || [],
    }
    if (editEvent) {
      const { error } = await supabase.from('events').update(data).eq('id', editEvent.id)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Yeniləndi', 'success')
    } else {
      const { error } = await supabase.from('events').insert(data)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Hadisə əlavə edildi', 'success')
    }
    setModalOpen(false); setEditEvent(null)
    await loadData()
  }

  async function handleDelete() {
    await supabase.from('events').delete().eq('id', deleteEvent.id)
    addToast('Silindi', 'success')
    setDeleteEvent(null)
    await loadData()
  }

  // Filter
  const filtered = events.filter(e => {
    if (filterType !== 'all' && e.event_type !== filterType) return false
    if (filterUser === 'mine') {
      return (e.tagged_profiles || []).includes(user?.id)
    }
    if (filterUser !== 'all') {
      return (e.tagged_profiles || []).includes(filterUser)
    }
    return true
  })

  // Calendar
  const firstDay = new Date(viewYear, viewMonth, 1)
  const startDow = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells = [...Array(startDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  function eventsForDay(day) {
    if (!day) return []
    const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return filtered.filter(e => e.start_date <= ds && (e.end_date || e.start_date) >= ds)
  }

  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1)
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1)

  const upcoming = filtered
    .filter(e => new Date(e.start_date) >= new Date(today.toDateString()))
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 6)

  if (loading) return <div className="p-6"><Skeleton className="h-96" /></div>

  return (
    <div className="p-4 lg:p-6 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-bold text-[#0f172a]">Hadisələr Təqvimi</h1>
          <p className="text-xs text-[#888] mt-0.5">{filtered.length} hadisə</p>
        </div>
        <Button onClick={() => { setEditEvent(null); setModalOpen(true) }} size="sm">
          <IconPlus size={14} /> Yeni hadisə
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5 p-3 bg-[#f8f8f5] rounded-xl border border-[#eeeeea]">
        {/* Növ filter */}
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setFilterType('all')}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              filterType === 'all'
                ? 'bg-[#0f172a] text-white border-[#0f172a]'
                : 'bg-white text-[#555] border-[#e8e8e4] hover:border-[#0f172a]'
            }`}>
            Hamısı
          </button>
          {EVENT_TYPES.map(tp => (
            <button key={tp.key} onClick={() => setFilterType(tp.key)}
              className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all"
              style={filterType === tp.key
                ? { background: tp.dot, color: 'white', borderColor: tp.dot }
                : { background: 'white', color: '#555', borderColor: '#e8e8e4' }}>
              {tp.emoji} {tp.label}
            </button>
          ))}
        </div>

        {/* İşçi filter */}
        <div className="flex gap-1 ml-auto flex-wrap">
          <button onClick={() => setFilterUser('all')}
            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              filterUser === 'all'
                ? 'bg-[#0f172a] text-white border-[#0f172a]'
                : 'bg-white text-[#555] border-[#e8e8e4] hover:border-[#0f172a]'
            }`}>
            <IconFilter size={11} /> Hamı
          </button>
          <button onClick={() => setFilterUser('mine')}
            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              filterUser === 'mine'
                ? 'bg-[#0f172a] text-white border-[#0f172a]'
                : 'bg-white text-[#555] border-[#e8e8e4] hover:border-[#0f172a]'
            }`}>
            <IconUser size={11} /> Mənim
          </button>
          {members.filter(m => m.id !== user?.id).map(m => (
            <button key={m.id} onClick={() => setFilterUser(m.id)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                filterUser === m.id
                  ? 'bg-[#0f172a] text-white border-[#0f172a]'
                  : 'bg-white text-[#555] border-[#e8e8e4] hover:border-[#0f172a]'
              }`}>
              {m.full_name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Təqvim ── */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#e8e8e4] rounded-2xl overflow-hidden">
            {/* Nav */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0ec]">
              <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f5f5f0] transition-colors">
                <IconChevronLeft size={16} className="text-[#555]" />
              </button>
              <span className="text-sm font-bold text-[#0f172a]">{MONTHS[viewMonth]} {viewYear}</span>
              <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f5f5f0] transition-colors">
                <IconChevronRight size={16} className="text-[#555]" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-[#f0f0ec]">
              {DAYS.map(d => (
                <div key={d} className="py-2 text-center text-[10px] font-bold text-[#bbb] uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                const dayEvs = eventsForDay(day)
                const isToday = day && viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate()
                const isWeekend = day && ((i % 7) === 5 || (i % 7) === 6)
                return (
                  <div key={i}
                    className={`min-h-[80px] p-1.5 border-b border-r border-[#f5f5f0] transition-colors ${
                      day ? 'hover:bg-[#fafaf8] cursor-pointer' : ''
                    } ${isWeekend && day ? 'bg-[#fafaf8]' : ''}`}
                    onClick={() => { if (day) { setEditEvent(null); setModalOpen(true) } }}
                  >
                    {day && (
                      <>
                        <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mb-1 ${
                          isToday ? 'bg-[#0f172a] text-white' : isWeekend ? 'text-[#aaa]' : 'text-[#0f172a]'
                        }`}>
                          {day}
                        </div>
                        {dayEvs.slice(0, 2).map(e => (
                          <EventPill key={e.id} event={e} onClick={ev => { setEditEvent(ev); setModalOpen(true) }} />
                        ))}
                        {dayEvs.length > 2 && (
                          <div className="text-[9px] text-[#aaa] px-1">+{dayEvs.length - 2} daha</div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Sağ panel ── */}
        <div className="space-y-4">

          {/* Legend */}
          <div className="bg-white border border-[#e8e8e4] rounded-2xl p-4">
            <div className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-3">Növlər</div>
            <div className="space-y-1.5">
              {EVENT_TYPES.map(tp => (
                <div key={tp.key} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: tp.dot }} />
                  <span className="text-xs text-[#555]">{tp.emoji} {tp.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming */}
          <div className="bg-white border border-[#e8e8e4] rounded-2xl p-4">
            <div className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-3">Yaxınlaşan hadisələr</div>
            {upcoming.length === 0 ? (
              <div className="text-xs text-[#bbb] py-4 text-center">Yaxın hadisə yoxdur</div>
            ) : (
              <div className="space-y-2">
                {upcoming.map(e => {
                  const tp = typeOf(e.event_type)
                  const days = Math.floor((new Date(e.start_date) - new Date(today.toDateString())) / 86400000)
                  const tagged = (e.tagged_profiles || [])
                    .map(id => members.find(m => m.id === id)?.full_name)
                    .filter(Boolean)
                  return (
                    <div key={e.id}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[#f0f0ec] hover:border-[#e8e8e4] cursor-pointer group transition-colors"
                      onClick={() => { setEditEvent(e); setModalOpen(true) }}>
                      <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-base"
                        style={{ background: tp.bg }}>
                        {tp.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[#0f172a] truncate">{e.title}</div>
                        <div className="text-[10px] text-[#aaa] mt-0.5">
                          {new Date(e.start_date).toLocaleDateString('az-AZ')} ·{' '}
                          <span style={{ color: tp.dot }}>
                            {days === 0 ? 'Bu gün' : days === 1 ? 'Sabah' : `${days} gün qalıb`}
                          </span>
                        </div>
                        {tagged.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {tagged.slice(0, 3).map(name => (
                              <span key={name} className="text-[9px] bg-[#f5f5f0] text-[#777] px-1.5 py-0.5 rounded-full">
                                @{name}
                              </span>
                            ))}
                            {tagged.length > 3 && (
                              <span className="text-[9px] text-[#aaa]">+{tagged.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                      {isAdmin && (
                        <button onClick={ev => { ev.stopPropagation(); setDeleteEvent(e) }}
                          className="opacity-0 group-hover:opacity-100 text-[#ccc] hover:text-red-500 p-0.5 transition-all flex-shrink-0">
                          <IconTrash size={11} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      <EventForm
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditEvent(null) }}
        onSave={handleSave}
        event={editEvent}
        members={members}
      />
      <ConfirmDialog
        open={!!deleteEvent}
        title="Hadisəni sil"
        message={`"${deleteEvent?.title}" silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteEvent(null)}
        danger
      />
    </div>
  )
}
