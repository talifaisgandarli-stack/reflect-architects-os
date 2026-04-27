import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { notify } from '../lib/notify'
import { Button, Modal, ConfirmDialog, Skeleton } from '../components/ui'
import {
  IconPlus, IconEdit, IconTrash, IconChevronLeft, IconChevronRight,
  IconUser, IconClock, IconCalendar, IconCheck, IconX, IconLayoutGrid,
  IconLayoutList, IconUsers
} from '@tabler/icons-react'

// ─── Constants ────────────────────────────────────────────────────────────────
const EVENT_TYPES = [
  { key: 'meeting',  label: 'Görüş',       emoji: '🤝', bg: '#e8f0fe', text: '#1a56db', dot: '#1a56db' },
  { key: 'event',    label: 'Tədbir',       emoji: '📅', bg: '#f3e8ff', text: '#6b21a8', dot: '#7c3aed' },
  { key: 'deadline', label: 'Deadline',     emoji: '🔴', bg: '#fde8e8', text: '#c81e1e', dot: '#c81e1e' },
  { key: 'holiday',  label: 'Bayram/Tətil', emoji: '🎉', bg: '#e8f5e9', text: '#1b5e20', dot: '#2e7d32' },
  { key: 'birthday', label: 'Ad günü',      emoji: '🎂', bg: '#fff8e1', text: '#e65100', dot: '#f57c00' },
  { key: 'other',    label: 'Digər',        emoji: '📌', bg: '#f5f5f0', text: '#555',   dot: '#999'    },
]

const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','İyun','İyul','Avqust','Sentyabr','Oktyabr','Noyabr','Dekabr']
const DAYS_SHORT = ['B.e','Ç.a','Çər','C.a','Cüm','Şən','Baz']
const DAYS_FULL  = ['Bazar ertəsi','Çərşənbə axşamı','Çərşənbə','Cümə axşamı','Cümə','Şənbə','Bazar']

const typeOf = key => EVENT_TYPES.find(t => t.key === key) || EVENT_TYPES[5]

const needsRSVP = t => ['meeting', 'event'].includes(t)

function fmtDate(d) {
  return new Date(d).toLocaleDateString('az-AZ', { day: 'numeric', month: 'long' })
}
function daysLeft(d) {
  const t = new Date(); t.setHours(0,0,0,0)
  const dd = new Date(d); dd.setHours(0,0,0,0)
  return Math.floor((dd - t) / 86400000)
}

