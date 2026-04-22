import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { PageHeader, Badge, Card, Button, EmptyState, Modal, ConfirmDialog, Skeleton } from '../components/ui'
import { IconPlus, IconEdit, IconTrash, IconCalendar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'

const EVENT_TYPES = [
  { key: 'meeting', label: 'Görüş', color: 'info' },
  { key: 'deadline', label: 'Deadline', color: 'danger' },
  { key: 'holiday', label: 'Bayram/Tətil', color: 'success' },
  { key: 'other', label: 'Digər', color: 'default' },
]

const MONTH_NAMES = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr']
const DAY_NAMES = ['B.e', 'Ç.a', 'Çər', 'C.a', 'Cüm', 'Şən', 'Baz']

function EventForm({ open, onClose, onSave, event }) {
  const [form, setForm] = useState({ title: '', event_type: 'meeting', start_date: '', end_date: '', notes: '' })

  useEffect(() => {
    if (event) setForm({ title: event.title || '', event_type: event.event_type || 'meeting', start_date: event.start_date || '', end_date: event.end_date || '', notes: event.notes || '' })
    else setForm({ title: '', event_type: 'meeting', start_date: new Date().toISOString().split('T')[0], end_date: '', notes: '' })
  }, [event, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <Modal open={open} onClose={onClose} title={event ? 'Hadisəni redaktə et' : 'Yeni hadisə'}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Hadisə adı *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]"
            placeholder="Hadisənin adı" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Növ</label>
            <select value={form.event_type} onChange={e => set('event_type', e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a]">
              {EVENT_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <div />
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
            className="w-full px-3 py-2 border border-[#e8e8e4] rounded-lg text-sm focus:outline-none focus:border-[#0f172a] resize-none" />
        </div>
        <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={() => onSave(form)} className="ml-auto">{event ? 'Yadda saxla' : 'Əlavə et'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function HadiselerTeqvimiPage() {
  const { addToast } = useToast()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [deleteEvent, setDeleteEvent] = useState(null)
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('events').select('*').order('start_date', { ascending: true })
    setEvents(data || [])
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
      color: form.color || null
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

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1)
  const lastDay = new Date(viewYear, viewMonth + 1, 0)
  const startDayOfWeek = (firstDay.getDay() + 6) % 7 // Monday = 0
  const daysInMonth = lastDay.getDate()

  const cells = []
  for (let i = 0; i < startDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const getEventsForDay = (day) => {
    if (!day) return []
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.start_date === dateStr || e.end_date === dateStr)
  }

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) } else setViewMonth(m => m - 1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) } else setViewMonth(m => m + 1) }

  const upcomingEvents = events
    .filter(e => new Date(e.start_date) >= today)
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 5)

  return (
    <div className="p-4 lg:p-6 fade-in">
      <PageHeader
        title="Hadisələr Təqvimi"
        subtitle={`${events.length} hadisə`}
        action={<Button onClick={() => { setEditEvent(null); setModalOpen(true) }} size="sm"><IconPlus size={14} /> Yeni hadisə</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            {/* Calendar header */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1 hover:bg-[#f5f5f0] rounded-lg transition-colors">
                <IconChevronLeft size={16} className="text-[#555]" />
              </button>
              <div className="text-sm font-bold text-[#0f172a]">{MONTH_NAMES[viewMonth]} {viewYear}</div>
              <button onClick={nextMonth} className="p-1 hover:bg-[#f5f5f0] rounded-lg transition-colors">
                <IconChevronRight size={16} className="text-[#555]" />
              </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_NAMES.map(d => (
                <div key={d} className="text-center text-[10px] font-medium text-[#aaa] py-1">{d}</div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, i) => {
                const dayEvents = getEventsForDay(day)
                const isToday = day && viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate()
                return (
                  <div key={i} className={`min-h-14 p-1 rounded-lg border transition-colors ${day ? 'border-[#f0f0ec] hover:border-[#e8e8e4] cursor-pointer' : 'border-transparent'} ${isToday ? 'bg-[#0f172a] border-[#0f172a]' : ''}`}
                    onClick={() => { if (day) { setEditEvent(null); setModalOpen(true) } }}>
                    {day && (
                      <>
                        <div className={`text-xs font-medium mb-1 ${isToday ? 'text-white' : 'text-[#0f172a]'}`}>{day}</div>
                        {dayEvents.slice(0, 2).map(e => {
                          const type = EVENT_TYPES.find(t => t.key === e.event_type)
                          return (
                            <div key={e.id}
                              className={`text-[9px] px-1 py-0.5 rounded truncate mb-0.5 cursor-pointer ${
                                e.event_type === 'deadline' ? 'bg-red-100 text-red-700' :
                                e.event_type === 'meeting' ? 'bg-blue-100 text-blue-700' :
                                e.event_type === 'holiday' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-700'
                              }`}
                              onClick={ev => { ev.stopPropagation(); setEditEvent(e); setModalOpen(true) }}
                            >
                              {e.title}
                            </div>
                          )
                        })}
                        {dayEvents.length > 2 && <div className="text-[9px] text-[#aaa]">+{dayEvents.length - 2}</div>}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Upcoming events */}
        <div>
          <div className="text-xs font-bold text-[#0f172a] mb-3">Yaxınlaşan hadisələr</div>
          {upcomingEvents.length === 0 ? (
            <div className="text-xs text-[#aaa] text-center py-8">Yaxınlaşan hadisə yoxdur</div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map(e => {
                const type = EVENT_TYPES.find(t => t.key === e.event_type)
                const days = Math.floor((new Date(e.start_date) - today) / 86400000)
                return (
                  <Card key={e.id} className="p-3 hover:border-[#0f172a] transition-colors cursor-pointer group"
                    onClick={() => { setEditEvent(e); setModalOpen(true) }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-[#0f172a] truncate">{e.title}</div>
                        <div className="text-[10px] text-[#aaa] mt-0.5">
                          {new Date(e.start_date).toLocaleDateString('az-AZ')}
                          {days === 0 ? ' · Bu gün' : days === 1 ? ' · Sabah' : ` · ${days} gün qalıb`}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Badge variant={type?.color} size="sm">{type?.label}</Badge>
                        <button onClick={ev => { ev.stopPropagation(); setDeleteEvent(e) }} className="opacity-0 group-hover:opacity-100 text-[#aaa] hover:text-red-500 p-0.5 transition-opacity">
                          <IconTrash size={11} />
                        </button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {events.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-bold text-[#0f172a] mb-3">Bütün hadisələr</div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {[...events].sort((a, b) => new Date(b.start_date) - new Date(a.start_date)).map(e => {
                  const type = EVENT_TYPES.find(t => t.key === e.event_type)
                  return (
                    <div key={e.id} className="flex items-center gap-2 py-1.5 px-2 hover:bg-[#f5f5f0] rounded-lg cursor-pointer group"
                      onClick={() => { setEditEvent(e); setModalOpen(true) }}>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-[#0f172a] truncate">{e.title}</span>
                        <span className="text-[10px] text-[#aaa] ml-2">{new Date(e.start_date).toLocaleDateString('az-AZ')}</span>
                      </div>
                      <Badge variant={type?.color} size="sm">{type?.label}</Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <EventForm open={modalOpen} onClose={() => { setModalOpen(false); setEditEvent(null) }} onSave={handleSave} event={editEvent} />
      <ConfirmDialog open={!!deleteEvent} title="Hadisəni sil" message={`"${deleteEvent?.title}" silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete} onCancel={() => setDeleteEvent(null)} danger />
    </div>
  )
}
