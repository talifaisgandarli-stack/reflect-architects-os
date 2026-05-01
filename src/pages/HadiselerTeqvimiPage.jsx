import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { notify } from '../lib/notify'
import { Button, ConfirmDialog, Skeleton } from '../components/ui'
import {
  IconPlus, IconEdit, IconTrash, IconChevronLeft, IconChevronRight,
  IconClock, IconCalendar, IconCheck, IconX, IconUsers, IconUser,
  IconGridDots, IconColumns
} from '@tabler/icons-react'

// ─── Constants ────────────────────────────────────────────────────────────────
const TYPES = [
  { key: 'meeting',  label: 'Görüş',       emoji: '🤝', bg: '#EEF2FF', text: '#4338CA', dot: '#6366F1' },
  { key: 'event',    label: 'Tədbir',       emoji: '✨', bg: '#FDF4FF', text: '#7E22CE', dot: '#A855F7' },
  { key: 'deadline', label: 'Deadline',     emoji: '🎯', bg: '#FFF1F2', text: '#BE123C', dot: '#F43F5E' },
  { key: 'holiday',  label: 'Bayram',       emoji: '🎉', bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  { key: 'birthday', label: 'Ad günü',      emoji: '🎂', bg: '#FFFBEB', text: '#B45309', dot: '#F59E0B' },
  { key: 'other',    label: 'Digər',        emoji: '📌', bg: '#F8FAFC', text: '#64748B', dot: '#94A3B8' },
]
const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','İyun','İyul','Avqust','Sentyabr','Oktyabr','Noyabr','Dekabr']
const WEEKDAYS = ['B.e','Ç.a','Çər','C.a','Cüm','Şnb','Bzr']

const tp = key => TYPES.find(t => t.key === key) || TYPES[5]
const needsRSVP = type => ['meeting','event'].includes(type)
const todayStr = () => new Date().toISOString().split('T')[0]
const fmtDate = d => new Date(d + 'T00:00:00').toLocaleDateString('az-AZ', { day:'numeric', month:'long' })
const daysUntil = d => {
  const t = new Date(); t.setHours(0,0,0,0)
  const dd = new Date(d + 'T00:00:00')
  return Math.floor((dd - t) / 86400000)
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Av({ name='?', size=6, className='' }) {
  const ini = name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
  const sz = { 5:'w-5 h-5 text-[8px]', 6:'w-6 h-6 text-[9px]', 7:'w-7 h-7 text-[10px]', 8:'w-8 h-8 text-[11px]' }[size] || 'w-6 h-6 text-[9px]'
  return (
    <div className={`${sz} rounded-full bg-[#0f172a] flex items-center justify-center font-bold text-white flex-shrink-0 ${className}`}>
      {ini}
    </div>
  )
}

// ─── Quick Add Drawer (Google Calendar tərzi) ─────────────────────────────────
function QuickAdd({ date, time, members, onSave, onExpand, onClose, isAdmin }) {
  const [title, setTitle] = useState('')
  const [selType, setSelType] = useState('meeting')
  const [startTime, setStartTime] = useState(time || '')
  const [endTime, setEndTime] = useState('')
  const [tagged, setTagged] = useState([])
  const [memberSearch, setMemberSearch] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function toggleMember(id) {
    setTagged(t => t.includes(id) ? t.filter(x=>x!==id) : [...t, id])
  }

  async function save() {
    if (!title.trim()) return
    await onSave({
      title: title.trim(), event_type: selType,
      start_date: date, end_date: date,
      start_time: startTime, end_time: endTime,
      notes: '', tagged_profiles: tagged, is_private: isPrivate
    })
  }

  const t = tp(selType)

  return (
    <div className="absolute z-30 bg-white rounded-2xl shadow-2xl border border-[#e8e8e4] w-72"
      style={{ top: 4, left: '50%', transform: 'translateX(-50%)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      onClick={e => e.stopPropagation()}>

      {/* Rəng üstü */}
      <div className="h-1 rounded-t-2xl" style={{ background: t.dot }} />

      <div className="p-4 space-y-3">
        {/* Başlıq */}
        <input ref={inputRef} value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if(e.key==='Enter') save(); if(e.key==='Escape') onClose() }}
          placeholder="Hadisəni əlavə et..."
          className="w-full text-sm font-semibold text-[#0f172a] placeholder-[#bbb] outline-none border-b border-[#f0f0ec] pb-2" />

        {/* Tarix + saat */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-[#888]">
            <IconCalendar size={12} />
            <span className="font-medium text-[#555]">{fmtDate(date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <IconClock size={12} className="text-[#bbb]" />
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
              className="outline-none text-sm text-[#0f172a] font-medium border-b border-[#e8e8e4] focus:border-[#0f172a] bg-transparent" />
            <span className="text-[#bbb] text-xs">–</span>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
              className="outline-none text-sm text-[#555] border-b border-[#e8e8e4] focus:border-[#0f172a] bg-transparent" />
          </div>
        </div>

        {/* Növ pills */}
        <div className="flex flex-wrap gap-1">
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setSelType(t.key)}
              className="text-[10px] px-2 py-1 rounded-full font-medium transition-all"
              style={selType === t.key
                ? { background: t.dot, color: 'white' }
                : { background: t.bg, color: t.text }}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* İştirakçılar — mini search */}
        {members.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 border border-[#e8e8e4] rounded-lg bg-[#fafafa]">
                <IconUser size={10} className="text-[#bbb] flex-shrink-0" />
                <input
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  placeholder="Ad axtar..."
                  className="flex-1 text-[11px] outline-none bg-transparent placeholder-[#ccc] text-[#0f172a]"
                />
                {memberSearch && (
                  <button onClick={() => setMemberSearch('')} className="text-[#bbb] hover:text-[#555]">
                    <IconX size={9} />
                  </button>
                )}
              </div>
              <button onClick={() => { setTagged(tagged.length===members.length ? [] : members.map(m=>m.id)); setMemberSearch('') }}
                className={`flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-lg font-semibold border flex-shrink-0 transition-all ${
                  tagged.length===members.length ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'border-[#e8e8e4] text-[#555] hover:border-[#0f172a]'
                }`}>
                <IconUsers size={9}/> Hamı
              </button>
            </div>
            {/* Seçilənlər + axtarış nəticəsi */}
            <div className="flex flex-wrap gap-1">
              {/* Tag olunmuş amma searchdə görünməyənlər */}
              {tagged.filter(id => {
                const m = members.find(m=>m.id===id)
                return m && !m.full_name.toLowerCase().includes(memberSearch.toLowerCase())
              }).map(id => {
                const m = members.find(m=>m.id===id)
                return m ? (
                  <button key={id} onClick={() => toggleMember(id)}
                    className="text-[10px] px-2 py-1 rounded-full font-medium bg-[#0f172a] text-white border border-[#0f172a] flex items-center gap-1">
                    {m.full_name.split(' ')[0]} <IconX size={8}/>
                  </button>
                ) : null
              })}
              {/* Axtarış nəticəsi */}
              {members
                .filter(m => m.full_name.toLowerCase().includes(memberSearch.toLowerCase()))
                .slice(0, memberSearch ? 8 : 5)
                .map(m => (
                <button key={m.id} onClick={() => toggleMember(m.id)}
                  className={`text-[10px] px-2 py-1 rounded-full font-medium border transition-all ${
                    tagged.includes(m.id) ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'border-[#e8e8e4] text-[#555] hover:border-[#0f172a]'
                  }`}>
                {m.full_name.split(' ')[0]}
              </button>
              ))}
            </div>
            {tagged.length > 0 && (
              <p className="text-[9px] text-[#888]">{tagged.length} nəfər seçildi</p>
            )}
          </div>
        )}

        {/* Gizli — yalnız admin */}
        {isAdmin && (
          <button type="button" onClick={() => setIsPrivate(v => !v)}
            className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border w-full transition-all ${
              isPrivate ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'border-[#e8e8e4] text-[#555] hover:border-[#0f172a]'
            }`}>
            {isPrivate ? '🔒 Gizli hadisə — yalnız adminlər görür' : '🔓 Hamıya açıq hadisə'}
          </button>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-[#f5f5f0]">
          <button onClick={onExpand}
            className="text-[10px] text-blue-500 hover:text-blue-700 font-medium transition-colors">
            Ətraflı redaktə →
          </button>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="text-[10px] text-[#888] hover:text-[#555] px-3 py-1.5 rounded-lg transition-colors">
              Ləğv et
            </button>
            <button onClick={save} disabled={!title.trim()}
              className="text-[10px] font-semibold px-3 py-1.5 rounded-lg text-white transition-all disabled:opacity-30"
              style={{ background: tp(selType).dot }}>
              Saxla
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Full Event Form Modal ────────────────────────────────────────────────────
function EventModal({ open, onClose, onSave, event, members, defaultDate, defaultType, isAdmin }) {
  const blank = {
    title:'', event_type: defaultType||'meeting',
    start_date: defaultDate || todayStr(), end_date:'',
    start_time:'', end_time:'', notes:'', tagged_profiles:[], is_private: false
  }
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(event ? {
      title: event.title||'', event_type: event.event_type||'meeting',
      start_date: event.start_date||todayStr(), end_date: event.end_date||'',
      start_time: event.start_time||'', end_time: event.end_time||'',
      notes: event.notes||'', tagged_profiles: event.tagged_profiles||[], is_private: event.is_private||false
    } : blank)
  }, [open, event])

  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const toggleM = id => set('tagged_profiles',
    form.tagged_profiles.includes(id)
      ? form.tagged_profiles.filter(x=>x!==id)
      : [...form.tagged_profiles, id]
  )
  const toggleAll = () => set('tagged_profiles',
    form.tagged_profiles.length===members.length ? [] : members.map(m=>m.id)
  )

  async function submit() {
    if (!form.title.trim() || !form.start_date) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  if (!open) return null
  const t = tp(form.event_type)
  const allSel = form.tagged_profiles.length === members.length && members.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e=>e.stopPropagation()}>

        {/* Rəngli header bar */}
        <div className="h-1.5 rounded-t-2xl" style={{ background: t.dot }} />

        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0f172a]">{event ? 'Hadisəni redaktə et' : 'Yeni hadisə'}</h2>
            <button onClick={onClose} className="text-[#bbb] hover:text-[#555] w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f5f0] transition-all">
              <IconX size={15} />
            </button>
          </div>

          {/* Növ */}
          <div className="grid grid-cols-3 gap-1.5">
            {TYPES.map(ty => (
              <button key={ty.key} onClick={() => set('event_type', ty.key)}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-semibold transition-all border"
                style={form.event_type===ty.key
                  ? { background: ty.bg, borderColor: ty.dot, color: ty.text, boxShadow: `inset 0 0 0 1px ${ty.dot}` }
                  : { background:'#fafafa', borderColor:'#ebebeb', color:'#888' }}>
                {ty.emoji} {ty.label}
              </button>
            ))}
          </div>

          {/* Başlıq */}
          <input value={form.title} onChange={e=>set('title',e.target.value)} autoFocus
            className="w-full px-3.5 py-2.5 border border-[#e8e8e4] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/10 placeholder-[#ccc]"
            placeholder="Hadisənin adı..." />

          {/* Tarix + saat — 2x2 grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1.5">Başlama tarixi *</label>
              <input type="date" value={form.start_date} onChange={e=>set('start_date',e.target.value)}
                className="w-full px-3 py-2 border border-[#e8e8e4] rounded-xl text-sm focus:outline-none focus:border-[#0f172a]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1.5">Bitmə tarixi</label>
              <input type="date" value={form.end_date} onChange={e=>set('end_date',e.target.value)}
                min={form.start_date}
                className="w-full px-3 py-2 border border-[#e8e8e4] rounded-xl text-sm focus:outline-none focus:border-[#0f172a]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1.5">⏰ Başlama saatı</label>
              <input type="time" value={form.start_time} onChange={e=>set('start_time',e.target.value)}
                className="w-full px-3 py-2 border border-[#e8e8e4] rounded-xl text-sm focus:outline-none focus:border-[#0f172a]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-1.5">⏰ Bitmə saatı</label>
              <input type="time" value={form.end_time} onChange={e=>set('end_time',e.target.value)}
                className="w-full px-3 py-2 border border-[#e8e8e4] rounded-xl text-sm focus:outline-none focus:border-[#0f172a]" />
            </div>
          </div>

          {/* Qeyd */}
          <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={2}
            className="w-full px-3.5 py-2.5 border border-[#e8e8e4] rounded-xl text-sm focus:outline-none focus:border-[#0f172a] resize-none placeholder-[#ccc]"
            placeholder="Qeyd..." />

          {/* Gizli hadisə — yalnız admin */}
          {isAdmin && (
            <div className="flex items-center justify-between p-3 bg-[#fafafa] border border-[#ebebeb] rounded-xl">
              <div>
                <div className="text-xs font-semibold text-[#0f172a]">Gizli hadisə</div>
                <div className="text-[10px] text-[#888] mt-0.5">Yalnız Nicat, Talifa, Türkan görür</div>
              </div>
              <button type="button" onClick={() => set('is_private', !form.is_private)}
                className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${form.is_private ? 'bg-[#0f172a]' : 'bg-[#e2e8f0]'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_private ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          )}

          {/* İştirakçılar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider">İştirakçılar</label>
              <button onClick={toggleAll}
                className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all border ${
                  allSel ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'border-[#e8e8e4] text-[#555] hover:border-[#0f172a]'
                }`}>
                <IconUsers size={10}/> Bütün komanda
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 p-3 bg-[#f8fafc] border border-[#ebebeb] rounded-xl max-h-28 overflow-y-auto">
              {members.map(m => {
                const sel = form.tagged_profiles.includes(m.id)
                return (
                  <button key={m.id} onClick={()=>toggleM(m.id)}
                    className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-full border font-medium transition-all ${
                      sel ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'bg-white border-[#e0e0e0] text-[#555] hover:border-[#0f172a]'
                    }`}>
                    <Av name={m.full_name} size={5} />
                    {m.full_name.split(' ')[0]}
                  </button>
                )
              })}
            </div>
            {form.tagged_profiles.length > 0 && needsRSVP(form.event_type) && (
              <p className="text-[10px] text-blue-500 mt-1.5 font-medium">
                ✓ {form.tagged_profiles.length} nəfərə RSVP dəvəti göndəriləcək
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t border-[#f0f0ec]">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#e8e8e4] text-sm font-medium text-[#555] hover:bg-[#f5f5f0] transition-colors">
              Ləğv et
            </button>
            <button onClick={submit} disabled={saving||!form.title.trim()||!form.start_date}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-30"
              style={{ background: t.dot }}>
              {saving ? 'Saxlanılır...' : event ? 'Yadda saxla' : 'Əlavə et'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Event Detail Sheet ───────────────────────────────────────────────────────
function EventSheet({ event, members, user, onClose, onEdit, onDelete, onRSVP }) {
  if (!event) return null
  const t = tp(event.event_type)
  const dl = daysUntil(event.start_date)
  const tagged = (event.tagged_profiles||[]).map(id=>members.find(m=>m.id===id)).filter(Boolean)
  const rsvp = event.rsvp || {}
  const myRSVP = rsvp[user?.id]
  const isTagged = (event.tagged_profiles||[]).includes(user?.id)
  const showRSVP = needsRSVP(event.event_type) && isTagged
  const accepted = Object.values(rsvp).filter(v=>v==='accepted').length
  const declined = Object.values(rsvp).filter(v=>v==='declined').length

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl flex flex-col"
        style={{ borderLeft: '1px solid #e8e8e4' }}
        onClick={e=>e.stopPropagation()}>

        {/* Header rəngli */}
        <div className="px-5 pt-6 pb-5" style={{ background: `linear-gradient(135deg, ${t.bg} 0%, white 100%)` }}>
          <div className="flex items-start justify-between mb-3">
            <div className="text-3xl">{t.emoji}</div>
            <div className="flex gap-1">
              <button onClick={()=>onEdit(event)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#aaa] hover:text-[#0f172a] hover:bg-white/80 transition-all">
                <IconEdit size={14}/>
              </button>
              <button onClick={()=>onDelete(event)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#aaa] hover:text-red-500 hover:bg-red-50 transition-all">
                <IconTrash size={14}/>
              </button>
              <button onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#aaa] hover:text-[#555] hover:bg-white/80 transition-all">
                <IconX size={14}/>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{color:t.dot}}>{t.label}</div>
            {event.is_private && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#0f172a]/10 text-[#0f172a]">🔒 Gizli</span>}
          </div>
          <h2 className="text-lg font-bold text-[#0f172a] leading-snug">{event.title}</h2>

          {/* Tarix/saat */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-[11px] text-[#555] bg-white/70 px-2.5 py-1 rounded-full">
              <IconCalendar size={11} />
              <span className="font-medium">{fmtDate(event.start_date)}</span>
              {event.end_date && event.end_date !== event.start_date &&
                <span className="text-[#aaa]">– {fmtDate(event.end_date)}</span>}
            </div>
            {(event.start_time||event.end_time) && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#555] bg-white/70 px-2.5 py-1 rounded-full">
                <IconClock size={11}/>
                <span className="font-medium">
                  {event.start_time}{event.end_time ? ` – ${event.end_time}` : ''}
                </span>
              </div>
            )}
            <div className={`text-[10px] font-bold px-2 py-1 rounded-full ml-auto ${
              dl<0 ? 'bg-red-100 text-red-600' : dl===0 ? 'bg-amber-100 text-amber-700' : 'bg-white/70 text-[#555]'
            }`}>
              {dl<0 ? `${Math.abs(dl)}g keçib` : dl===0 ? 'Bu gün' : dl===1 ? 'Sabah' : `${dl} gün`}
            </div>
          </div>
        </div>

        {/* Məzmun */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {event.notes && (
            <div className="text-sm text-[#555] leading-relaxed p-3 bg-[#fafafa] rounded-xl border border-[#f0f0ec]">
              {event.notes}
            </div>
          )}

          {/* RSVP */}
          {showRSVP && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-3">Dəvətə cavabınız</div>
              <div className="flex gap-2">
                <button onClick={()=>onRSVP(event,'accepted')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold border-2 transition-all ${
                    myRSVP==='accepted' ? 'bg-green-500 text-white border-green-500' : 'border-green-200 text-green-700 hover:bg-green-50'
                  }`}>
                  <IconCheck size={14}/> Qəbul edirəm
                </button>
                <button onClick={()=>onRSVP(event,'declined')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold border-2 transition-all ${
                    myRSVP==='declined' ? 'bg-red-500 text-white border-red-500' : 'border-red-200 text-red-600 hover:bg-red-50'
                  }`}>
                  <IconX size={14}/> Rədd edirəm
                </button>
              </div>
            </div>
          )}

          {/* İştirakçılar */}
          {tagged.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-2.5">
                İştirakçılar · {accepted>0&&<span className="text-green-600">{accepted} ✓</span>} {declined>0&&<span className="text-red-500 ml-1">{declined} ✕</span>}
              </div>
              <div className="space-y-2">
                {tagged.map(m => {
                  const r = rsvp[m.id]
                  return (
                    <div key={m.id} className="flex items-center gap-2.5 p-2.5 rounded-xl border"
                      style={{
                        background: r==='accepted'?'#f0fdf4':r==='declined'?'#fef2f2':'#fafafa',
                        borderColor: r==='accepted'?'#bbf7d0':r==='declined'?'#fecaca':'#ebebeb'
                      }}>
                      <Av name={m.full_name} size={7}/>
                      <span className="text-xs font-semibold text-[#0f172a] flex-1">{m.full_name}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        r==='accepted'?'text-green-600 bg-green-100':r==='declined'?'text-red-500 bg-red-100':'text-[#aaa] bg-[#f0f0ec]'
                      }`}>
                        {r==='accepted'?'✓ Qəbul':r==='declined'?'✕ Rədd':'Gözlənilir'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Week View ────────────────────────────────────────────────────────────────
function WeekView({ events, members, weekStart, onEventClick, onDayClick }) {
  const days = Array.from({length:7},(_,i)=>{
    const d = new Date(weekStart); d.setDate(weekStart.getDate()+i); return d
  })
  const today = new Date(); today.setHours(0,0,0,0)

  return (
    <div className="bg-white border border-[#e8e8e4] rounded-2xl overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-[#f0f0ec] bg-[#fafafa]">
        {days.map((d,i) => {
          const isToday = d.getTime()===today.getTime()
          return (
            <div key={i} className={`p-3 text-center border-r border-[#f0f0ec] last:border-0 cursor-pointer hover:bg-[#f5f5f0] transition-colors ${isToday?'bg-[#0f172a]/[0.02]':''}`}
              onClick={()=>onDayClick(d.toISOString().split('T')[0])}>
              <div className="text-[10px] text-[#aaa] uppercase tracking-wider">{WEEKDAYS[i]}</div>
              <div className={`w-8 h-8 mx-auto mt-1 flex items-center justify-center rounded-full text-sm font-bold ${
                isToday ? 'bg-[#0f172a] text-white' : 'text-[#0f172a]'
              }`}>{d.getDate()}</div>
            </div>
          )
        })}
      </div>

      {/* Events */}
      <div className="grid grid-cols-7 min-h-[200px]">
        {days.map((d,i) => {
          const ds = d.toISOString().split('T')[0]
          const dayEvs = events.filter(e => e.start_date<=ds && (e.end_date||e.start_date)>=ds)
          const isToday = d.getTime()===today.getTime()
          return (
            <div key={i}
              className={`border-r border-[#f5f5f0] last:border-0 p-2 min-h-[160px] cursor-pointer hover:bg-[#fafaf8] transition-colors ${isToday?'bg-blue-50/20':''}`}
              onClick={()=>onDayClick(ds)}>
              {dayEvs.map(e => {
                const t = tp(e.event_type)
                return (
                  <div key={e.id}
                    className="mb-1 px-2 py-1.5 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ background: t.bg, borderLeft: `3px solid ${t.dot}` }}
                    onClick={ev=>{ev.stopPropagation(); onEventClick(e)}}>
                    <div className="text-[10px] font-semibold truncate" style={{color:t.text}}>{e.title}</div>
                    {e.start_time && <div className="text-[9px] opacity-70" style={{color:t.text}}>{e.start_time}</div>}
                  </div>
                )
              })}
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
  const { user, isAdmin } = useAuth()
  const now = new Date()

  const [events,      setEvents]      = useState([])
  const [members,     setMembers]     = useState([])
  const [loading,     setLoading]     = useState(true)

  // Modal states
  const [fullModal,   setFullModal]   = useState(false)
  const [editEvent,   setEditEvent]   = useState(null)
  const [sheet,       setSheet]       = useState(null) // detail sheet
  const [deleteEv,    setDeleteEv]    = useState(null)

  // Quick add
  const [quickDay,    setQuickDay]    = useState(null)
  const [quickTime,   setQuickTime]   = useState(null)

  // View
  const [viewMode,    setViewMode]    = useState('month')
  const [viewYear,    setViewYear]    = useState(now.getFullYear())
  const [viewMonth,   setViewMonth]   = useState(now.getMonth())
  const [filterType,  setFilterType]  = useState('all')
  const [filterUser,  setFilterUser]  = useState('all')

  const loadData = useCallback(async () => {
    const [eR, mR] = await Promise.all([
      supabase.from('events').select('*').order('start_date'),
      supabase.from('profiles').select('id,full_name').eq('is_active',true).order('full_name')
    ])
    if (!eR.error) setEvents(eR.data||[])
    if (!mR.error) setMembers(mR.data||[])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Save (insert or update)
  async function handleSave(form, existingId) {
    if (!form.title?.trim() || !form.start_date) {
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
      is_private:      form.is_private || false,
    }

    if (existingId) {
      // C10: Clean up RSVP entries for users who were untagged
      const prevEvent = events.find(e => e.id === existingId)
      if (prevEvent?.rsvp) {
        const newTagSet = new Set(data.tagged_profiles || [])
        const cleanedRsvp = Object.fromEntries(
          Object.entries(prevEvent.rsvp).filter(([uid]) => newTagSet.has(uid))
        )
        data.rsvp = cleanedRsvp
      }

      // Redaktə
      const { error } = await supabase.from('events').update(data).eq('id', existingId)
      if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin','error'); return }
      // Dəyişiklik bildirişi — bütün tag olunanları xəbərdar et
      for (const uid of (data.tagged_profiles||[])) {
        if (uid !== user?.id) {
          await notify(uid,
            `📝 "${data.title}" yeniləndi`,
            `${fmtDate(data.start_date)}${data.start_time?' · '+data.start_time:''} — hadisə məlumatları dəyişdi`,
            'info', '/hadiseler')
        }
      }
      addToast('Hadisə yeniləndi', 'success')
    } else {
      // Yeni
      const { error } = await supabase.from('events').insert(data)
      if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin','error'); return }
      // Dəvət bildirişi
      for (const uid of (data.tagged_profiles||[])) {
        if (uid !== user?.id) {
          const rsvpMsg = needsRSVP(data.event_type) ? ' — Cavabınız gözlənilir' : ' — hadisəyə əlavə oldunuz'
          await notify(uid,
            `${tp(data.event_type).emoji} ${data.title}`,
            fmtDate(data.start_date)+(data.start_time?', '+data.start_time:'')+rsvpMsg,
            'info', '/hadiseler')
        }
      }
      addToast('Hadisə əlavə edildi', 'success')
    }

    setFullModal(false)
    setEditEvent(null)
    setQuickDay(null)
    setSheet(null)
    await loadData()
  }

  async function handleDelete() {
    const { error } = await supabase.from('events').delete().eq('id', deleteEv.id)
    if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin','error'); return }
    addToast('Silindi', 'success')
    setDeleteEv(null)
    setSheet(null)
    await loadData()
  }

  async function handleRSVP(event, status) {
    const current = event.rsvp || {}
    const prev = current[user.id]
    if (prev === status) return // eyni cavab
    const updated = { ...current, [user.id]: status }
    const { error } = await supabase.from('events').update({ rsvp: updated }).eq('id', event.id)
    if (error) { addToast('Əməliyyat alınmadı, sonra yenidən cəhd edin','error'); return }

    addToast(status==='accepted'?'✓ Qəbul etdiniz':'✕ Rədd etdiniz', status==='accepted'?'success':'error')

    // Hadisəni yaradan şəxsə bildiriş göndər
    // events-dən created_by yoxdur, amma tag olunanlardan başqasına göndərək
    const meObj = members.find(m=>m.id===user.id)
    const meName = meObj?.full_name || 'Komanda üzvü'
    const msg = `${meName} "${event.title}" hadisəsini ${status==='accepted'?'✓ qəbul etdi':'✕ rədd etdi'}`
    // Digər tag olunanları xəbərdar et
    for (const uid of (event.tagged_profiles||[])) {
      if (uid !== user.id) {
        await notify(uid, msg, fmtDate(event.start_date), status==='accepted'?'success':'error', '/hadiseler')
      }
    }

    await loadData()
    const refreshed = events.find(e=>e.id===event.id)
    if (refreshed) setSheet({ ...refreshed, rsvp: updated })
  }

  // Filters
  const filtered = events.filter(e => {
    // Gizli hadisələri yalnız adminlər görür
    if (e.is_private && !isAdmin) return false
    if (filterType!=='all' && e.event_type!==filterType) return false
    if (filterUser==='mine') return (e.tagged_profiles||[]).includes(user?.id)
    if (filterUser!=='all') return (e.tagged_profiles||[]).includes(filterUser)
    return true
  })

  // Month grid
  const firstDow = (new Date(viewYear,viewMonth,1).getDay()+6)%7
  const daysInMon = new Date(viewYear,viewMonth+1,0).getDate()
  const cells = [...Array(firstDow).fill(null), ...Array.from({length:daysInMon},(_,i)=>i+1)]

  const dayStr = d => `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  const eventsForDay = d => {
    if (!d) return []
    const ds = dayStr(d)
    return filtered.filter(e => e.start_date<=ds && (e.end_date||e.start_date)>=ds)
  }

  // Week start (Monday)
  const weekStart = (() => {
    const d = new Date(viewYear, viewMonth, now.getDate())
    const dow = (d.getDay()+6)%7
    d.setDate(d.getDate()-dow)
    return d
  })()

  const prevPeriod = () => {
    if (viewMode==='month') viewMonth===0 ? (setViewMonth(11),setViewYear(y=>y-1)) : setViewMonth(m=>m-1)
    else { const d=new Date(weekStart); d.setDate(d.getDate()-7); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()) }
  }
  const nextPeriod = () => {
    if (viewMode==='month') viewMonth===11 ? (setViewMonth(0),setViewYear(y=>y+1)) : setViewMonth(m=>m+1)
    else { const d=new Date(weekStart); d.setDate(d.getDate()+7); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()) }
  }

  const upcoming = [...filtered]
    .filter(e=>new Date(e.start_date+'T00:00:00')>=new Date(now.toDateString()))
    .sort((a,b)=>a.start_date.localeCompare(b.start_date))
    .slice(0,6)

  const myPending = events.filter(e=>
    needsRSVP(e.event_type) &&
    (e.tagged_profiles||[]).includes(user?.id) &&
    !(e.rsvp||{})[user?.id]
  )

  if (loading) return <div className="p-6"><Skeleton className="h-96"/></div>

  return (
    <div className="p-4 lg:p-6 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-sm font-bold text-[#0f172a]">Hadisələr Təqvimi</h1>
          <p className="text-[11px] text-[#888] mt-0.5">
            {filtered.length} hadisə
            {myPending.length>0 && <span className="ml-2 text-amber-600 font-semibold">· {myPending.length} cavab gözləyir</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-[#e8e8e4] rounded-lg overflow-hidden">
            <button onClick={()=>setViewMode('month')}
              className={`px-2.5 py-1.5 transition-colors ${viewMode==='month'?'bg-[#0f172a] text-white':'text-[#555] hover:bg-[#f5f5f0]'}`}>
              <IconGridDots size={14}/>
            </button>
            <button onClick={()=>setViewMode('week')}
              className={`px-2.5 py-1.5 transition-colors ${viewMode==='week'?'bg-[#0f172a] text-white':'text-[#555] hover:bg-[#f5f5f0]'}`}>
              <IconColumns size={14}/>
            </button>
          </div>
          <Button onClick={()=>{setEditEvent(null);setFullModal(true)}} size="sm">
            <IconPlus size={14}/> Yeni hadisə
          </Button>
        </div>
      </div>

      {/* RSVP xəbərdarlığı */}
      {myPending.length>0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
          <span className="text-xl">📬</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-amber-800">Cavab gözləyən dəvətlər ({myPending.length})</div>
            <div className="text-[10px] text-amber-700 truncate">{myPending.map(e=>e.title).join(' · ')}</div>
          </div>
          <button onClick={()=>setSheet(myPending[0])}
            className="text-[11px] font-bold text-amber-800 border border-amber-300 rounded-xl px-3 py-1.5 hover:bg-amber-100 transition-colors flex-shrink-0">
            Cavabla →
          </button>
        </div>
      )}

      {/* Filterlər */}
      <div className="flex flex-wrap gap-1.5 mb-5 items-center">
        <button onClick={()=>setFilterType('all')}
          className={`text-[11px] px-3 py-1.5 rounded-full border font-medium transition-all ${
            filterType==='all' ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'bg-white text-[#555] border-[#e8e8e4] hover:border-[#0f172a]'
          }`}>Hamısı</button>
        {TYPES.map(t=>(
          <button key={t.key} onClick={()=>setFilterType(filterType===t.key?'all':t.key)}
            className="text-[11px] px-3 py-1.5 rounded-full border font-medium transition-all"
            style={filterType===t.key
              ? {background:t.dot,color:'white',borderColor:t.dot}
              : {background:'white',color:'#555',borderColor:'#e8e8e4'}}>
            {t.emoji} {t.label}
          </button>
        ))}
        <div className="w-px h-4 bg-[#e8e8e4] mx-1"/>
        <button onClick={()=>setFilterUser('mine')}
          className={`text-[11px] px-3 py-1.5 rounded-full border font-medium transition-all ${
            filterUser==='mine'?'bg-[#0f172a] text-white border-[#0f172a]':'bg-white text-[#555] border-[#e8e8e4] hover:border-[#0f172a]'
          }`}>
          🙋 Mənim
        </button>
        {members.filter(m=>m.id!==user?.id).map(m=>(
          <button key={m.id} onClick={()=>setFilterUser(filterUser===m.id?'all':m.id)}
            className={`text-[11px] px-3 py-1.5 rounded-full border font-medium transition-all ${
              filterUser===m.id?'bg-[#0f172a] text-white border-[#0f172a]':'bg-white text-[#555] border-[#e8e8e4] hover:border-[#0f172a]'
            }`}>
            {m.full_name.split(' ')[0]} {m.full_name.split(' ')[1]?.[0]}.
          </button>
        ))}
        {filterUser!=='all' && (
          <button onClick={()=>setFilterUser('all')} className="text-[10px] text-[#aaa] hover:text-[#555] flex items-center gap-0.5">
            <IconX size={10}/> Sıfırla
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevPeriod} className="w-8 h-8 flex items-center justify-center rounded-xl border border-[#e8e8e4] hover:bg-[#f5f5f0] transition-colors">
          <IconChevronLeft size={14} className="text-[#555]"/>
        </button>
        <div className="text-center">
          <div className="text-sm font-bold text-[#0f172a]">{MONTHS[viewMonth]} {viewYear}</div>
        </div>
        <button onClick={nextPeriod} className="w-8 h-8 flex items-center justify-center rounded-xl border border-[#e8e8e4] hover:bg-[#f5f5f0] transition-colors">
          <IconChevronRight size={14} className="text-[#555]"/>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Təqvim / Həftəlik ── */}
        <div className="lg:col-span-2">
          {viewMode==='week' ? (
            <div className="space-y-3">
              <WeekView
                events={filtered} members={members}
                weekStart={weekStart}
                onEventClick={e=>setSheet(e)}
                onDayClick={ds=>{setQuickDay(ds); setQuickTime('')}}
              />
              {quickDay && viewMode==='week' && (
                <div className="relative">
                  <QuickAdd
                    date={quickDay}
                    time={quickTime}
                    members={members}
                    isAdmin={isAdmin}
                    onSave={form=>handleSave(form, null)}
                    onExpand={()=>{setQuickDay(null);setEditEvent(null);setFullModal(true)}}
                    onClose={()=>setQuickDay(null)}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-[#e8e8e4] rounded-2xl" style={{overflow:'visible'}}>
              {/* Day headers */}
              <div className="grid grid-cols-7 bg-[#fafafa] border-b border-[#f0f0ec] rounded-t-2xl overflow-hidden">
                {WEEKDAYS.map((d,i)=>(
                  <div key={d} className={`py-2.5 text-center text-[10px] font-bold uppercase tracking-wider ${i>=5?'text-[#ddd]':'text-[#c0c0c0]'}`}>{d}</div>
                ))}
              </div>

              {/* Grid cells */}
              <div className="grid grid-cols-7" style={{overflow:'visible'}}>
                {cells.map((day,i)=>{
                  const dayEvs = eventsForDay(day)
                  const isToday = day && viewYear===now.getFullYear() && viewMonth===now.getMonth() && day===now.getDate()
                  const isWeekend = i%7>=5
                  const ds = day ? dayStr(day) : null
                  const hasPending = dayEvs.some(e=>needsRSVP(e.event_type)&&(e.tagged_profiles||[]).includes(user?.id)&&!(e.rsvp||{})[user?.id])
                  const isQuick = !!quickDay && quickDay===ds

                  return (
                    <div key={i} className="relative" style={{zIndex: quickDay===ds ? 20 : 'auto'}}>
                      <div
                        className={`min-h-[90px] p-1.5 border-b border-r border-[#f5f5f0] transition-colors ${
                          day?'cursor-pointer hover:bg-[#fafaf8]':''
                        } ${isWeekend&&day?'bg-[#fafafa]':''} ${isToday?'bg-blue-50/30':''}`}
                        onClick={()=>{
                          if (!day) return
                          setQuickDay(ds)
                          setQuickTime('')
                        }}
                      >
                        {day && (
                          <>
                            <div className="flex items-center justify-between mb-1">
                              <div className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold cursor-default ${
                                isToday ? 'bg-[#0f172a] text-white' : isWeekend ? 'text-[#ccc]' : 'text-[#0f172a]'
                              }`}>{day}</div>
                              {hasPending && <div className="w-1.5 h-1.5 rounded-full bg-amber-400"/>}
                            </div>
                            {dayEvs.map(e=>{
                              const t = tp(e.event_type)
                              return (
                                <div key={e.id}
                                  className="text-[9px] px-1.5 py-0.5 rounded-md truncate mb-0.5 cursor-pointer font-semibold hover:opacity-75 transition-opacity"
                                  style={{background:t.bg, color:t.text, borderLeft:`2px solid ${t.dot}`}}
                                  onClick={ev=>{ev.stopPropagation(); setSheet(e)}}>
                                  {t.emoji} {e.title}{e.start_time && <span className="opacity-60 ml-1">{e.start_time}</span>}
                                </div>
                              )
                            })}
                          </>
                        )}
                      </div>

                      {/* QuickAdd dropdown */}
                      {isQuick && (
                        <QuickAdd
                          date={ds}
                          time={quickTime}
                          members={members}
                          isAdmin={isAdmin}
                          onSave={form=>handleSave(form, null)}
                          onExpand={()=>{
                            setQuickDay(null)
                            setEditEvent(null)
                            setFullModal(true)
                          }}
                          onClose={()=>setQuickDay(null)}
                        />
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

          {/* Növlər */}
          <div className="bg-white border border-[#e8e8e4] rounded-2xl p-4">
            <div className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-3">Növlər</div>
            <div className="space-y-1">
              {TYPES.map(t=>(
                <button key={t.key} onClick={()=>setFilterType(filterType===t.key?'all':t.key)}
                  className={`flex items-center gap-2 w-full py-1.5 px-2 rounded-lg transition-colors ${filterType===t.key?'bg-[#f5f5f0]':'hover:bg-[#fafafa]'}`}>
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:t.dot}}/>
                  <span className="text-[11px] text-[#555] flex-1 text-left">{t.emoji} {t.label}</span>
                  <span className="text-[10px] text-[#ccc]">{events.filter(e=>e.event_type===t.key).length}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Yaxınlaşan */}
          <div className="bg-white border border-[#e8e8e4] rounded-2xl p-4">
            <div className="text-[10px] font-bold text-[#aaa] uppercase tracking-wider mb-3">Yaxınlaşan</div>
            {upcoming.length===0 ? (
              <div className="text-[11px] text-[#ccc] text-center py-4">Yaxın hadisə yoxdur</div>
            ) : (
              <div className="space-y-2">
                {upcoming.map(e=>{
                  const t=tp(e.event_type)
                  const dl=daysUntil(e.start_date)
                  const tagged=(e.tagged_profiles||[]).map(id=>members.find(m=>m.id===id)?.full_name?.split(' ')[0]).filter(Boolean)
                  const myRSVP=(e.rsvp||{})[user?.id]
                  const pendingMe=needsRSVP(e.event_type)&&(e.tagged_profiles||[]).includes(user?.id)&&!myRSVP

                  return (
                    <div key={e.id}
                      className={`flex gap-2.5 p-2.5 rounded-xl border cursor-pointer hover:shadow-sm transition-all ${
                        pendingMe?'border-amber-200 bg-amber-50/40':'border-[#f0f0ec] hover:border-[#e8e8e4]'
                      }`}
                      onClick={()=>setSheet(e)}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{background:t.bg}}>{t.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-[#0f172a] truncate">{e.title}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-[#aaa]">{fmtDate(e.start_date)}</span>
                          {e.start_time&&<span className="text-[9px] text-[#bbb]">· {e.start_time}</span>}
                          <span className="text-[10px] font-semibold ml-auto" style={{color:t.dot}}>
                            {dl<0?`${Math.abs(dl)}g keçib`:dl===0?'Bu gün':dl===1?'Sabah':`${dl}g`}
                          </span>
                        </div>
                        {tagged.length>0&&(
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {tagged.slice(0,3).map(n=>(
                              <span key={n} className="text-[9px] bg-[#f5f5f0] text-[#777] px-1.5 py-0.5 rounded-full">{n}</span>
                            ))}
                            {tagged.length>3&&<span className="text-[9px] text-[#bbb]">+{tagged.length-3}</span>}
                          </div>
                        )}
                        {pendingMe&&<div className="text-[9px] text-amber-600 font-bold mt-1">⏳ Cavab gözləyir</div>}
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
      <EventModal
        open={fullModal}
        onClose={()=>{setFullModal(false);setEditEvent(null)}}
        onSave={form=>handleSave(form, editEvent?.id)}
        event={editEvent}
        members={members}
        defaultDate={todayStr()}
        isAdmin={isAdmin}
      />

      {sheet && (
        <EventSheet
          event={sheet}
          members={members}
          user={user}
          onClose={()=>setSheet(null)}
          onEdit={e=>{setSheet(null);setEditEvent(e);setFullModal(true)}}
          onDelete={e=>{setSheet(null);setDeleteEv(e)}}
          onRSVP={handleRSVP}
        />
      )}

      <ConfirmDialog
        open={!!deleteEv}
        title="Hadisəni sil"
        message={`"${deleteEv?.title}" silmək istədiyinizə əminsiniz?`}
        onConfirm={handleDelete}
        onCancel={()=>setDeleteEv(null)}
        danger
      />
    </div>
  )
}