// ─── Event Form ───────────────────────────────────────────────────────────────
function EventForm({ open, onClose, onSave, event, members }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    title: '', event_type: 'meeting', start_date: today, end_date: '',
    start_time: '', end_time: '', notes: '', tagged_profiles: [], tag_all: false
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (event) setForm({
      title:           event.title        || '',
      event_type:      event.event_type   || 'meeting',
      start_date:      event.start_date   || today,
      end_date:        event.end_date     || '',
      start_time:      event.start_time   || '',
      end_time:        event.end_time     || '',
      notes:           event.notes        || '',
      tagged_profiles: event.tagged_profiles || [],
      tag_all:         false,
    })
    else setForm({
      title: '', event_type: 'meeting', start_date: today, end_date: '',
      start_time: '', end_time: '', notes: '', tagged_profiles: [], tag_all: false
    })
  }, [event, open])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function toggleMember(id) {
    setForm(f => ({
      ...f,
      tag_all: false,
      tagged_profiles: f.tagged_profiles.includes(id)
        ? f.tagged_profiles.filter(x => x !== id)
        : [...f.tagged_profiles, id]
    }))
  }

  function toggleAll() {
    setForm(f => ({
      ...f,
      tag_all: !f.tag_all,
      tagged_profiles: !f.tag_all ? members.map(m => m.id) : []
    }))
  }

  async function handleSave() {
    if (!form.title.trim() || !form.start_date) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const tp = typeOf(form.event_type)
  const allSelected = form.tagged_profiles.length === members.length && members.length > 0

  return (
    <Modal open={open} onClose={onClose} title={event ? 'Hadisəni redaktə et' : 'Yeni hadisə'}>
      <div className="space-y-4">

        {/* Növ — pill grid */}
        <div>
          <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-2">Növ</label>
          <div className="grid grid-cols-3 gap-1.5">
            {EVENT_TYPES.map(t => (
              <button key={t.key} type="button" onClick={() => set('event_type', t.key)}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-[11px] font-semibold transition-all"
                style={form.event_type === t.key
                  ? { background: t.bg, borderColor: t.dot, color: t.text, boxShadow: `0 0 0 1px ${t.dot}` }
                  : { background: 'white', borderColor: '#ebebeb', color: '#888' }}>
                <span>{t.emoji}</span><span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Başlıq */}
        <div>
          <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1.5">Başlıq *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} autoFocus
            className="w-full px-3 py-2.5 border border-[#ebebeb] rounded-xl text-sm font-medium focus:outline-none focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/10 placeholder-[#ccc]"
            placeholder="Hadisənin adı..." />
        </div>

        {/* Tarix + saat */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1.5">Başlama tarixi *</label>
            <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-[#ebebeb] rounded-xl text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1.5">Bitmə tarixi</label>
            <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)}
              min={form.start_date}
              className="w-full px-3 py-2 border border-[#ebebeb] rounded-xl text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1.5">
              <IconClock size={10} className="inline mr-1" />Başlama saatı
            </label>
            <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)}
              className="w-full px-3 py-2 border border-[#ebebeb] rounded-xl text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1.5">
              <IconClock size={10} className="inline mr-1" />Bitmə saatı
            </label>
            <input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)}
              className="w-full px-3 py-2 border border-[#ebebeb] rounded-xl text-sm focus:outline-none focus:border-[#0f172a]" />
          </div>
        </div>

        {/* Qeyd */}
        <div>
          <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1.5">Qeyd</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-[#ebebeb] rounded-xl text-sm focus:outline-none focus:border-[#0f172a] resize-none placeholder-[#ccc]"
            placeholder="Əlavə məlumat..." />
        </div>

        {/* Tag işçilər */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider">
              İştirakçılar <span className="text-[#bbb] font-normal normal-case">(isteğe bağlı)</span>
            </label>
            <button type="button" onClick={toggleAll}
              className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                allSelected ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'border-[#ebebeb] text-[#555] hover:border-[#0f172a]'
              }`}>
              <IconUsers size={10} /> Bütün komanda
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 p-3 border border-[#ebebeb] rounded-xl max-h-32 overflow-y-auto bg-[#fafafa]">
            {members.map(m => {
              const sel = form.tagged_profiles.includes(m.id)
              return (
                <button key={m.id} type="button" onClick={() => toggleMember(m.id)}
                  className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-full border font-medium transition-all ${
                    sel ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'border-[#e0e0e0] text-[#555] bg-white hover:border-[#0f172a]'
                  }`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black flex-shrink-0 ${sel ? 'bg-white/20' : 'bg-[#0f172a]'}`}>
                    <span className={sel ? 'text-white' : 'text-white'}>{m.full_name[0]}</span>
                  </div>
                  {m.full_name.split(' ')[0]}
                </button>
              )
            })}
          </div>
          {form.tagged_profiles.length > 0 && (
            <p className="text-[10px] text-[#888] mt-1.5">
              {form.tagged_profiles.length === members.length ? '✓ Bütün komanda seçildi' : `${form.tagged_profiles.length} nəfər seçildi`}
              {needsRSVP(form.event_type) && ' · Təsdiq sorğusu göndəriləcək'}
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-3 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose} className="flex-1">Ləğv et</Button>
          <Button onClick={handleSave} disabled={saving || !form.title.trim() || !form.start_date} className="flex-1">
            {saving ? 'Saxlanılır...' : event ? 'Yadda saxla' : 'Əlavə et'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Event Detail Modal ───────────────────────────────────────────────────────
function EventDetail({ event, members, user, onClose, onEdit, onDelete, onRSVP }) {
  if (!event) return null
  const tp = typeOf(event.event_type)
  const dl = daysLeft(event.start_date)
  const tagged = (event.tagged_profiles || []).map(id => members.find(m => m.id === id)).filter(Boolean)
  const rsvp = event.rsvp || {}
  const myRSVP = rsvp[user?.id]
  const isTagged = (event.tagged_profiles || []).includes(user?.id)
  const showRSVP = needsRSVP(event.event_type) && isTagged
  const accepted = Object.values(rsvp).filter(v => v === 'accepted').length
  const declined = Object.values(rsvp).filter(v => v === 'declined').length

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Rəngli header */}
        <div className="px-5 pt-5 pb-4 relative" style={{ background: tp.bg }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{tp.emoji}</span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tp.dot }}>{tp.label}</div>
                <h2 className="text-base font-bold text-[#0f172a] leading-snug mt-0.5">{event.title}</h2>
              </div>
            </div>
            <button onClick={onClose} className="text-[#aaa] hover:text-[#555] p-1">
              <IconX size={16} />
            </button>
          </div>

          {/* Tarix + saat */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-[#555]">
              <IconCalendar size={12} />
              <span>{fmtDate(event.start_date)}</span>
              {event.end_date && event.end_date !== event.start_date && (
                <span className="text-[#aaa]">→ {fmtDate(event.end_date)}</span>
              )}
            </div>
            {(event.start_time || event.end_time) && (
              <div className="flex items-center gap-1.5 text-xs text-[#555]">
                <IconClock size={12} />
                <span>{event.start_time}{event.end_time ? ` – ${event.end_time}` : ''}</span>
              </div>
            )}
            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
              dl < 0 ? 'bg-red-100 text-red-600' : dl === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-white/60 text-[#555]'
            }`}>
              {dl < 0 ? `${Math.abs(dl)}g keçib` : dl === 0 ? 'Bu gün' : dl === 1 ? 'Sabah' : `${dl} gün`}
            </span>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Notes */}
          {event.notes && (
            <p className="text-sm text-[#555] leading-relaxed">{event.notes}</p>
          )}

          {/* İştirakçılar */}
          {tagged.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-2">İştirakçılar</div>
              <div className="flex flex-wrap gap-1.5">
                {tagged.map(m => {
                  const r = rsvp[m.id]
                  return (
                    <div key={m.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border"
                      style={{
                        background: r === 'accepted' ? '#f0fdf4' : r === 'declined' ? '#fef2f2' : '#f8fafc',
                        borderColor: r === 'accepted' ? '#bbf7d0' : r === 'declined' ? '#fecaca' : '#e2e8f0',
                        color: r === 'accepted' ? '#16a34a' : r === 'declined' ? '#dc2626' : '#64748b'
                      }}>
                      {r === 'accepted' ? '✓' : r === 'declined' ? '✕' : '○'}
                      <span>{m.full_name.split(' ')[0]}</span>
                    </div>
                  )
                })}
              </div>
              {(accepted > 0 || declined > 0) && (
                <div className="text-[10px] text-[#aaa] mt-2">
                  {accepted > 0 && <span className="text-green-600 font-medium">{accepted} qəbul etdi</span>}
                  {accepted > 0 && declined > 0 && <span className="mx-1">·</span>}
                  {declined > 0 && <span className="text-red-500 font-medium">{declined} rədd etdi</span>}
                </div>
              )}
            </div>
          )}

          {/* RSVP düymələri */}
          {showRSVP && (
            <div className="border border-[#f0f0ec] rounded-xl p-3 bg-[#fafafa]">
              <div className="text-[10px] font-bold text-[#888] mb-2">Cavabınız:</div>
              <div className="flex gap-2">
                <button onClick={() => onRSVP(event, 'accepted')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    myRSVP === 'accepted'
                      ? 'bg-green-500 text-white border-green-500'
                      : 'border-[#e8e8e4] text-[#555] hover:border-green-400 hover:text-green-600'
                  }`}>
                  <IconCheck size={12} /> Qəbul edirəm
                </button>
                <button onClick={() => onRSVP(event, 'declined')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    myRSVP === 'declined'
                      ? 'bg-red-500 text-white border-red-500'
                      : 'border-[#e8e8e4] text-[#555] hover:border-red-400 hover:text-red-500'
                  }`}>
                  <IconX size={12} /> Rədd edirəm
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={() => onEdit(event)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#e8e8e4] text-xs font-semibold text-[#555] hover:border-[#0f172a] hover:text-[#0f172a] transition-all">
              <IconEdit size={12} /> Redaktə et
            </button>
            <button onClick={() => onDelete(event)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-[#e8e8e4] text-xs font-semibold text-[#aaa] hover:border-red-300 hover:text-red-500 transition-all">
              <IconTrash size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Event Pill ───────────────────────────────────────────────────────────────
function EventPill({ event, onClick }) {
  const t = typeOf(event.event_type)
  return (
    <div onClick={e => { e.stopPropagation(); onClick(event) }}
      className="text-[9px] px-1.5 py-0.5 rounded-md truncate mb-0.5 cursor-pointer font-semibold leading-tight hover:opacity-80 transition-opacity"
      style={{ background: t.bg, color: t.text }}>
      {t.emoji} {event.title}
      {event.start_time && <span className="opacity-60 ml-1">{event.start_time}</span>}
    </div>
  )
}

// ─── Weekly View ──────────────────────────────────────────────────────────────
function WeeklyView({ events, members, viewYear, viewMonth, viewDay, onEventClick }) {
  const startOfWeek = new Date(viewYear, viewMonth, viewDay)
  const dow = (startOfWeek.getDay() + 6) % 7
  startOfWeek.setDate(startOfWeek.getDate() - dow)

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return d
  })

  const today = new Date(); today.setHours(0,0,0,0)

  return (
    <div className="bg-white border border-[#e8e8e4] rounded-2xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[#f0f0ec]">
        {days.map((d, i) => {
          const isToday = d.getTime() === today.getTime()
          const ds = d.toISOString().split('T')[0]
          const dayEvs = events.filter(e => e.start_date <= ds && (e.end_date || e.start_date) >= ds)
          return (
            <div key={i} className={`p-3 border-r border-[#f5f5f0] last:border-0 ${isToday ? 'bg-[#0f172a]/[0.02]' : ''}`}>
              <div className="mb-2 text-center">
                <div className="text-[10px] text-[#aaa] uppercase tracking-wider">{DAYS_SHORT[i]}</div>
                <div className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full text-sm font-bold mt-0.5 ${
                  isToday ? 'bg-[#0f172a] text-white' : 'text-[#0f172a]'
                }`}>{d.getDate()}</div>
              </div>
              <div className="space-y-0.5">
                {dayEvs.map(e => (
                  <EventPill key={e.id} event={e} onClick={onEventClick} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HadiselerTeqvimiPage() {
  const { addToast } = useToast()
  const { user } = useAuth()
  const today = new Date()

  const [events,      setEvents]      = useState([])
  const [members,     setMembers]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editEvent,   setEditEvent]   = useState(null)
  const [detailEvent, setDetailEvent] = useState(null)
  const [deleteEvent, setDeleteEvent] = useState(null)
  const [viewYear,    setViewYear]    = useState(today.getFullYear())
  const [viewMonth,   setViewMonth]   = useState(today.getMonth())
  const [viewMode,    setViewMode]    = useState('month') // 'month' | 'week'
  const [filterType,  setFilterType]  = useState('all')
  const [filterUser,  setFilterUser]  = useState('all')

  useEffect(() => { loadData() }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    const [eRes, mRes] = await Promise.all([
      supabase.from('events').select('*').order('start_date'),
      supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name')
    ])
    if (!eRes.error) setEvents(eRes.data || [])
    if (!mRes.error) setMembers(mRes.data || [])
    setLoading(false)
  }, [])

  async function handleSave(form) {
    if (!form.title.trim() || !form.start_date) {
      addToast('Ad və tarix daxil edin', 'error'); return
    }
    const data = {
      title:           form.title.trim(),
      event_type:      form.event_type,
      start_date:      form.start_date,
      end_date:        form.end_date || form.start_date,
      start_time:      form.start_time || null,
      end_time:        form.end_time   || null,
      notes:           form.notes      || null,
      tagged_profiles: form.tagged_profiles || [],
    }

    if (editEvent) {
      const { error } = await supabase.from('events').update(data).eq('id', editEvent.id)
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      addToast('Hadisə yeniləndi', 'success')
    } else {
      const { data: inserted, error } = await supabase.from('events').insert(data).select().single()
      if (error) { addToast('Xəta: ' + error.message, 'error'); return }
      // Bildirişlər
      for (const uid of (form.tagged_profiles || [])) {
        if (uid !== user?.id) {
          const timeStr = form.start_time ? ` saat ${form.start_time}` : ''
          await notify(
            uid,
            `${typeOf(form.event_type).emoji} ${form.title}`,
            `${fmtDate(form.start_date)}${timeStr} — ${typeOf(form.event_type).label === 'Görüş' || typeOf(form.event_type).label === 'Tədbir' ? 'Təsdiq tələb olunur' : 'Hadisəyə əlavə oldunuz'}`,
            'info', '/hadiseler'
          )
        }
      }
      addToast('Hadisə əlavə edildi', 'success')
    }
    setModalOpen(false)
    setEditEvent(null)
    await loadData()
  }

  async function handleDelete() {
    const { error } = await supabase.from('events').delete().eq('id', deleteEvent.id)
    if (error) { addToast('Xəta: ' + error.message, 'error'); return }
    addToast('Silindi', 'success')
    setDeleteEvent(null)
    setDetailEvent(null)
    await loadData()
  }

  async function handleRSVP(event, status) {
    // rsvp: { userId: 'accepted'|'declined' }
    const current = event.rsvp || {}
    const updated = { ...current, [user.id]: status }
    const { error } = await supabase.from('events').update({ rsvp: updated }).eq('id', event.id)
    if (error) { addToast('Xəta: ' + error.message, 'error'); return }
    const label = status === 'accepted' ? 'Qəbul etdiniz' : 'Rədd etdiniz'
    addToast(label, status === 'accepted' ? 'success' : 'error')
    // Event yaradanı xəbərdar et
    await loadData()
    // Detail-i yenilə
    const refreshed = (await supabase.from('events').select('*').eq('id', event.id).single()).data
    if (refreshed) setDetailEvent(refreshed)
  }

  // Filter
  const filtered = events.filter(e => {
    if (filterType !== 'all' && e.event_type !== filterType) return false
    if (filterUser === 'mine') return (e.tagged_profiles || []).includes(user?.id)
    if (filterUser !== 'all') return (e.tagged_profiles || []).includes(filterUser)
    return true
  })

  // Month grid
  const firstDay   = new Date(viewYear, viewMonth, 1)
  const startDow   = (firstDay.getDay() + 6) % 7
  const daysInMon  = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells      = [...Array(startDow).fill(null), ...Array.from({ length: daysInMon }, (_, i) => i + 1)]

  function eventsForDay(day) {
    if (!day) return []
    const ds = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return filtered.filter(e => e.start_date <= ds && (e.end_date || e.start_date) >= ds)
  }

  const prevPeriod = () => {
    if (viewMode === 'month') {
      viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1)
    } else {
      setViewMonth(m => { const d = new Date(viewYear, m, 1); d.setDate(d.getDate() - 7); setViewYear(d.getFullYear()); return d.getMonth() })
    }
  }
  const nextPeriod = () => {
    if (viewMode === 'month') {
      viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1)
    } else {
      setViewMonth(m => { const d = new Date(viewYear, m, 1); d.setDate(d.getDate() + 7); setViewYear(d.getFullYear()); return d.getMonth() })
    }
  }

  // Upcoming events
  const upcoming = filtered
    .filter(e => new Date(e.start_date) >= new Date(today.toDateString()))
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 8)

  // My pending RSVP events
  const myPendingRSVP = events.filter(e =>
    needsRSVP(e.event_type) &&
    (e.tagged_profiles || []).includes(user?.id) &&
    !(e.rsvp || {})[user?.id]
  )

  if (loading) return <div className="p-6"><Skeleton className="h-96" /></div>

  return (
    <div className="p-4 lg:p-6 fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-bold text-[#0f172a]">Hadisələr Təqvimi</h1>
          <p className="text-xs text-[#888] mt-0.5">
            {filtered.length} hadisə
            {myPendingRSVP.length > 0 && (
              <span className="ml-2 text-amber-600 font-semibold">· {myPendingRSVP.length} cavab gözləyir</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode */}
          <div className="flex border border-[#e8e8e4] rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('month')}
              className={`px-2.5 py-1.5 text-xs transition-colors ${viewMode === 'month' ? 'bg-[#0f172a] text-white' : 'text-[#555] hover:bg-[#f5f5f0]'}`}>
              <IconLayoutGrid size={14} />
            </button>
            <button onClick={() => setViewMode('week')}
              className={`px-2.5 py-1.5 text-xs transition-colors ${viewMode === 'week' ? 'bg-[#0f172a] text-white' : 'text-[#555] hover:bg-[#f5f5f0]'}`}>
              <IconLayoutList size={14} />
            </button>
          </div>
          <Button onClick={() => { setEditEvent(null); setModalOpen(true) }} size="sm">
            <IconPlus size={14} /> Yeni hadisə
          </Button>
        </div>
      </div>

      {/* ── RSVP xəbərdarlığı ── */}
      {myPendingRSVP.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-3">
          <span className="text-amber-500 text-lg">📬</span>
          <div className="flex-1">
            <div className="text-xs font-semibold text-amber-800">Cavab gözləyən dəvətlər</div>
            <div className="text-[10px] text-amber-700 mt-0.5">
              {myPendingRSVP.map(e => e.title).join(', ')}
            </div>
          </div>
          <button onClick={() => setDetailEvent(myPendingRSVP[0])}
            className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 border border-amber-300 rounded-lg px-2.5 py-1 transition-colors">
            Cavabla
          </button>
        </div>
      )}

      {/* ── Filterlər ── */}
      <div className="flex flex-wrap gap-2 mb-5 p-3 bg-[#f8f8f5] rounded-xl border border-[#eeeeea]">
        <div className="flex gap-1 flex-wrap items-center">
          <button onClick={() => setFilterType('all')}
            className={`text-[11px] px-3 py-1.5 rounded-full border font-medium transition-all ${
              filterType === 'all' ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'bg-white text-[#555] border-[#e8e8e4]'
            }`}>Hamısı</button>
          {EVENT_TYPES.map(tp => (
            <button key={tp.key} onClick={() => setFilterType(filterType === tp.key ? 'all' : tp.key)}
              className="text-[11px] px-3 py-1.5 rounded-full border font-medium transition-all"
              style={filterType === tp.key
                ? { background: tp.dot, color: 'white', borderColor: tp.dot }
                : { background: 'white', color: '#555', borderColor: '#e8e8e4' }}>
              {tp.emoji} {tp.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto flex-wrap items-center">
          {[{ id: 'all', label: 'Hamı' }, { id: 'mine', label: 'Mənim' },
            ...members.filter(m => m.id !== user?.id).map(m => ({ id: m.id, label: m.full_name.split(' ')[0] + ' ' + (m.full_name.split(' ')[1]?.[0] || '') + '.' }))
          ].map(opt => (
            <button key={opt.id} onClick={() => setFilterUser(opt.id)}
              className={`text-[11px] px-3 py-1.5 rounded-full border font-medium transition-all ${
                filterUser === opt.id ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'bg-white text-[#555] border-[#e8e8e4] hover:border-[#0f172a]'
              }`}>
              {opt.id === 'all' ? '👥 ' : opt.id === 'mine' ? '🙋 ' : ''}{opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Nav ── */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevPeriod} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e8e8e4] hover:bg-[#f5f5f0] transition-colors">
          <IconChevronLeft size={15} className="text-[#555]" />
        </button>
        <div className="text-center">
          <div className="text-sm font-bold text-[#0f172a]">{MONTHS[viewMonth]} {viewYear}</div>
          {viewMode === 'week' && <div className="text-[10px] text-[#aaa]">Həftəlik görünüş</div>}
        </div>
        <button onClick={nextPeriod} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e8e8e4] hover:bg-[#f5f5f0] transition-colors">
          <IconChevronRight size={15} className="text-[#555]" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Təqvim (sol 2/3) ── */}
        <div className="lg:col-span-2">
          {viewMode === 'week' ? (
            <WeeklyView
              events={filtered}
              members={members}
              viewYear={viewYear}
              viewMonth={viewMonth}
              viewDay={today.getDate()}
              onEventClick={e => setDetailEvent(e)}
            />
          ) : (
            <div className="bg-white border border-[#e8e8e4] rounded-2xl overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-[#f0f0ec] bg-[#fafafa]">
                {DAYS_SHORT.map((d, i) => (
                  <div key={d} className={`py-2.5 text-center text-[10px] font-bold uppercase tracking-wider ${
                    i >= 5 ? 'text-[#ddd]' : 'text-[#bbb]'
                  }`}>{d}</div>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                  const dayEvs = eventsForDay(day)
                  const isToday = day && viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate()
                  const isWeekend = i % 7 >= 5
                  const hasPendingRSVP = dayEvs.some(e =>
                    needsRSVP(e.event_type) &&
                    (e.tagged_profiles || []).includes(user?.id) &&
                    !(e.rsvp || {})[user?.id]
                  )

                  return (
                    <div key={i}
                      className={`min-h-[88px] p-1.5 border-b border-r border-[#f5f5f0] last:border-r-0 transition-colors ${
                        day ? 'hover:bg-[#fafaf8]' : ''
                      } ${isWeekend && day ? 'bg-[#fafafa]' : ''}`}
                      onClick={() => day && (setEditEvent(null), setModalOpen(true))}
                    >
                      {day && (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <div className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold ${
                              isToday ? 'bg-[#0f172a] text-white' : isWeekend ? 'text-[#ccc]' : 'text-[#0f172a]'
                            }`}>{day}</div>
                            {hasPendingRSVP && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Cavab gözləyir" />}
                          </div>
                          {dayEvs.slice(0, 3).map(e => (
                            <EventPill key={e.id} event={e} onClick={ev => { ev.stopPropagation(); setDetailEvent(e) }} />
                          ))}
                          {dayEvs.length > 3 && (
                            <div className="text-[8px] text-[#aaa] px-1 cursor-pointer">+{dayEvs.length - 3} daha</div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Sağ panel ── */}
        <div className="space-y-4">

          {/* Növlər legend */}
          <div className="bg-white border border-[#e8e8e4] rounded-2xl p-4">
            <div className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-3">Növlər</div>
            <div className="space-y-1.5">
              {EVENT_TYPES.map(tp => (
                <button key={tp.key} onClick={() => setFilterType(filterType === tp.key ? 'all' : tp.key)}
                  className="flex items-center gap-2 w-full hover:opacity-70 transition-opacity">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: tp.dot }} />
                  <span className="text-[11px] text-[#555]">{tp.emoji} {tp.label}</span>
                  <span className="ml-auto text-[10px] text-[#ccc]">
                    {events.filter(e => e.event_type === tp.key).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Yaxınlaşan hadisələr */}
          <div className="bg-white border border-[#e8e8e4] rounded-2xl p-4">
            <div className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-3">Yaxınlaşan hadisələr</div>
            {upcoming.length === 0 ? (
              <div className="text-[11px] text-[#bbb] py-4 text-center">Yaxın hadisə yoxdur</div>
            ) : (
              <div className="space-y-2">
                {upcoming.map(e => {
                  const tp = typeOf(e.event_type)
                  const dl = daysLeft(e.start_date)
                  const tagged = (e.tagged_profiles || [])
                    .map(id => members.find(m => m.id === id)?.full_name?.split(' ')[0])
                    .filter(Boolean)
                  const myRSVP = (e.rsvp || {})[user?.id]
                  const pendingMe = needsRSVP(e.event_type) && (e.tagged_profiles || []).includes(user?.id) && !myRSVP

                  return (
                    <div key={e.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer group transition-all hover:shadow-sm ${
                        pendingMe ? 'border-amber-200 bg-amber-50/50' : 'border-[#f0f0ec] hover:border-[#e8e8e4]'
                      }`}
                      onClick={() => setDetailEvent(e)}>
                      <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-base" style={{ background: tp.bg }}>
                        {tp.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-[#0f172a] truncate">{e.title}</div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-[#aaa]">{fmtDate(e.start_date)}</span>
                          {e.start_time && <span className="text-[10px] text-[#bbb]">· {e.start_time}</span>}
                          <span className="text-[10px] font-semibold" style={{ color: tp.dot }}>
                            {dl === 0 ? 'Bu gün' : dl === 1 ? 'Sabah' : `${dl}g`}
                          </span>
                        </div>
                        {tagged.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {tagged.slice(0, 3).map(name => (
                              <span key={name} className="text-[9px] bg-[#f5f5f0] text-[#777] px-1.5 py-0.5 rounded-full">
                                {name}
                              </span>
                            ))}
                            {tagged.length > 3 && <span className="text-[9px] text-[#bbb]">+{tagged.length - 3}</span>}
                          </div>
                        )}
                        {pendingMe && (
                          <div className="text-[9px] text-amber-600 font-semibold mt-1">⏳ Cavab gözləyir</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EventForm
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditEvent(null) }}
        onSave={handleSave}
        event={editEvent}
        members={members}
      />

      {detailEvent && (
        <EventDetail
          event={detailEvent}
          members={members}
          user={user}
          onClose={() => setDetailEvent(null)}
          onEdit={e => { setDetailEvent(null); setEditEvent(e); setModalOpen(true) }}
          onDelete={e => { setDetailEvent(null); setDeleteEvent(e) }}
          onRSVP={handleRSVP}
        />
      )}

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
