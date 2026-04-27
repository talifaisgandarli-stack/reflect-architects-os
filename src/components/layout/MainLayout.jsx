import { useState, useEffect, useRef, useCallback } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { IconBell, IconX, IconSearch, IconMenu2, IconCheck, IconCheckbox, IconAlertCircle, IconInfoCircle, IconCircleCheck } from '@tabler/icons-react'

// ─── Notification helpers ─────────────────────────────────────────────────────
export async function notify(user_id, title, body = null, type = 'info', link = null) {
  if (!user_id) return
  try {
    await supabase.from('notifications').insert({ user_id, title, body, type, link })
  } catch (e) {
    console.error('notify error:', e.message)
  }
}

export async function notifyAll(title, body = null, type = 'info', link = null, exclude_id = null) {
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_active', true)
    const targets = (profiles || []).filter(p => p.id !== exclude_id)
    if (!targets.length) return
    await supabase.from('notifications').insert(
      targets.map(p => ({ user_id: p.id, title, body, type, link }))
    )
  } catch (e) {
    console.error('notifyAll error:', e.message)
  }
}

// ─── Notification icon ────────────────────────────────────────────────────────
function NotifIcon({ type }) {
  if (type === 'success') return <IconCircleCheck size={14} className="text-green-500 flex-shrink-0" />
  if (type === 'error')   return <IconAlertCircle  size={14} className="text-red-500 flex-shrink-0" />
  if (type === 'warning') return <IconAlertCircle  size={14} className="text-yellow-500 flex-shrink-0" />
  return <IconInfoCircle size={14} className="text-blue-500 flex-shrink-0" />
}

// ─── Notification panel ───────────────────────────────────────────────────────
function NotifPanel({ notifs, onRead, onReadAll, onClose, navigate }) {
  const unread = notifs.filter(n => !n.read).length

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#e8e8e4] z-50 overflow-hidden"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0ec]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#0f172a]">Bildirişlər</span>
          {unread > 0 && (
            <span className="text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unread}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={onReadAll}
              className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700 font-medium">
              <IconCheck size={11} /> Hamısını oxu
            </button>
          )}
          <button onClick={onClose} className="text-[#aaa] hover:text-[#555] p-0.5">
            <IconX size={13} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {notifs.length === 0 ? (
          <div className="py-10 text-center">
            <IconBell size={24} className="text-[#e8e8e4] mx-auto mb-2" />
            <p className="text-xs text-[#bbb]">Bildiriş yoxdur</p>
          </div>
        ) : notifs.map(n => (
          <div
            key={n.id}
            onClick={() => {
              if (!n.read) onRead(n.id)
              if (n.link) { navigate(n.link); onClose() }
            }}
            className={`flex items-start gap-3 px-4 py-3 border-b border-[#f8f8f5] last:border-0 transition-colors ${
              n.link ? 'cursor-pointer hover:bg-[#fafaf8]' : ''
            } ${!n.read ? 'bg-blue-50/40' : ''}`}
          >
            <div className="mt-0.5"><NotifIcon type={n.type} /></div>
            <div className="flex-1 min-w-0">
              <div className={`text-xs leading-snug ${!n.read ? 'font-semibold text-[#0f172a]' : 'font-medium text-[#444]'}`}>
                {n.title}
              </div>
              {n.body && (
                <div className="text-[10px] text-[#888] mt-0.5 leading-relaxed line-clamp-2">{n.body}</div>
              )}
              <div className="text-[9px] text-[#bbb] mt-1">
                {new Date(n.created_at).toLocaleString('az-AZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function MainLayout() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const [searchOpen,   setSearchOpen]   = useState(false)
  const [searchQuery,  setSearchQuery]  = useState('')
  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [notifOpen,    setNotifOpen]    = useState(false)
  const [notifs,       setNotifs]       = useState([])
  const bellRef = useRef(null)

  // Load notifications
  const loadNotifs = useCallback(async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
    setNotifs(data || [])
  }, [user?.id])

  useEffect(() => {
    loadNotifs()
  }, [loadNotifs])

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel('notifications:' + user.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifs(prev => [payload.new, ...prev].slice(0, 30))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user?.id])

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [notifOpen])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
      if (e.key === 'Escape') { setSearchOpen(false); setSidebarOpen(false); setNotifOpen(false) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  async function markRead(id) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllRead() {
    if (!user?.id) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifs.filter(n => !n.read).length
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'RA'

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafaf8]">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar onSearch={() => { setSearchOpen(true); setSidebarOpen(false) }} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <div className="h-11 bg-white border-b border-[#e8e8e4] flex items-center px-3 lg:px-5 gap-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#888] hover:text-[#0f172a] p-1">
            <IconMenu2 size={18} />
          </button>

          <div className="flex-1" />

          {/* Search */}
          <button onClick={() => setSearchOpen(true)} className="text-[#888] hover:text-[#0f172a] transition-colors hidden sm:block">
            <IconSearch size={16} />
          </button>

          {/* Bell */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => setNotifOpen(v => !v)}
              className={`relative text-[#888] hover:text-[#0f172a] transition-colors p-1 rounded-lg ${notifOpen ? 'bg-[#f5f5f0] text-[#0f172a]' : ''}`}
            >
              <IconBell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-black text-white px-0.5">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <NotifPanel
                notifs={notifs}
                onRead={markRead}
                onReadAll={markAllRead}
                onClose={() => setNotifOpen(false)}
                navigate={navigate}
              />
            )}
          </div>

          {/* User */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#0f172a] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[9px] font-bold">{initials}</span>
            </div>
            <span className="text-xs text-[#0f172a] font-medium hidden sm:block">
              {profile?.full_name?.split(' ')[0] || 'İstifadəçi'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>

      {/* Search modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4"
          onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden fade-in"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e8e8e4]">
              <IconSearch size={16} className="text-[#aaa]" />
              <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Layihə, tapşırıq, sifarişçi axtar..."
                className="flex-1 text-sm text-[#0f172a] outline-none placeholder-[#bbb]" />
              <button onClick={() => setSearchOpen(false)} className="text-[#aaa] hover:text-[#555]">
                <IconX size={16} />
              </button>
            </div>
            <div className="p-4 text-sm text-[#aaa] text-center">
              Axtarış üçün yazmağa başlayın...
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
